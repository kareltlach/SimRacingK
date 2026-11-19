// ─── Additional shared types for ApexTelemetry Studio ───────────────────────
// Re-export base types
export * from './types';

// ─── Sim / Game Identification ──────────────────────────────────────────────

export type SimTitle =
  | 'iRacing'
  | 'AssettoCorsaCompetizione'
  | 'AssettoCorsaEVO'
  | 'rFactor2'
  | 'F1_24'
  | 'F1_25'
  | 'Unknown';

// ─── Unified Telemetry Data ─────────────────────────────────────────────────

export interface UnifiedTelemetryData {
  timestamp: number;
  frameId: number;
  sim: SimTitle;
  speed: number;
  rpm: number;
  gear: number;
  throttle: number;
  brake: number;
  clutch: number;
  steeringAngle: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  velocityX: number;
  velocityY: number;
  velocityZ: number;
  yaw: number;
  pitch: number;
  roll: number;
  gForceX: number;
  gForceY: number;
  gForceZ: number;
  tyreTempInner: [number, number, number, number];
  tyreTempMiddle: [number, number, number, number];
  tyreTempOuter: [number, number, number, number];
  tyrePressure: [number, number, number, number];
  tyreWear: [number, number, number, number];
  tyreSlip: [number, number, number, number];
  brakeTemp: [number, number, number, number];
  engineTemp: number;
  oilTemp: number;
  oilPressure: number;
  fuelLevel: number;
  fuelConsumptionPerLap: number;
  turboBoost: number;
  currentLapTime: number;
  lastLapTime: number;
  bestLapTime: number;
  currentLapNumber: number;
  totalLaps: number;
  currentSector: number;
  sectorTimes: number[];
  trackPosition: number;
  trackLength: number;
  flag: TelemetryFlag;
  pitLimiter: boolean;
  inPit: boolean;
  drsAvailable: boolean;
  drsActive: boolean;
  absActive: boolean;
  tcActive: boolean;
  absLevel: number;
  tcLevel: number;
  engineMap: number;
  brakeBias: number;
  airTemp: number;
  trackTemp: number;
  windSpeed: number;
  windDirection: number;
  rainIntensity: number;
  sessionType: SessionType;
  sessionTimeRemaining: number;
}

export type TelemetryFlag =
  | 'none' | 'green' | 'yellow' | 'blue' | 'red'
  | 'white' | 'checkered' | 'black' | 'meatball';

export type SessionType =
  | 'practice' | 'qualify' | 'race'
  | 'hotlap' | 'time_trial' | 'unknown';

// ─── HUD Overlay Types ─────────────────────────────────────────────────────

export type HUDWidgetType =
  | 'speedometer' | 'tachometer' | 'gear_indicator'
  | 'pedal_inputs' | 'tyre_temps' | 'tyre_wear'
  | 'brake_temps' | 'g_force_meter' | 'lap_timer'
  | 'sector_times' | 'fuel_calculator' | 'track_map'
  | 'relative_standings' | 'delta_bar' | 'weather_info'
  | 'engine_data' | 'electronics' | 'custom';

export interface HUDWidget {
  id: string;
  type: HUDWidgetType;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  visible: boolean;
  config: Record<string, unknown>;
}

export interface HUDLayoutParsed {
  id: number;
  name: string;
  gameRule: string | null;
  carRule: string | null;
  widgets: HUDWidget[];
  resolution: { width: number; height: number };
}

// ─── Companion Server ───────────────────────────────────────────────────────

export interface CompanionStatus {
  running: boolean;
  port: number;
  connectedClients: number;
  url: string;
}

// ─── App Settings ───────────────────────────────────────────────────────────

