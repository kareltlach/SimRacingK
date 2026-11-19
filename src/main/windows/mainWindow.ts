import { BrowserWindow, app } from 'electron';
import { join } from 'path';

let mainWindow: BrowserWindow | null = null;

export function createMainWindow(): BrowserWindow {
  const isMac = process.platform === 'darwin';

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1200,
    minHeight: 800,
    backgroundColor: '#0a0a0f',
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    show: true,  // Show immediately when created
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  });

  // Show only when page is ready – prevents white flash on startup
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  // Fallback: if ready-to-show doesn't fire within 5s, show anyway
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
    }
  }, 5000);

  mainWindow.webContents.on('did-fail-load', (_e, errorCode, errorDesc) => {
    console.error('[MainWindow] Failed to load:', errorCode, errorDesc);
  });

  mainWindow.webContents.on('crashed', (e) => {
    console.error('[MainWindow] Render process crashed:', e);
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // Open DevTools in dev mode to see any renderer errors
  // if (process.env.ELECTRON_RENDERER_URL || !app.isPackaged) {
  //   mainWindow.webContents.openDevTools();
  // }

  mainWindow.on('closed', () => {
    mainWindow = null;
    // Force quit the entire app when main window closes.
    // This ensures all child processes (overlay, telemetry) are killed too.
    app.quit();
  });

  return mainWindow;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}
