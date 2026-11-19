// ─────────────────────────────────────────────────────────────────────────────
// index.ts – Electron Main Process Entry Point for ApexTelemetry Studio
// ─────────────────────────────────────────────────────────────────────────────

// earlyInit MUST be the FIRST import – calls app.disableHardwareAcceleration()
// before any BrowserWindow is created (required for transparency on Windows).
import './earlyInit';

process.env.WS_NO_BUFFER_UTIL = 'true';
process.env.WS_NO_UTF_8_VALIDATE = 'true';

import { app, BrowserWindow, protocol, ipcMain } from 'electron';
import { SimAutoDetector } from '../telemetry/SimAutoDetector';
import { createMainWindow, getMainWindow } from './windows/mainWindow';
import { createOverlayWindow, getOverlayWindow } from './windows/overlayWindow';
import { registerAllHandlers } from './ipc/handlers';
import { registerDatabaseIPC } from './ipc/databaseIPC';
import { registerGlobalShortcuts, unregisterGlobalShortcuts } from './shortcuts';
import { TelemetryBus } from '../telemetry/TelemetryBus';
import { CompanionServer } from '../services/companion/CompanionServer';
import { getDatabase } from '../database/Database';
import { subscribeTelemetryWindow, broadcastTelemetryData } from './ipc/telemetryIPC';
import Store from 'electron-store';
import { AppSettings } from '../shared/ipc-types';

// ─── Single Instance Lock ────────────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Another instance is already running – bring it to focus and exit
  app.quit();
} else {
  let telemetryBus: TelemetryBus | null = null;
  let companionServer: CompanionServer | null = null;
  let store: Store<AppSettings> | null = null;
  let detector: SimAutoDetector | null = null;

  // When a second instance tries to open, focus the existing main window
  app.on('second-instance', () => {
    const mainWin = getMainWindow();
    if (mainWin) {
      if (mainWin.isMinimized()) mainWin.restore();
      mainWin.focus();
    }
  });

  // Register deep-link protocol for Steam Auth callback
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'apextelemetry',
      privileges: { secure: true, standard: true, supportFetchAPI: true },
    },
  ]);

  // ─── App Ready ──────────────────────────────────────────────────────────
  app.whenReady().then(async () => {
    // 1. Initialize settings store & SQLite database
    store = new Store<AppSettings>();
    const db = getDatabase();

    // 2. Initialize Telemetry and Companion services
    telemetryBus = TelemetryBus.getInstance();
    companionServer = new CompanionServer();

    const companionPort = (store.get('network.companionPort' as any) as number) || 8777;
    try {
      await companionServer.start(companionPort);
    } catch (err) {
      console.warn('[CompanionServer] Start warning:', err);
    }

    // 3. Create windows
    const mainWindow = createMainWindow();
    // Do not create overlay window automatically at startup; create on-demand when user clicks START OVERLAYS
    // const overlayWindow = createOverlayWindow();

    // 4. Register IPC channels
    registerAllHandlers({
      db,
      store: store as any,
      telemetryBus,
      companionServer: companionServer as any,
    });
    registerDatabaseIPC(db);

    // 5. Connect telemetry streaming to windows
    subscribeTelemetryWindow(mainWindow);

    telemetryBus.on('data', (frame: any) => {
      broadcastTelemetryData(frame);
      if (companionServer?.isRunning()) {
        companionServer.broadcast(frame);
      }
    });

    // Auto-start ACC telemetry listener
    telemetryBus.start('acc');

    // 6. Auto-detect active sim
    detector = SimAutoDetector.getInstance();
    detector.startPolling(2000);

    ipcMain.handle('sim:get-active', () => {
      return detector?.getActiveSim() ?? null;
    });

    detector.on('sim-change', (activeInfo: any) => {
      const mainWin = getMainWindow();
      if (mainWin && !mainWin.isDestroyed()) {
        mainWin.webContents.send('sim:changed', activeInfo);
      }
      if (activeInfo?.isRunning && activeInfo?.game) {
        telemetryBus?.start(activeInfo.game.adapterKey);
      }
    });

    // 7. Global shortcuts (e.g. Ctrl+Shift+L = toggle click-through)
    registerGlobalShortcuts();

    // macOS: re-create window if dock icon clicked and no windows open
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });

  // ─── Cleanup on Quit ────────────────────────────────────────────────────
  const cleanExit = () => {
    try { unregisterGlobalShortcuts(); } catch {}
    try { detector?.stopPolling(); } catch {}
    try { telemetryBus?.stop(); } catch {}
    try { companionServer?.stop(); } catch {}

    const overlayWin = getOverlayWindow();
    if (overlayWin && !overlayWin.isDestroyed()) {
      try { overlayWin.destroy(); } catch {}
    }
  };

  app.on('before-quit', cleanExit);

  app.on('will-quit', () => {
    cleanExit();
    // Force complete exit of the node process tree
    setTimeout(() => {
      process.exit(0);
    }, 100);
  });

  // Quit when all windows are closed (Windows/Linux behavior)
  app.on('window-all-closed', () => {
    cleanExit();
    app.quit();
  });
}
