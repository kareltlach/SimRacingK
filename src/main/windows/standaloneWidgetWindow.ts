import { BrowserWindow } from 'electron';
import { join } from 'path';
import { subscribeTelemetryWindow, unsubscribeTelemetryWindow } from '../ipc/telemetryIPC';

export interface StandaloneWidgetConfig {
  id: string;
  name: string;
  type: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
  scale?: number;
  opacity?: number;
  theme?: string;
}

// Active standalone widget windows mapped by widget ID
const standaloneWindows = new Map<string, BrowserWindow>();

/**
 * Creates or shows a dedicated, resizable, floating overlay window for a single widget.
 * Styled exactly like RaceLab overlay windows: frameless, transparent, resizable, alwaysOnTop.
 */
export function openStandaloneWidgetWindow(config: StandaloneWidgetConfig): BrowserWindow {
  const existingWin = standaloneWindows.get(config.id);
  if (existingWin && !existingWin.isDestroyed()) {
    existingWin.show();
    existingWin.focus();
    return existingWin;
  }

  const initialWidth = Math.max(200, config.width || 400);
  const initialHeight = Math.max(120, config.height || 240);

  const win = new BrowserWindow({
    width: initialWidth,
    height: initialHeight,
    x: config.x !== undefined ? config.x : undefined,
    y: config.y !== undefined ? config.y : undefined,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    hasShadow: true,
    focusable: true,
    show: false, // Show only after content is ready to avoid blank flash
    backgroundColor: '#00000000',
    minWidth: 160,
    minHeight: 90,
    webPreferences: {
      // Use the same preload as the main window (index.js is always built).
      // The overlay preload (overlay.js) requires a separate build step that
      // may not always be present. index.js exposes window.api which the
      // OverlayApp reads via (window.api || window.overlayApi).
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  win.setAlwaysOnTop(true, 'screen-saver');

  // Show when page is ready — prevents blank white flash
  win.once('ready-to-show', () => {
    win.showInactive(); // Don't steal focus from the game
  });

  // Fallback: show after 3s even if ready-to-show doesn't fire
  const showFallback = setTimeout(() => {
    if (!win.isDestroyed() && !win.isVisible()) {
      win.showInactive();
    }
  }, 3000);

  win.once('closed', () => clearTimeout(showFallback));

  // Load index.html with query parameters identifying the specific widget.
  // NOTE: electron-vite v3 only builds a single renderer entry (index.html),
  // so we always use index.html. OverlayApp detects ?standalone=1 and renders
  // only the requested widget instead of the full main UI.
  const query = `?widgetId=${encodeURIComponent(config.id)}&widgetType=${encodeURIComponent(config.type)}&widgetName=${encodeURIComponent(config.name || config.id)}&standalone=1&initW=${initialWidth}&initH=${initialHeight}&trackId=${encodeURIComponent((config as any).trackId || '')}`;
  if (process.env.ELECTRON_RENDERER_URL) {
    // Dev mode: Vite dev server serves index.html at root
    win.loadURL(`${process.env.ELECTRON_RENDERER_URL}${query}`);
  } else {
    // Production: load compiled index.html with query string
    win.loadFile(join(__dirname, '../renderer/index.html'), {
      query: {
        widgetId: config.id,
        widgetType: config.type,
        widgetName: config.name || config.id,
        standalone: '1',
        initW: String(initialWidth),
        initH: String(initialHeight),
        trackId: (config as any).trackId || '',
      },
    });
  }

  subscribeTelemetryWindow(win);

  standaloneWindows.set(config.id, win);

  win.on('closed', () => {
    unsubscribeTelemetryWindow(win);
    standaloneWindows.delete(config.id);
  });

  return win;
}

export function closeStandaloneWidgetWindow(widgetId: string): boolean {
  const win = standaloneWindows.get(widgetId);
  if (win && !win.isDestroyed()) {
    win.close();
    standaloneWindows.delete(widgetId);
    return true;
  }
  return false;
}

export function getAllStandaloneWindows(): BrowserWindow[] {
  return Array.from(standaloneWindows.values()).filter((w) => !w.isDestroyed());
}

export function closeAllStandaloneWindows(): void {
  for (const win of standaloneWindows.values()) {
    if (!win.isDestroyed()) {
      try {
        win.destroy();
      } catch {}
    }
  }
  standaloneWindows.clear();
}
