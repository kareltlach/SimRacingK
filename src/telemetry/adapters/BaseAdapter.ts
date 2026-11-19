// ─────────────────────────────────────────────────────────────────────────────
// BaseAdapter.ts – Abstract base class for all telemetry adapters
// ─────────────────────────────────────────────────────────────────────────────

import { EventEmitter } from 'events';
import { UnifiedTelemetryData, GameId, validateTelemetryData } from '../UnifiedTelemetrySchema';

export type AdapterState = 'stopped' | 'starting' | 'running' | 'error';

export interface AdapterEvents {
  data: (data: UnifiedTelemetryData) => void;
  error: (error: Error) => void;
  stateChange: (state: AdapterState) => void;
}

/**
 * Abstract base for all game-specific telemetry adapters.
 *
 * Subclasses must implement:
 * - `start()` – begin reading telemetry
 * - `stop()` – stop reading and clean up
 * - `isAvailable()` – check whether the game's data source is accessible
 * - `gameId` – unique identifier for this game
 */
export abstract class BaseAdapter extends EventEmitter {
  protected _state: AdapterState = 'stopped';

  /** Unique game identifier for this adapter. */
  abstract readonly gameId: GameId;

  /** Human-readable display name. */
  abstract readonly displayName: string;

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /** Start reading telemetry data. Must be idempotent. */
  abstract start(): Promise<void>;

  /** Stop reading telemetry data and release resources. */
  abstract stop(): Promise<void>;

  /**
   * Returns true if the game's telemetry source is currently accessible.
   * E.g. shared memory exists, UDP port is responding, etc.
   */
  abstract isAvailable(): Promise<boolean>;

  // ── State management ──────────────────────────────────────────────────────

  get state(): AdapterState {
    return this._state;
  }

  protected setState(state: AdapterState): void {
    if (this._state !== state) {
      this._state = state;
      this.emit('stateChange', state);
    }
  }

  // ── Data emission ─────────────────────────────────────────────────────────

  /**
   * Subclasses call this to emit a validated telemetry frame.
   * Data is validated/clamped before emission.
   */
  protected emitData(data: Partial<UnifiedTelemetryData>): void {
    const validated = validateTelemetryData(data);
    this.emit('data', validated);
  }

  // ── Typed event helpers ───────────────────────────────────────────────────

  onData(listener: (data: UnifiedTelemetryData) => void): this {
    return this.on('data', listener);
  }

  onError(listener: (error: Error) => void): this {
    return this.on('error', listener);
  }

  onStateChange(listener: (state: AdapterState) => void): this {
    return this.on('stateChange', listener);
  }

  // ── Utility ───────────────────────────────────────────────────────────────

  protected handleError(err: unknown): void {
    const error = err instanceof Error ? err : new Error(String(err));
    this.setState('error');
    this.emit('error', error);
  }
}
