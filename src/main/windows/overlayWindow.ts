import {
  BrowserWindow,
  screen,
} from 'electron';
import { join } from 'path';

let overlayWindow: BrowserWindow | null = null;
let isClickThrough = true;
let isEditMode = false;

/**
 * Creates the transparent, always-on-top overlay window that renders HUD
 * widgets on top of the game. Hidden by default; shown via IPC.
 */
export function createOverlayWindow(): BrowserWindow {
  const displays = screen.getAllDisplays();
  
  // Calculate bounding box spanning all displays (for multi-monitor support)
  let minX = 0, minY = 0, maxX = 0, maxY = 0;
  for (const d of displays) {
    minX = Math.min(minX, d.bounds.x);
    minY = Math.min(minY, d.bounds.y);
    maxX = Math.max(maxX, d.bounds.x + d.bounds.width);
    maxY = Math.max(maxY, d.bounds.y + d.bounds.height);
  }
  const totalWidth = maxX - minX || 1920;
  const totalHeight = maxY - minY || 1080;

  overlayWindow = new BrowserWindow({
    width: totalWidth,
    height: totalHeight,
    x: minX,
    y: minY,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    focusable: true,
    fullscreenable: false,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, '../preload/overlay.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  // Allow window to be interactive by default (forward events when ignoring)
  overlayWindow.setIgnoreMouseEvents(false);
  isClickThrough = false;

  // Prevent the overlay from appearing in the taskbar alt-tab list on Windows
  overlayWindow.setAlwaysOnTop(true, 'screen-saver');

  // Load the overlay HTML
  if (process.env.ELECTRON_RENDERER_URL) {
    overlayWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}/overlay.html`);
  } else {
    overlayWindow.loadFile(join(__dirname, '../renderer/overlay.html'));
  }

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });

  return overlayWindow;
}

/**
 * Returns the overlay BrowserWindow instance, or null if not created.
 */
export function getOverlayWindow(): BrowserWindow | null {
  return overlayWindow;
}

/**
 * Shows the overlay window if hidden, hides it if visible.
 * Returns the new visibility state.
 */
export function toggleOverlayVisibility(): boolean {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    createOverlayWindow();
    if (overlayWindow) {
      overlayWindow.showInactive();
      return true;
    }
    return false;
  }

  if (overlayWindow.isVisible()) {
    overlayWindow.hide();
    return false;
  } else {
    overlayWindow.showInactive(); // Don't steal focus from the game
    return true;
  }
}

/**
 * Toggles click-through mode on the overlay.
 *
 * When click-through is ON (default):
 *   - Mouse events pass through to the game
 *   - HUD widgets cannot be interacted with
 *
 * When click-through is OFF:
 *   - Mouse events are captured by the overlay
 *   - User can drag/resize/configure HUD widgets
 *
 * Returns the new click-through state.
 */
export function toggleClickThrough(): boolean {
  if (!overlayWindow || overlayWindow.isDestroyed()) return true;

  isClickThrough = !isClickThrough;

  if (isClickThrough) {
    overlayWindow.setIgnoreMouseEvents(true, { forward: true });
    overlayWindow.setFocusable(false);
    isEditMode = false;
  } else {
    overlayWindow.setIgnoreMouseEvents(false);
    overlayWindow.setFocusable(true);
    overlayWindow.focus();
    isEditMode = true;
  }

  // Notify the overlay renderer about edit mode change
  if (!overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send('overlay:toggle-edit', isEditMode);
  }

  return isClickThrough;
}

/**
 * Explicitly set click-through state.
 */
export function setClickThrough(enabled: boolean): void {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;

  isClickThrough = enabled;

  if (isClickThrough) {
    overlayWindow.setIgnoreMouseEvents(true, { forward: true });
    overlayWindow.setFocusable(false);
    isEditMode = false;
  } else {
    overlayWindow.setIgnoreMouseEvents(false);
    overlayWindow.setFocusable(true);
    isEditMode = true;
  }

  if (!overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send('overlay:toggle-edit', isEditMode);
  }
}

/**
 * Returns whether the overlay is currently in click-through mode.
 */
export function isOverlayClickThrough(): boolean {
  return isClickThrough;
}

/**
 * Returns whether the overlay is currently in edit mode.
 */
export function isOverlayEditMode(): boolean {
  return isEditMode;
}
