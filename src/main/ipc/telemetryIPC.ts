import { BrowserWindow } from 'electron';
import {
  UnifiedTelemetryData,
  LapCompleteEvent,
  IPC_CHANNELS,
} from '../../shared/ipc-types';

/** Minimum interval between sends in ms (~60 Hz) */
const THROTTLE_INTERVAL_MS = 1000 / 60; // ≈ 16.67 ms

let lastSendTimestamp = 0;
let pendingFrame: UnifiedTelemetryData | null = null;
let throttleTimer: ReturnType<typeof setTimeout> | null = null;

const subscribedWindows = new Set<BrowserWindow>();

export function subscribeTelemetryWindow(window: BrowserWindow): void {
  subscribedWindows.add(window);

  window.on('closed', () => {
    subscribedWindows.delete(window);
  });
}

export function unsubscribeTelemetryWindow(window: BrowserWindow): void {
  subscribedWindows.delete(window);
}

export function broadcastTelemetryData(data: UnifiedTelemetryData): void {
  const now = performance.now();
  const elapsed = now - lastSendTimestamp;

  if (elapsed >= THROTTLE_INTERVAL_MS) {
    sendToAllWindows(IPC_CHANNELS.TELEMETRY_DATA, data);
    lastSendTimestamp = now;
    pendingFrame = null;

    if (throttleTimer !== null) {
      clearTimeout(throttleTimer);
      throttleTimer = null;
    }
  } else {
    pendingFrame = data;

    if (throttleTimer === null) {
      const delay = THROTTLE_INTERVAL_MS - elapsed;
      throttleTimer = setTimeout(() => {
        if (pendingFrame !== null) {
          sendToAllWindows(IPC_CHANNELS.TELEMETRY_DATA, pendingFrame);
          lastSendTimestamp = performance.now();
          pendingFrame = null;
        }
        throttleTimer = null;
      }, delay);
    }
  }
}

export function broadcastLapComplete(lap: LapCompleteEvent): void {
  sendToAllWindows(IPC_CHANNELS.TELEMETRY_LAP_COMPLETE, lap);
}

function sendToAllWindows(channel: string, payload: unknown): void {
  for (const win of Array.from(subscribedWindows)) {
    try {
      if (
        win &&
        !win.isDestroyed() &&
        win.webContents &&
        !win.webContents.isDestroyed() &&
        !win.webContents.isLoading()
      ) {
        win.webContents.send(channel, payload);
      }
    } catch {
      subscribedWindows.delete(win);
    }
  }
}

export function cleanupTelemetryIPC(): void {
  if (throttleTimer !== null) {
    clearTimeout(throttleTimer);
    throttleTimer = null;
  }
  pendingFrame = null;
  subscribedWindows.clear();
  lastSendTimestamp = 0;
}
