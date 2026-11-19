// ─── ApexTelemetry Studio — Shared Type Definitions ─────────────────────────

// ─── Enums ──────────────────────────────────────────────────────────────────

export enum GameId {
  AC = 'AC',
  ACC = 'ACC',
  AC_EVO = 'AC_EVO',
  LMU = 'LMU',
  FORZA = 'FORZA',
  RALLY = 'RALLY',
}

export enum TelemetryFlag {
  NONE = 0,
  GREEN = 1,
  YELLOW = 2,
  BLUE = 3,
  BLACK = 4,
  WHITE = 5,
  CHECKERED = 6,
}

export enum WidgetType {
  TACHOMETER = 'TACHOMETER',
  INPUTS = 'INPUTS',
  TIRE_MONITOR = 'TIRE_MONITOR',
  RADAR = 'RADAR',
  TIMING_FUEL = 'TIMING_FUEL',
  RALLY = 'RALLY',
  FFB_CLIP = 'FFB_CLIP',
}

// ─── Telemetry Interfaces ───────────────────────────────────────────────────

/** Positional and speed data for a car relative to the player. */
export interface NearbyCarInfo {
  /** Lateral offset in meters (positive = right). */
  relativeX: number;
  /** Longitudinal offset in meters (positive = ahead). */
  relativeZ: number;
  /** Speed difference in km/h (positive = faster than player). */
  relativeSpeed: number;
  /** Index of the car in the session's car list. */
  carIndex: number;
}

/**
 * Tire temperature triple: [Inner, Middle, Outer] in °C.
 * Matches the standard three-zone tyre model used by most sims.
 */
export type TireTemp = [inner: number, mid: number, outer: number];

/** Unified telemetry snapshot — one sample at a point in time. */
export interface UnifiedTelemetryData {
  // ── Timing ───────────────────────────────────────────────────────────────
  /** Millisecond-precision timestamp relative to session start. */
  timestamp: number;
  /** Normalised track position 0 → 1. */
  trackProgress: number;

  // ── Powertrain ───────────────────────────────────────────────────────────
  rpm: number;
  maxRpm: number;
  speedKmh: number;
  gear: number;

  // ── Driver Inputs ────────────────────────────────────────────────────────
  /** 0 → 1 */
  throttle: number;
  /** 0 → 1 */
  brake: number;
  /** 0 → 1 */
  clutch: number;
  /** Degrees, negative = left. */
  steeringAngle: number;

  // ── Force Feedback ───────────────────────────────────────────────────────
  /** –1 → 1 normalised FFB signal. */
  ffbSignal: number;

  // ── Tire Temperatures (°C) ───────────────────────────────────────────────
  tireTempFL: TireTemp;
  tireTempFR: TireTemp;
  tireTempRL: TireTemp;
  tireTempRR: TireTemp;

  // ── Tire Pressures (bar) ─────────────────────────────────────────────────
  tirePressureFL: number;
  tirePressureFR: number;
  tirePressureRL: number;
  tirePressureRR: number;

  // ── Brake Temperatures (°C) ──────────────────────────────────────────────
  brakeTempFL: number;
  brakeTempFR: number;
  brakeTempRL: number;
  brakeTempRR: number;

  // ── Fuel ─────────────────────────────────────────────────────────────────
  /** Remaining fuel in litres. */
  fuelRemaining: number;
  /** Estimated fuel consumption per lap in litres. */
  fuelPerLap: number;

  // ── Lap / Timing ─────────────────────────────────────────────────────────
  /** Current lap time in milliseconds. */
  lapCurrent: number;
  /** Session-best lap time in milliseconds. */
  lapBest: number;
  /** Last completed lap time in milliseconds. */
  lapLast: number;
  /** 1-based lap number. */
  lapNumber: number;
  /** Delta to best lap in seconds (negative = faster). */
  delta: number;
  /** Current sector (1, 2, or 3). */
  sector: number;

  // ── World Position ───────────────────────────────────────────────────────
  worldPosX: number;
  worldPosZ: number;

  // ── Electronics / Flags ──────────────────────────────────────────────────
  absActive: boolean;
  tcActive: boolean;
  pitLimiter: boolean;
  flags: TelemetryFlag;

  // ── Proximity ────────────────────────────────────────────────────────────
  carsNearby: NearbyCarInfo[];

  // ── Session Context ──────────────────────────────────────────────────────
  carModel: string;
  trackName: string;
  gameId: GameId;
}

// ─── Session & Lap Storage ──────────────────────────────────────────────────

export interface SessionInfo {
  id: number;
  steamId: string;
  gameId: GameId;
  trackName: string;
  carModel: string;
  /** ISO-8601 */
  startTime: string;
  /** ISO-8601, empty while session is live. */
  endTime: string | null;
  /** Free-form weather / condition notes. */
  conditions: string;
}

