import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, HudLayout } from '../shared/ipc-types';

export const overlayApi = {
  telemetry: {
    onData: (callback: (data: any) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, data: any) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.TELEMETRY_DATA, handler);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.TELEMETRY_DATA, handler);
      };
    },
  },
  overlay: {
    onLayoutChange: (callback: (layout: HudLayout) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, layout: HudLayout) => callback(layout);
      ipcRenderer.on(IPC_CHANNELS.OVERLAY_LAYOUT_CHANGED, handler);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.OVERLAY_LAYOUT_CHANGED, handler);
      };
    },
    onToggleEdit: (callback: (editMode: boolean) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, editMode: boolean) => callback(editMode);
      ipcRenderer.on(IPC_CHANNELS.OVERLAY_TOGGLE_EDIT, handler);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.OVERLAY_TOGGLE_EDIT, handler);
      };
    },
    toggle: () => {
      return ipcRenderer.invoke(IPC_CHANNELS.OVERLAY_TOGGLE);
    },
    close: () => {
      return ipcRenderer.invoke(IPC_CHANNELS.OVERLAY_TOGGLE);
    },
    setClickThrough: (enabled: boolean) => {
      return ipcRenderer.invoke(IPC_CHANNELS.OVERLAY_SET_CLICK_THROUGH, enabled);
    },
    setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => {
      return ipcRenderer.invoke('overlay:set-ignore-mouse-events', ignore, options);
    },
    saveWidgetPosition: (widgetId: string, x: number, y: number) => {
      return ipcRenderer.invoke('overlay:save-widget-pos', { widgetId, x, y });
    },
    openStandaloneWidget: (config: any) => {
      return ipcRenderer.invoke('overlay:open-standalone-widget', config);
    },
    closeStandaloneWidget: (widgetId: string) => {
      return ipcRenderer.invoke('overlay:close-standalone-widget', widgetId);
    },
  },
};

contextBridge.exposeInMainWorld('overlayApi', overlayApi);
contextBridge.exposeInMainWorld('api', overlayApi);
