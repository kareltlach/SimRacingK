// ─── ApexTelemetry Studio — Shared Utility Functions ────────────────────────

import { GameId, TelemetryFlag, type UnifiedTelemetryData } from './types';

// ─── Time Formatting ────────────────────────────────────────────────────────

/**
 * Format a lap time given in **milliseconds** into `M:SS.mmm`.
 *
 * @example formatLapTime(93456) // "1:33.456"
 */
export function formatLapTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '-:--:---';

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const millis = Math.round(ms % 1000);

  const ss = String(seconds).padStart(2, '0');
  const mmm = String(millis).padStart(3, '0');

  return `${minutes}:${ss}.${mmm}`;
}

/**
 * Format a delta value in **seconds** into a signed string like `+0.342` or `−1.058`.
 * Uses the Unicode minus sign (U+2212) for negative values for clean display.
 */
export function formatDelta(seconds: number): string {
  if (!Number.isFinite(seconds)) return '-.---';

  const abs = Math.abs(seconds);
  const fixed = abs.toFixed(3);

  if (seconds > 0) return `+${fixed}`;
  if (seconds < 0) return `\u2212${fixed}`;
  return `0.000`;
}

// ─── Unit Conversions ───────────────────────────────────────────────────────

/** Convert km/h → mph. */
export function kmhToMph(kmh: number): number {
  return kmh * 0.621371;
}

/** Convert °C → °F. */
export function celsiusToFahrenheit(c: number): number {
  return c * 1.8 + 32;
}

/** Convert bar → psi. */
export function barToPsi(bar: number): number {
  return bar * 14.5038;
}

// ─── Math Helpers ───────────────────────────────────────────────────────────

/** Clamp `val` to the inclusive range [`min`, `max`]. */
export function clamp(val: number, min: number, max: number): number {
  return val < min ? min : val > max ? max : val;
}

/** Linear interpolation from `a` to `b` by factor `t` (0 → 1). */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Euclidean distance in the XZ (ground) plane. */
export function distance2D(x1: number, z1: number, x2: number, z2: number): number {
  const dx = x2 - x1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dz * dz);
}

// ─── Defaults ───────────────────────────────────────────────────────────────

/** Create a zero-initialised `UnifiedTelemetryData` snapshot. */
export function createDefaultTelemetryData(): UnifiedTelemetryData {
  return {
    timestamp: 0,
    trackProgress: 0,

    rpm: 0,
    maxRpm: 0,
    speedKmh: 0,
    gear: 0,

    throttle: 0,
    brake: 0,
    clutch: 0,
    steeringAngle: 0,

    ffbSignal: 0,

    tireTempFL: [0, 0, 0],
    tireTempFR: [0, 0, 0],
    tireTempRL: [0, 0, 0],
    tireTempRR: [0, 0, 0],

    tirePressureFL: 0,
    tirePressureFR: 0,
    tirePressureRL: 0,
    tirePressureRR: 0,

    brakeTempFL: 0,
    brakeTempFR: 0,
    brakeTempRL: 0,
    brakeTempRR: 0,

    fuelRemaining: 0,
    fuelPerLap: 0,

    lapCurrent: 0,
    lapBest: 0,
    lapLast: 0,
    lapNumber: 0,
    delta: 0,
    sector: 1,

    worldPosX: 0,
    worldPosZ: 0,

    absActive: false,
    tcActive: false,
    pitLimiter: false,
    flags: TelemetryFlag.NONE,

    carsNearby: [],

    carModel: '',
    trackName: '',
    gameId: GameId.AC,
  };
}

// ─── ID Generation ──────────────────────────────────────────────────────────

/**
 * Generate a short, collision-resistant unique identifier.
 *
 * Format: `<timestamp-base36>-<random-base36>` (≈ 16 chars).
 * Not cryptographically secure — suitable for client-side record IDs.
 */
export function generateId(): string {
  const timePart = Date.now().toString(36);
  const randPart = Math.random().toString(36).substring(2, 9);
  return `${timePart}-${randPart}`;
}
