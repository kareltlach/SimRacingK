// ─── ApexTelemetry Studio — Shared Constants ───────────────────────────────

import { GameId } from './types';
import type { UnitSettings } from './types';

// ─── Telemetry Tick Rate ────────────────────────────────────────────────────

/** Target telemetry sample rate (Hz). */
export const TELEMETRY_TICK_RATE = 60;

/** Milliseconds between telemetry samples (≈ 16.67 ms @ 60 Hz). */
export const TELEMETRY_INTERVAL_MS = 16;

// ─── Networking ─────────────────────────────────────────────────────────────

/** Default UDP listen ports per game. */
export const DEFAULT_UDP_PORTS: Record<GameId, number> = {
  [GameId.AC]:     9996,
  [GameId.ACC]:    9000,
  [GameId.AC_EVO]: 9997,
  [GameId.LMU]:    6789,
  [GameId.FORZA]:  5300,
  [GameId.RALLY]:  20777,
};

/** Default port for the companion overlay WebSocket server. */
export const COMPANION_DEFAULT_PORT = 8777;

// ─── Supported Games ───────────────────────────────────────────────────────

export interface SupportedGame {
  id: GameId;
  name: string;
  icon: string;
}

export const SUPPORTED_GAMES: readonly SupportedGame[] = [
  { id: GameId.AC,     name: 'Assetto Corsa',         icon: 'ac.svg' },
  { id: GameId.ACC,    name: 'Assetto Corsa Competizione', icon: 'acc.svg' },
  { id: GameId.AC_EVO, name: 'Assetto Corsa EVO',     icon: 'ac_evo.svg' },
  { id: GameId.LMU,    name: 'Le Mans Ultimate',      icon: 'lmu.svg' },
  { id: GameId.FORZA,  name: 'Forza Motorsport',      icon: 'forza.svg' },
  { id: GameId.RALLY,  name: 'EA Sports WRC',         icon: 'rally.svg' },
] as const;

// ─── Default Units ──────────────────────────────────────────────────────────

export const DEFAULT_UNITS: UnitSettings = {
  speed:    { label: 'km/h',    value: 'kmh' },
  temp:     { label: '°C',      value: 'celsius' },
  pressure: { label: 'bar',     value: 'bar' },
};

// ─── IPC Channels ───────────────────────────────────────────────────────────

/**
 * Electron IPC channel name constants.
 * Grouped by domain; every value is the literal channel string.
 */
export const IPC_CHANNELS = {
  // Telemetry
  TELEMETRY_DATA:          'telemetry:data',
  TELEMETRY_START:         'telemetry:start',
  TELEMETRY_STOP:          'telemetry:stop',
  TELEMETRY_STATUS:        'telemetry:status',

  // Session
  SESSION_START:           'session:start',
  SESSION_END:             'session:end',
  SESSION_LIST:            'session:list',
  SESSION_GET:             'session:get',
  SESSION_DELETE:          'session:delete',

  // Laps
  LAP_COMPLETED:           'lap:completed',
  LAP_LIST:                'lap:list',
  LAP_GET:                 'lap:get',
  LAP_SAMPLES:             'lap:samples',

  // HUD
  HUD_LAYOUT_SAVE:         'hud:layout:save',
  HUD_LAYOUT_LOAD:         'hud:layout:load',
  HUD_LAYOUT_LIST:         'hud:layout:list',
  HUD_LAYOUT_DELETE:       'hud:layout:delete',
  HUD_AUTO_SWITCH:         'hud:autoSwitch',

  // Settings
  SETTINGS_GET:            'settings:get',
  SETTINGS_SET:            'settings:set',
  SETTINGS_RESET:          'settings:reset',

  // Steam
  STEAM_PROFILE:           'steam:profile',
  STEAM_OWNED_GAMES:       'steam:ownedGames',

  // Insights
  INSIGHTS_GENERATE:       'insights:generate',
  INSIGHTS_GET:            'insights:get',

  // Companion / Overlay
  COMPANION_START:         'companion:start',
  COMPANION_STOP:          'companion:stop',
  COMPANION_STATUS:        'companion:status',

  // App
  APP_VERSION:             'app:version',
  APP_QUIT:                'app:quit',
  APP_MINIMIZE:            'app:minimize',
  APP_MAXIMIZE:            'app:maximize',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

// ─── Keyboard Shortcuts ─────────────────────────────────────────────────────

/** Default keyboard shortcut bindings. */
export const KEYBOARD_SHORTCUTS: Record<string, string> = {
  toggleHud:        'F1',
  toggleRadar:      'F2',
  toggleTiming:     'F3',
  toggleInputs:     'F4',
  toggleTireMonitor:'F5',
  cycleLayout:      'F6',
  startReplay:      'F7',
  screenshotHud:    'F12',
  resetDelta:       'Ctrl+D',
  quickSave:        'Ctrl+S',
};

// ─── Database ───────────────────────────────────────────────────────────────

export const DATABASE_NAME = 'apex_telemetry.db';
