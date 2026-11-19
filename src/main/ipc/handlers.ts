import { ipcMain, BrowserWindow, app } from 'electron';
import { IPC_CHANNELS, HudLayout, AppSettings } from '../../shared/ipc-types';
import type { SqliteDatabase } from '../../database/Database';
import type ElectronStore from 'electron-store';
import {
  toggleOverlayVisibility,
  setClickThrough,
  getOverlayWindow,
} from '../windows/overlayWindow';
import { getMainWindow } from '../windows/mainWindow';
import {
  broadcastTelemetryData,
  subscribeTelemetryWindow,
  unsubscribeTelemetryWindow,
} from './telemetryIPC';
import {
  openStandaloneWidgetWindow,
  closeStandaloneWidgetWindow,
} from '../windows/standaloneWidgetWindow';

// ─── Service References ─────────────────────────────────────────────────────

interface HandlerDependencies {
  db: SqliteDatabase;
  store: ElectronStore<AppSettings>;
  telemetryBus: TelemetryBusLike;
  companionServer: CompanionServerLike;
}

/** Minimal interface for the TelemetryBus so handlers can start/stop it */
interface TelemetryBusLike {
  start(): void;
  stop(): void;
  isRunning(): boolean;
  on(event: string, handler: (...args: unknown[]) => void): void;
  off(event: string, handler: (...args: unknown[]) => void): void;
}

/** Minimal interface for the CompanionServer */
interface CompanionServerLike {
  start(port: number): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
  getPort(): number;
  getConnectedClients(): number;
  getUrl(): string;
  generateQRCode(): Promise<string>;
}

/**
 * Registers all IPC handlers for the application.
 *
 * This is the central IPC registration point. Handlers are grouped
 * by domain: telemetry, overlay, settings, steam, companion, app.
 *
 * Database handlers are registered separately in databaseIPC.ts.
 */
