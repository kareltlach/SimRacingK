/**
 * SessionRepository — CRUD for driving sessions
 */

import { getDatabase, cachedStmt } from '../Database';
import type { SessionInfo } from '../../shared/types';

// ─── Filters accepted by getAllSessions ─────────────────────
export interface SessionFilters {
  gameId?: string;
  trackName?: string;
  carModel?: string;
}

// ─── Repository ─────────────────────────────────────────────

export class SessionRepository {
  /**
   * Insert a new session and return the full record (including the
   * auto-generated `id`).
   */
  createSession(info: Omit<SessionInfo, 'id'>): SessionInfo {
    const stmt = cachedStmt(
      `INSERT INTO sessions (steam_id, game_id, track_name, car_model, start_time, end_time, conditions)
       VALUES (@steam_id, @game_id, @track_name, @car_model, @start_time, @end_time, @conditions)`,
    );

    const result = stmt.run({
      steam_id: info.steam_id,
      game_id: info.game_id,
      track_name: info.track_name,
      car_model: info.car_model,
      start_time: info.start_time,
      end_time: info.end_time ?? null,
      conditions: info.conditions ?? 'dry',
    });

    return { ...info, id: result.lastInsertRowid as number };
  }

  /**
   * Mark a session as finished by setting its `end_time`.
   */
  endSession(id: number, endTime: number): void {
    const stmt = cachedStmt('UPDATE sessions SET end_time = ? WHERE id = ?');
    stmt.run(endTime, id);
  }

  /**
   * Fetch a single session by id, or `null` when not found.
   */
  getSession(id: number): SessionInfo | null {
    const stmt = cachedStmt<SessionInfo>('SELECT * FROM sessions WHERE id = ?');
    return (stmt.get(id) as SessionInfo | undefined) ?? null;
  }

  /**
   * List sessions with optional filters (all filters are AND-ed).
   *
   * Builds the WHERE clause dynamically but still uses bound
   * parameters to prevent SQL injection.
   */
  getAllSessions(filters?: SessionFilters): SessionInfo[] {
    const clauses: string[] = [];
    const params: Record<string, string> = {};

    if (filters?.gameId) {
      clauses.push('game_id = @gameId');
      params.gameId = filters.gameId;
    }
    if (filters?.trackName) {
      clauses.push('track_name = @trackName');
      params.trackName = filters.trackName;
    }
    if (filters?.carModel) {
      clauses.push('car_model = @carModel');
      params.carModel = filters.carModel;
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const sql = `SELECT * FROM sessions ${where} ORDER BY start_time DESC`;

    // Dynamic SQL — use db.prepare directly (not cached, since the
    // shape varies with the supplied filters).
    const db = getDatabase();
    const stmt = db.prepare(sql);
    return stmt.all(params) as SessionInfo[];
  }

  /**
   * Delete a session **and** its dependent laps + telemetry samples
   * (cascade is done manually because SQLite foreign-key cascades
   * must be enabled per-connection and we want explicit control).
   */
  deleteSession(id: number): void {
    const db = getDatabase();

    const deleteTx = db.transaction((sessionId: number) => {
      // Gather lap ids first so we can delete their samples
      const lapIds = db
        .prepare('SELECT id FROM laps WHERE session_id = ?')
        .all(sessionId)
        .map((r: any) => r.id as number);

      if (lapIds.length > 0) {
        const placeholders = lapIds.map(() => '?').join(',');
        db.prepare(`DELETE FROM telemetry_samples WHERE lap_id IN (${placeholders})`).run(
          ...lapIds,
        );
      }

      db.prepare('DELETE FROM laps WHERE session_id = ?').run(sessionId);
      db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    });

    deleteTx(id);
  }
}

// ─── Singleton instance ─────────────────────────────────────
export const sessionRepository = new SessionRepository();
export default sessionRepository;