export interface AppSettings {
  general: {
    theme: 'dark' | 'midnight' | 'oled';
    language: string;
    checkForUpdates: boolean;
    startMinimized: boolean;
    minimizeToTray: boolean;
  };
  telemetry: {
    sampleRate: number;
    storeSamples: boolean;
    autoRecord: boolean;
    enabledSims: SimTitle[];
  };
  overlay: {
    enabled: boolean;
    defaultLayout: string | null;
    globalOpacity: number;
    antiAliasing: boolean;
  };
  companion: {
    enabled: boolean;
    port: number;
    autoStart: boolean;
    requireAuth: boolean;
    pin: string;
  };
  shortcuts: {
    toggleOverlay: string;
    toggleClickThrough: string;
  };
  database: {
    path: string;
    maxSizeGB: number;
    autoCleanupDays: number;
  };
}

// ─── Telemetry Bus Event Types ──────────────────────────────────────────────

export interface TelemetryBusEvents {
  data: UnifiedTelemetryData;
  lapComplete: LapCompleteEvent;
  sessionStart: SessionStartEvent;
  sessionEnd: SessionEndEvent;
  connectionChange: { sim: SimTitle; connected: boolean };
  error: { source: string; message: string };
}

export interface LapCompleteEvent {
  lapNumber: number;
  lapTime: number;
  sectorTimes: number[];
  valid: boolean;
  fuelUsed: number;
  sessionId: number;
}

export interface SessionStartEvent {
  sessionId: number;
  sim: SimTitle;
  track: string;
  car: string;
  sessionType: SessionType;
}

export interface SessionEndEvent {
  sessionId: number;
  totalLaps: number;
  bestLapTime: number | null;
  duration: number;
}

// ─── IPC Channel Definitions ────────────────────────────────────────────────

export const IPC_CHANNELS = {
  // Telemetry
  TELEMETRY_START: 'telemetry:start',
  TELEMETRY_STOP: 'telemetry:stop',
  TELEMETRY_DATA: 'telemetry:data',
  TELEMETRY_LAP_COMPLETE: 'telemetry:lap-complete',
  TELEMETRY_STATUS: 'telemetry:status',

  // Database
  DB_GET_SESSIONS: 'db:get-sessions',
  DB_GET_SESSION: 'db:get-session',
  DB_DELETE_SESSION: 'db:delete-session',
  DB_GET_LAPS: 'db:get-laps',
  DB_GET_LAP: 'db:get-lap',
  DB_GET_TELEMETRY_SAMPLES: 'db:get-telemetry-samples',
  DB_GET_BEST_LAPS: 'db:get-best-laps',
  DB_EXPORT_SESSION: 'db:export-session',
  DB_IMPORT_SESSION: 'db:import-session',

  // Overlay
  OVERLAY_TOGGLE: 'overlay:toggle',
  OVERLAY_SET_CLICK_THROUGH: 'overlay:set-click-through',
  OVERLAY_LAYOUT_CHANGED: 'overlay:layout-changed',
  OVERLAY_TOGGLE_EDIT: 'overlay:toggle-edit',
  OVERLAY_GET_LAYOUTS: 'overlay:get-layouts',
  OVERLAY_SAVE_LAYOUT: 'overlay:save-layout',
  OVERLAY_DELETE_LAYOUT: 'overlay:delete-layout',
  OVERLAY_LOAD_LAYOUT: 'overlay:load-layout',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_ALL: 'settings:get-all',
  SETTINGS_RESET: 'settings:reset',

  // Steam
  STEAM_GET_PROFILE: 'steam:get-profile',
  STEAM_LOGIN: 'steam:login',

  // Companion
  COMPANION_GET_STATUS: 'companion:get-status',
  COMPANION_GET_QR_CODE: 'companion:get-qr-code',
  COMPANION_START: 'companion:start',
  COMPANION_STOP: 'companion:stop',

  // App
  APP_GET_VERSION: 'app:get-version',
  APP_CHECK_UPDATE: 'app:check-update',
  APP_QUIT: 'app:quit',
  APP_MINIMIZE: 'app:minimize',
  APP_MAXIMIZE: 'app:maximize',
  APP_CLOSE: 'app:close',
} as const;

export type IPCChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
