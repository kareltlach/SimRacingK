/**
 * LapRepository — CRUD for laps and their telemetry samples
 *
 * Telemetry sample payloads (`data` field) are serialized to / from
 * binary BLOBs with msgpackr for compact storage and fast I/O.
 */

import { getDatabase, cachedStmt } from '../Database';
import { pack, unpack } from 'msgpackr';
import type { LapInfo, TelemetrySample } from '../../shared/types';

// ─── Repository ─────────────────────────────────────────────

export class LapRepository {
  /**
   * Insert a lap record and return the full object (with generated `id`).
   */
  createLap(lap: Omit<LapInfo, 'id'>): LapInfo {
    const stmt = cachedStmt(
      `INSERT INTO laps (session_id, lap_number, lap_time, sector1, sector2, sector3, is_valid)
       VALUES (@session_id, @lap_number, @lap_time, @sector1, @sector2, @sector3, @is_valid)`,
    );

    const result = stmt.run({
      session_id: lap.session_id,
      lap_number: lap.lap_number,
      lap_time: lap.lap_time ?? null,
      sector1: lap.sector1 ?? null,
      sector2: lap.sector2 ?? null,
      sector3: lap.sector3 ?? null,
      is_valid: lap.is_valid ?? 1,
    });

    return { ...lap, id: result.lastInsertRowid as number };
  }

  /**
   * Fetch a single lap by id.
   */
  getLap(id: number): LapInfo | null {
    const stmt = cachedStmt<LapInfo>('SELECT * FROM laps WHERE id = ?');
    return (stmt.get(id) as LapInfo | undefined) ?? null;
  }

  /**
   * All laps belonging to a session, ordered by lap number.
   */
  getLapsBySession(sessionId: number): LapInfo[] {
    const stmt = cachedStmt<LapInfo>(
      'SELECT * FROM laps WHERE session_id = ? ORDER BY lap_number ASC',
    );
    return stmt.all(sessionId) as LapInfo[];
  }

  /**
   * Return the fastest **valid** lap in a session (by `lap_time`).
   * Returns `null` when the session has no valid laps with recorded times.
   */
  getBestLap(sessionId: number): LapInfo | null {
    const stmt = cachedStmt<LapInfo>(
      `SELECT * FROM laps
       WHERE session_id = ? AND is_valid = 1 AND lap_time IS NOT NULL
       ORDER BY lap_time ASC
       LIMIT 1`,
    );
    return (stmt.get(sessionId) as LapInfo | undefined) ?? null;
  }

  // ── Telemetry samples ───────────────────────────────────

  /**
   * Bulk-insert telemetry samples for a lap.
   *
   * Each sample's `data` payload is packed into a compact msgpack BLOB.
   * The insert is wrapped in a transaction for speed (one fsync instead
   * of one per row).
   */
  saveTelemetrySamples(lapId: number, samples: TelemetrySample[]): void {
    if (samples.length === 0) return;

    const db = getDatabase();

    const insertStmt = db.prepare(
      `INSERT INTO telemetry_samples (lap_id, track_progress, timestamp, data)
       VALUES (?, ?, ?, ?)`,
    );

    const insertAll = db.transaction((rows: TelemetrySample[]) => {
      for (const s of rows) {
        const blob = pack(s.data);
        insertStmt.run(lapId, s.track_progress, s.timestamp, blob);
      }
    });

    insertAll(samples);
  }

  /**
   * Retrieve every telemetry sample for a lap, sorted by track
   * progress.  The binary `data` BLOB is unpacked back into a
   * plain object automatically.
   */
  getTelemetrySamples(lapId: number): TelemetrySample[] {
    const stmt = cachedStmt(
      `SELECT id, lap_id, track_progress, timestamp, data
       FROM telemetry_samples
       WHERE lap_id = ?
       ORDER BY track_progress ASC`,
    );

    const rows = stmt.all(lapId) as Array<{
      id: number;
      lap_id: number;
      track_progress: number;
      timestamp: number;
      data: Buffer;
    }>;

    return rows.map((row) => ({
      id: row.id,
      lap_id: row.lap_id,
      track_progress: row.track_progress,
      timestamp: row.timestamp,
      data: unpack(row.data) as Record<string, number>,
    }));
  }
}

// ─── Singleton instance ─────────────────────────────────────
export const lapRepository = new LapRepository();
export default lapRepository;
