import { globalShortcut, BrowserWindow } from 'electron';
import {
  toggleOverlayVisibility,
  toggleClickThrough,
  getOverlayWindow,
} from './windows/overlayWindow';
import { getMainWindow } from './windows/mainWindow';
import { IPC_CHANNELS } from '../shared/ipc-types';

/**
 * Keyboard shortcut definitions.
 * Uses Cmd on macOS, Ctrl on Windows/Linux.
 */
const SHORTCUTS = {
  TOGGLE_OVERLAY: process.platform === 'darwin'
    ? 'Command+Shift+O'
    : 'Ctrl+Shift+O',
  TOGGLE_CLICK_THROUGH: process.platform === 'darwin'
    ? 'Command+Shift+L'
    : 'Ctrl+Shift+L',
} as const;

/**
 * Registers all global keyboard shortcuts.
 * Should be called after app 'ready' event.
 */
export function registerGlobalShortcuts(): void {
  // Ctrl/Cmd+Shift+O — Show or hide the overlay window
  globalShortcut.register(SHORTCUTS.TOGGLE_OVERLAY, () => {
    const isVisible = toggleOverlayVisibility();
    const mainWindow = getMainWindow();

    // Notify the main renderer about overlay visibility change
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.OVERLAY_TOGGLE, isVisible);
    }

    console.log(`[Shortcuts] Overlay ${isVisible ? 'shown' : 'hidden'}`);
  });

  // Ctrl/Cmd+Shift+L — Toggle overlay click-through (edit mode)
  globalShortcut.register(SHORTCUTS.TOGGLE_CLICK_THROUGH, () => {
    const isClickThrough = toggleClickThrough();
    const mainWindow = getMainWindow();
    const overlayWindow = getOverlayWindow();

    // Notify both windows about the state change
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(
        IPC_CHANNELS.OVERLAY_SET_CLICK_THROUGH,
        isClickThrough,
      );
    }

    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send(
        IPC_CHANNELS.OVERLAY_TOGGLE_EDIT,
        !isClickThrough,
      );
    }

    console.log(
      `[Shortcuts] Overlay click-through: ${isClickThrough ? 'ON' : 'OFF (edit mode)'}`,
    );
  });
}

/**
 * Unregisters all global shortcuts.
 * Called on app 'will-quit' or when the main window loses focus
 * (to avoid stealing shortcuts from other apps).
 */
export function unregisterGlobalShortcuts(): void {
  globalShortcut.unregisterAll();
}

/**
 * Sets up focus-aware shortcut registration:
 * - Registers shortcuts when the main window gains focus
 * - Unregisters when it loses focus
 *
 * This prevents ApexTelemetry from hijacking global shortcuts
 * when the user is working in other applications.
 */
export function setupFocusAwareShortcuts(mainWindow: BrowserWindow): void {
  mainWindow.on('focus', () => {
    registerGlobalShortcuts();
  });

  mainWindow.on('blur', () => {
    // Keep shortcuts registered even when blurred if overlay is visible,
    // since the user might be in-game and needs the shortcuts
    const overlayWindow = getOverlayWindow();
    if (overlayWindow && overlayWindow.isVisible()) {
      // Keep shortcuts active while gaming with overlay
      return;
    }
    unregisterGlobalShortcuts();
  });
}