export interface LapInfo {
  id: number;
  sessionId: number;
  lapNumber: number;
  /** Lap time in milliseconds. */
  lapTime: number;
  /** Sector 1 split in milliseconds. */
  sector1: number;
  /** Sector 2 split in milliseconds. */
  sector2: number;
  /** Sector 3 split in milliseconds. */
  sector3: number;
  isValid: boolean;
}

export interface TelemetrySample {
  id: number;
  lapId: number;
  /** 0 → 1 track position. */
  trackProgress: number;
  /** Milliseconds since session start. */
  timestamp: number;
  data: UnifiedTelemetryData;
}

// ─── HUD ────────────────────────────────────────────────────────────────────

export interface HudWidget {
  id: number;
  type: WidgetType;
  /** X position in layout-relative pixels. */
  x: number;
  /** Y position in layout-relative pixels. */
  y: number;
  width: number;
  height: number;
  /** Uniform scale factor (1 = 100 %). */
  scale: number;
  /** 0 → 1 opacity. */
  opacity: number;
  /** Widget-specific configuration bag. */
  config: Record<string, any>;
}

export interface HudLayout {
  id: number;
  name: string;
  /** Glob or exact GameId to match, e.g. "ACC" or "*". */
  gameRule: string;
  /** Glob pattern for car model matching, e.g. "porsche_*". */
  carRule: string;
  widgets: HudWidget[];
  /** Target resolution, e.g. "1920x1080". */
  resolution: string;
}

export interface AutoSwitchRule {
  gameId: GameId | null;
  carPattern: string | null;
  layoutId: number;
}

// ─── User / Profile ─────────────────────────────────────────────────────────

export interface SteamProfile {
  steamId: string;
  nickname: string;
  avatarUrl: string;
  ownedGames: string[];
}

// ─── Insights ───────────────────────────────────────────────────────────────

export type InsightCategory = 'BRAKING' | 'APEX_SPEED' | 'THROTTLE' | 'STEERING';

export interface RaceInsight {
  cornerIndex: number;
  trackProgressStart: number;
  trackProgressEnd: number;
  /** Time lost in seconds at this corner vs. the reference lap. */
  timeLost: number;
  /** Human-readable description in English. */
  description: string;
  /** Human-readable description in Brazilian Portuguese. */
  descriptionPtBr: string;
  category: InsightCategory;
}

// ─── Analysis Types ─────────────────────────────────────────────────────────

/** A detected brake zone / corner on the track. */
export interface BrakeZone {
  /** Sequential corner index (1-based). */
  index: number;
  /** Normalised track progress where braking begins. */
  startProgress: number;
  /** Normalised track progress where the corner ends. */
  endProgress: number;
  /** Normalised track progress of the apex (minimum speed). */
  apexProgress: number;
  /** Classification based on minimum speed through the zone. */
  cornerType: 'hairpin' | 'medium' | 'fast' | 'chicane';
}

/** Per-corner driving metrics extracted from telemetry. */
export interface CornerMetrics {
  /** Track progress where braking begins (brake > 0.10). */
  brakePoint: number;
  /** Maximum brake pedal value within the zone (0–1). */
  brakeForce: number;
  /** Speed at the apex (minimum speed point) in km/h. */
  apexSpeed: number;
  /** Track progress where full throttle is first applied after the apex. */
  throttlePoint: number;
  /** Maximum absolute steering angle within the zone (degrees). */
  maxSteeringAngle: number;
  /** Minimum speed in the zone in km/h. */
  minSpeed: number;
  /** Speed at the exit of the zone in km/h. */
  exitSpeed: number;
  /** Time spent traversing the zone in seconds. */
  timeInZone: number;
}

/** Result of comparing two laps point-by-point. */
export interface LapComparison {
  /** Time delta at evenly-spaced track-progress points. */
  deltaByProgress: Array<{ progress: number; timeDelta: number }>;
  /** Overall time difference (target − reference) in seconds. */
  totalDelta: number;
  /** Per-corner metrics for the reference lap. */
  refMetrics: CornerMetrics[];
  /** Per-corner metrics for the target lap. */
  targetMetrics: CornerMetrics[];
  /** Detected brake zones (from the reference lap). */
  zones: BrakeZone[];
}

// ─── Application Settings ───────────────────────────────────────────────────

export interface SpeedUnit {
  label: string;
  value: 'kmh' | 'mph';
}

export interface TempUnit {
  label: string;
  value: 'celsius' | 'fahrenheit';
}

export interface PressureUnit {
  label: string;
  value: 'bar' | 'psi';
}

export interface UnitSettings {
  speed: SpeedUnit;
  temp: TempUnit;
  pressure: PressureUnit;
}

export interface AppSettings {
  /** Map of GameId → UDP listen port. */
  udpPorts: Record<string, number>;
  lanRelayEnabled: boolean;
  steamApiKey: string;
  /** Keyboard shortcut map, e.g. { toggleHud: 'F1' }. */
  shortcuts: Record<string, string>;
  units: UnitSettings;
  /** COM port for external hardware (e.g. wind sim, button box). */
  serialPort: string;
  /** Port the companion overlay server listens on. */
  companionPort: number;
}
