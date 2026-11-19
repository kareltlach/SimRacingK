import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, AppSettings, HudLayout } from '../shared/ipc-types';

export const api = {
  telemetry: {
    start: (gameId?: string) => ipcRenderer.invoke(IPC_CHANNELS.TELEMETRY_START, { gameId }),
    stop: () => ipcRenderer.invoke(IPC_CHANNELS.TELEMETRY_STOP),
    getStatus: () => ipcRenderer.invoke(IPC_CHANNELS.TELEMETRY_STATUS),
    getActiveSim: () => ipcRenderer.invoke('sim:get-active'),
    onSimChange: (callback: (simInfo: any) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, simInfo: any) => callback(simInfo);
      ipcRenderer.on('sim:changed', handler);
      return () => {
        ipcRenderer.removeListener('sim:changed', handler);
      };
    },
    onData: (callback: (data: any) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, data: any) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.TELEMETRY_DATA, handler);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.TELEMETRY_DATA, handler);
      };
    },
    onLapComplete: (callback: (lap: any) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, lap: any) => callback(lap);
      ipcRenderer.on(IPC_CHANNELS.TELEMETRY_LAP_COMPLETE, handler);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.TELEMETRY_LAP_COMPLETE, handler);
      };
    },
  },
  sessions: {
    list: (filters?: any) => ipcRenderer.invoke(IPC_CHANNELS.DB_GET_SESSIONS, filters),
    get: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.DB_GET_SESSION, id),
    delete: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.DB_DELETE_SESSION, id),
    getLaps: (sessionId: number) => ipcRenderer.invoke(IPC_CHANNELS.DB_GET_LAPS, sessionId),
    getLap: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.DB_GET_LAP, id),
    getSamples: (lapId: number) => ipcRenderer.invoke(IPC_CHANNELS.DB_GET_TELEMETRY_SAMPLES, lapId),
    getBestLaps: (gameId?: string, trackName?: string) => ipcRenderer.invoke(IPC_CHANNELS.DB_GET_BEST_LAPS, { gameId, trackName }),
    exportSession: (sessionId: number, format: string) => ipcRenderer.invoke(IPC_CHANNELS.DB_EXPORT_SESSION, { sessionId, format }),
    importSession: (filePath?: string) => ipcRenderer.invoke(IPC_CHANNELS.DB_IMPORT_SESSION, { filePath }),
  },
  overlay: {
    toggle: () => ipcRenderer.invoke(IPC_CHANNELS.OVERLAY_TOGGLE),
    setClickThrough: (enabled: boolean) => ipcRenderer.invoke(IPC_CHANNELS.OVERLAY_SET_CLICK_THROUGH, enabled),
    getLayouts: () => ipcRenderer.invoke(IPC_CHANNELS.OVERLAY_GET_LAYOUTS),
    saveLayout: (layout: HudLayout) => ipcRenderer.invoke(IPC_CHANNELS.OVERLAY_SAVE_LAYOUT, layout),
    deleteLayout: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.OVERLAY_DELETE_LAYOUT, id),
    loadLayout: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.OVERLAY_LOAD_LAYOUT, id),
    toggleEdit: () => ipcRenderer.invoke(IPC_CHANNELS.OVERLAY_TOGGLE_EDIT),
    openStandaloneWidget: (config: any) => ipcRenderer.invoke('overlay:open-standalone-widget', config),
    closeStandaloneWidget: (widgetId: string) => ipcRenderer.invoke('overlay:close-standalone-widget', widgetId),
    onLayoutChanged: (callback: (layout: HudLayout) => void) => {
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
    setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => {
      return ipcRenderer.invoke('overlay:set-ignore-mouse-events', ignore, options);
    },
    saveWidgetPosition: (widgetId: string, x: number, y: number) => {
      return ipcRenderer.invoke('overlay:save-widget-pos', { widgetId, x, y });
    },
  },
  hud: {
    getLayouts: () => ipcRenderer.invoke(IPC_CHANNELS.OVERLAY_GET_LAYOUTS),
    saveLayout: (layout: any) => ipcRenderer.invoke(IPC_CHANNELS.OVERLAY_SAVE_LAYOUT, layout),
    deleteLayout: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.OVERLAY_DELETE_LAYOUT, id),
    launchOverlay: (_layoutId?: number) => ipcRenderer.invoke(IPC_CHANNELS.OVERLAY_TOGGLE),
  },
  settings: {
    get: (key?: string) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET, key),
    set: (settings: Partial<AppSettings>) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, settings),
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET_ALL),
    reset: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_RESET),
  },
  steam: {
    getProfile: (apiKey?: string) => ipcRenderer.invoke(IPC_CHANNELS.STEAM_GET_PROFILE, { apiKey }),
    login: (apiKey?: string) => ipcRenderer.invoke(IPC_CHANNELS.STEAM_LOGIN, { apiKey }),
    logout: async () => {},
  },
  companion: {
    getStatus: () => ipcRenderer.invoke(IPC_CHANNELS.COMPANION_GET_STATUS),
    getQRCode: () => ipcRenderer.invoke(IPC_CHANNELS.COMPANION_GET_QR_CODE),
    start: (port?: number) => ipcRenderer.invoke(IPC_CHANNELS.COMPANION_START, { port }),
    stop: () => ipcRenderer.invoke(IPC_CHANNELS.COMPANION_STOP),
  },
  serial: {
    listPorts: async () => [] as string[],
    connect: async (_port: string, _baudRate: number) => {},
    disconnect: async () => {},
    testLed: async () => {},
  },
  app: {
    getVersion: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),
    quit: () => ipcRenderer.invoke(IPC_CHANNELS.APP_QUIT),
    minimize: () => ipcRenderer.invoke(IPC_CHANNELS.APP_MINIMIZE),
    maximize: () => ipcRenderer.invoke(IPC_CHANNELS.APP_MAXIMIZE),
    close: () => ipcRenderer.invoke(IPC_CHANNELS.APP_CLOSE),
  },
};

contextBridge.exposeInMainWorld('api', api);