export function registerAllHandlers(deps: HandlerDependencies): void {
  const { db, store, telemetryBus, companionServer } = deps;

  // ─── Telemetry ──────────────────────────────────────────────────────────

  /**
   * Start the telemetry listener for the specified sim (or auto-detect).
   */
  ipcMain.handle(IPC_CHANNELS.TELEMETRY_START, (_event, sim?: string) => {
    if (telemetryBus.isRunning()) {
      return { success: false, error: 'Telemetry is already running' };
    }

    try {
      telemetryBus.start();

      // Subscribe both windows to the telemetry data stream
      const mainWindow = getMainWindow();
      const overlayWindow = getOverlayWindow();
      if (mainWindow) subscribeTelemetryWindow(mainWindow);
      if (overlayWindow) subscribeTelemetryWindow(overlayWindow);

      return { success: true, sim: sim ?? 'auto-detect' };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  });

  /**
   * Stop the telemetry listener.
   */
  ipcMain.handle(IPC_CHANNELS.TELEMETRY_STOP, () => {
    try {
      telemetryBus.stop();

      const mainWindow = getMainWindow();
      const overlayWindow = getOverlayWindow();
      if (mainWindow) unsubscribeTelemetryWindow(mainWindow);
      if (overlayWindow) unsubscribeTelemetryWindow(overlayWindow);

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  });

  /**
   * Get the current telemetry connection status.
   */
  ipcMain.handle(IPC_CHANNELS.TELEMETRY_STATUS, () => {
    return {
      running: telemetryBus.isRunning(),
    };
  });

  // ─── Overlay ────────────────────────────────────────────────────────────

  /**
   * Toggle overlay visibility.
   */
  ipcMain.handle(IPC_CHANNELS.OVERLAY_TOGGLE, () => {
    const isVisible = toggleOverlayVisibility();
    return { visible: isVisible };
  });

  /**
   * Set overlay click-through mode.
   */
  ipcMain.handle(
    IPC_CHANNELS.OVERLAY_SET_CLICK_THROUGH,
    (_event, enabled: boolean) => {
      setClickThrough(enabled);
      return { clickThrough: enabled };
    },
  );

  ipcMain.handle('overlay:set-ignore-mouse-events', (_event, ignore: boolean, options?: { forward: boolean }) => {
    // Use the window that sent this IPC call — works for both the main overlay
    // window and any standalone widget window (RaceLab-style floating overlays).
    const win = BrowserWindow.fromWebContents(_event.sender) ?? getOverlayWindow();
    if (win && !win.isDestroyed()) {
      win.setIgnoreMouseEvents(ignore, options ?? {});
    }
    return true;
  });

  ipcMain.handle('overlay:save-widget-pos', (_event, posData: { widgetId: string; x: number; y: number }) => {
    const mainWin = getMainWindow();
    if (mainWin && !mainWin.isDestroyed()) {
      mainWin.webContents.send('overlay:widget-pos-updated', posData);
    }
    return true;
  });

  // ─── Standalone Widget Windows (RaceLab Style) ──────────────────────────
  ipcMain.handle('overlay:open-standalone-widget', (_event, config: any) => {
    const win = openStandaloneWidgetWindow(config);
    return { success: !!win, id: config.id };
  });

  ipcMain.handle('overlay:close-standalone-widget', (_event, widgetId: string) => {
    return { success: closeStandaloneWidgetWindow(widgetId) };
  });

  /**
   * Get all saved HUD layouts.
   */
  ipcMain.handle(IPC_CHANNELS.OVERLAY_GET_LAYOUTS, () => {
    const stmt = db.prepare('SELECT * FROM hud_layouts ORDER BY name ASC');
    const layouts = stmt.all() as HudLayout[];

    return layouts.map((layout) => ({
      ...layout,
      widgets: JSON.parse(layout.widgets_json),
      resolution: JSON.parse(layout.resolution),
    }));
  });

  /**
   * Save a HUD layout (create or update).
   */
  ipcMain.handle(
    IPC_CHANNELS.OVERLAY_SAVE_LAYOUT,
    (
      _event,
      layout: {
        id?: number;
        name: string;
        widgets: unknown[];
        resolution: { width: number; height: number };
        gameRule?: string | null;
        carRule?: string | null;
      },
    ) => {
      const widgetsJson = JSON.stringify(layout.widgets);
      const resolutionJson = JSON.stringify(layout.resolution);

      if (layout.id) {
        // Update existing
        const stmt = db.prepare(
          `UPDATE hud_layouts
           SET name = ?, widgets_json = ?, resolution = ?, game_rule = ?, car_rule = ?
           WHERE id = ?`,
        );
        stmt.run(
          layout.name,
          widgetsJson,
          resolutionJson,
          layout.gameRule ?? null,
          layout.carRule ?? null,
          layout.id,
        );
        return { id: layout.id, updated: true };
      } else {
        // Insert new
        const stmt = db.prepare(
          `INSERT INTO hud_layouts (name, widgets_json, resolution, game_rule, car_rule)
           VALUES (?, ?, ?, ?, ?)`,
        );
        const result = stmt.run(
          layout.name,
          widgetsJson,
          resolutionJson,
          layout.gameRule ?? null,
          layout.carRule ?? null,
        );
        return { id: result.lastInsertRowid as number, updated: false };
      }
    },
  );

  /**
   * Delete a HUD layout by ID.
   */
  ipcMain.handle(IPC_CHANNELS.OVERLAY_DELETE_LAYOUT, (_event, layoutId: number) => {
    const stmt = db.prepare('DELETE FROM hud_layouts WHERE id = ?');
    const result = stmt.run(layoutId);
    return { deleted: result.changes > 0 };
  });

  /**
   * Load a specific HUD layout and push it to the overlay window.
   */
  ipcMain.handle(IPC_CHANNELS.OVERLAY_LOAD_LAYOUT, (_event, layoutId: number) => {
    const stmt = db.prepare('SELECT * FROM hud_layouts WHERE id = ?');
    const layout = stmt.get(layoutId) as HudLayout | undefined;

    if (!layout) {
      throw new Error(`Layout ${layoutId} not found`);
    }

    const parsed = {
      ...layout,
      widgets: JSON.parse(layout.widgets_json),
      resolution: JSON.parse(layout.resolution),
    };

    // Send the layout to the overlay window
    const overlayWindow = getOverlayWindow();
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send(IPC_CHANNELS.OVERLAY_LAYOUT_CHANGED, parsed);
    }

    return parsed;
  });

  // ─── Settings ───────────────────────────────────────────────────────────

  /**
   * Get a settings value by dot-notation path.
   */
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, (_event, key: string) => {
    return store.get(key as keyof AppSettings);
  });

  /**
   * Set a settings value by dot-notation path.
   */
  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_event, key: string, value: unknown) => {
    store.set(key as keyof AppSettings, value as never);
    return { success: true };
  });

  /**
   * Get all settings.
   */
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET_ALL, () => {
    return store.store;
  });

  /**
   * Reset settings to defaults.
   */
  ipcMain.handle(IPC_CHANNELS.SETTINGS_RESET, () => {
    store.clear();
    return { success: true };
  });

  // ─── Steam ──────────────────────────────────────────────────────────────

  /**
   * Get the current Steam profile from the database.
   */
  ipcMain.handle(IPC_CHANNELS.STEAM_GET_PROFILE, () => {
    const stmt = db.prepare('SELECT * FROM steam_profiles ORDER BY created_at DESC LIMIT 1');
    return stmt.get() ?? null;
  });

  /**
   * Save/update Steam login credentials and profile data.
   */
  ipcMain.handle(
    IPC_CHANNELS.STEAM_LOGIN,
    (_event, profile: { steamId: string; nickname: string; avatarUrl: string; apiKey?: string }) => {
      const existing = db.prepare('SELECT * FROM steam_profiles WHERE steam_id = ?').get(profile.steamId);

      if (existing) {
        db.prepare(
          `UPDATE steam_profiles SET nickname = ?, avatar_url = ?, steam_api_key = ?
           WHERE steam_id = ?`,
        ).run(profile.nickname, profile.avatarUrl, profile.apiKey ?? null, profile.steamId);
      } else {
        db.prepare(
          `INSERT INTO steam_profiles (steam_id, nickname, avatar_url, steam_api_key, created_at)
           VALUES (?, ?, ?, ?, ?)`,
        ).run(profile.steamId, profile.nickname, profile.avatarUrl, profile.apiKey ?? null, Date.now());
      }

      return { success: true };
    },
  );

  // ─── Companion Server ───────────────────────────────────────────────────

  /**
   * Get companion server status.
   */
  ipcMain.handle(IPC_CHANNELS.COMPANION_GET_STATUS, () => {
    return {
      running: companionServer.isRunning(),
      port: companionServer.getPort(),
      connectedClients: companionServer.getConnectedClients(),
      url: companionServer.getUrl(),
    };
  });

  /**
   * Generate a QR code for mobile companion connection.
   */
  ipcMain.handle(IPC_CHANNELS.COMPANION_GET_QR_CODE, async () => {
    return companionServer.generateQRCode();
  });

  /**
   * Start the companion server.
   */
  ipcMain.handle(IPC_CHANNELS.COMPANION_START, async (_event, port?: number) => {
    const serverPort = port ?? (store.get('companion.port' as keyof AppSettings) as number) ?? 9090;
    await companionServer.start(serverPort);
    return { success: true, port: serverPort };
  });

  /**
   * Stop the companion server.
   */
  ipcMain.handle(IPC_CHANNELS.COMPANION_STOP, async () => {
    await companionServer.stop();
    return { success: true };
  });

  // ─── App / Window Controls ─────────────────────────────────────────────

  /**
   * Get app version.
   */
  ipcMain.handle(IPC_CHANNELS.APP_GET_VERSION, () => {
    return app.getVersion();
  });

  /**
   * Check for updates (placeholder — integrate with electron-updater).
   */
  ipcMain.handle(IPC_CHANNELS.APP_CHECK_UPDATE, async () => {
    // TODO: Integrate with electron-updater when auto-update is set up
    return { updateAvailable: false, currentVersion: app.getVersion() };
  });

  /**
   * Quit the application.
   */
  ipcMain.handle(IPC_CHANNELS.APP_QUIT, () => {
    app.quit();
  });

  /**
   * Minimize the focused window.
   */
  ipcMain.handle(IPC_CHANNELS.APP_MINIMIZE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.minimize();
  });

  /**
   * Maximize or restore the focused window.
   */
  ipcMain.handle(IPC_CHANNELS.APP_MAXIMIZE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.isMaximized() ? win.unmaximize() : win.maximize();
    }
  });

  /**
   * Close the focused window.
   */
  ipcMain.handle(IPC_CHANNELS.APP_CLOSE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.close();
  });
}

/**
 * Removes all registered IPC handlers.
 * Call during app shutdown for clean teardown.
 */
export function unregisterAllHandlers(): void {
  const allChannels = Object.values(IPC_CHANNELS);
  for (const channel of allChannels) {
    try {
      ipcMain.removeHandler(channel);
    } catch {
      // Handler may not have been registered; that's fine
    }
  }
}
