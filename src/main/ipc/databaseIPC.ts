import { ipcMain, dialog } from 'electron';
import { IPC_CHANNELS, SessionInfo, LapInfo, TelemetrySample, HudLayout } from '../../shared/ipc-types';
import type { SqliteDatabase } from '../../database/Database';
import { readFile, writeFile } from 'fs/promises';

/**
 * Registers all database-related IPC handlers.
 *
 * These handlers proxy SQLite queries from the renderer process
 * to the main process where better-sqlite3 runs. All handlers
 * use ipcMain.handle() for async request/response semantics.
 */
export function registerDatabaseIPC(db: SqliteDatabase): void {
  // ───── Sessions ─────────────────────────────────────────────────────────

  /**
   * Get all sessions, optionally filtered and sorted.
   */
  ipcMain.handle(
    IPC_CHANNELS.DB_GET_SESSIONS,
    (_event, options?: { limit?: number; offset?: number; sim?: string; orderBy?: string }) => {
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;
      const orderBy = options?.orderBy ?? 'start_time DESC';

      // Whitelist allowed orderBy columns to prevent SQL injection
      const allowedOrderBy = [
        'start_time DESC', 'start_time ASC',
        'end_time DESC', 'end_time ASC',
        'track_name ASC', 'track_name DESC',
        'car_model ASC', 'car_model DESC',
      ];
      const safeOrderBy = allowedOrderBy.includes(orderBy) ? orderBy : 'start_time DESC';

      if (options?.sim) {
        const stmt = db.prepare(
          `SELECT * FROM sessions WHERE game_id = ? ORDER BY ${safeOrderBy} LIMIT ? OFFSET ?`,
        );
        return stmt.all(options.sim, limit, offset) as SessionInfo[];
      }

      const stmt = db.prepare(
        `SELECT * FROM sessions ORDER BY ${safeOrderBy} LIMIT ? OFFSET ?`,
      );
      return stmt.all(limit, offset) as SessionInfo[];
    },
  );

  /**
   * Get a single session by ID.
   */
  ipcMain.handle(IPC_CHANNELS.DB_GET_SESSION, (_event, sessionId: number) => {
    const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
    return stmt.get(sessionId) as SessionInfo | undefined;
  });

  /**
   * Delete a session and all associated data (laps, telemetry samples).
   */
  ipcMain.handle(IPC_CHANNELS.DB_DELETE_SESSION, (_event, sessionId: number) => {
    const deleteTransaction = db.transaction(() => {
      // Delete telemetry samples for all laps in this session
      db.prepare(
        `DELETE FROM telemetry_samples WHERE lap_id IN (
          SELECT id FROM laps WHERE session_id = ?
        )`,
      ).run(sessionId);

      // Delete laps
      db.prepare('DELETE FROM laps WHERE session_id = ?').run(sessionId);

      // Delete session
      const result = db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
      return result.changes > 0;
    });

    return deleteTransaction();
  });

  // ───── Laps ─────────────────────────────────────────────────────────────

  /**
   * Get all laps for a session.
   */
  ipcMain.handle(IPC_CHANNELS.DB_GET_LAPS, (_event, sessionId: number) => {
    const stmt = db.prepare(
      'SELECT * FROM laps WHERE session_id = ? ORDER BY lap_number ASC',
    );
    return stmt.all(sessionId) as LapInfo[];
  });

  /**
   * Get a single lap by ID.
   */
  ipcMain.handle(IPC_CHANNELS.DB_GET_LAP, (_event, lapId: number) => {
    const stmt = db.prepare('SELECT * FROM laps WHERE id = ?');
    return stmt.get(lapId) as LapInfo | undefined;
  });

  /**
   * Get the best laps across sessions, filtered optionally by track/car.
   */
  ipcMain.handle(
    IPC_CHANNELS.DB_GET_BEST_LAPS,
    (_event, options?: { track?: string; car?: string; limit?: number }) => {
      const limit = options?.limit ?? 20;
      let query = `
        SELECT l.*, s.track_name, s.car_model, s.game_id
        FROM laps l
        JOIN sessions s ON l.session_id = s.id
        WHERE l.is_valid = 1 AND l.lap_time IS NOT NULL AND l.lap_time > 0
      `;
      const params: (string | number)[] = [];

      if (options?.track) {
        query += ' AND s.track_name = ?';
        params.push(options.track);
      }
      if (options?.car) {
        query += ' AND s.car_model = ?';
        params.push(options.car);
      }

      query += ' ORDER BY l.lap_time ASC LIMIT ?';
      params.push(limit);

      const stmt = db.prepare(query);
      return stmt.all(...params);
    },
  );

  // ───── Telemetry Samples ────────────────────────────────────────────────

  /**
   * Get telemetry samples for a lap.
   * Returns raw samples; msgpackr decoding of the data blob happens
   * in the repository layer or the renderer.
   */
  ipcMain.handle(
    IPC_CHANNELS.DB_GET_TELEMETRY_SAMPLES,
    (_event, lapId: number, options?: { downsample?: number }) => {
      if (options?.downsample && options.downsample > 1) {
        // Return every Nth sample for performance
        const stmt = db.prepare(
          `SELECT * FROM (
            SELECT *, ROW_NUMBER() OVER (ORDER BY timestamp ASC) AS rn
            FROM telemetry_samples WHERE lap_id = ?
          ) WHERE rn % ? = 0
          ORDER BY timestamp ASC`,
        );
        return stmt.all(lapId, options.downsample) as TelemetrySample[];
      }

      const stmt = db.prepare(
        'SELECT * FROM telemetry_samples WHERE lap_id = ? ORDER BY timestamp ASC',
      );
      return stmt.all(lapId) as TelemetrySample[];
    },
  );

  // ───── Export / Import ──────────────────────────────────────────────────

  /**
   * Export a session and all its data to a JSON file.
   */
  ipcMain.handle(IPC_CHANNELS.DB_EXPORT_SESSION, async (_event, sessionId: number) => {
    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as
      | SessionInfo
      | undefined;
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const laps = db.prepare(
      'SELECT * FROM laps WHERE session_id = ? ORDER BY lap_number ASC',
    ).all(sessionId) as LapInfo[];

    const samples: TelemetrySample[] = [];
    for (const lap of laps) {
      const lapSamples = db.prepare(
        'SELECT * FROM telemetry_samples WHERE lap_id = ? ORDER BY timestamp ASC',
      ).all(lap.id) as TelemetrySample[];
      samples.push(...lapSamples);
    }

    const exportData = { version: 1, session, laps, samples, exportedAt: Date.now() };

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export Session',
      defaultPath: `session_${sessionId}_${session.track_name}.json`,
      filters: [
        { name: 'ApexTelemetry Session', extensions: ['json'] },
      ],
    });

    if (canceled || !filePath) return null;

    await writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
    return filePath;
  });

  /**
   * Import a session from a JSON file.
   */
  ipcMain.handle(IPC_CHANNELS.DB_IMPORT_SESSION, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Import Session',
      filters: [
        { name: 'ApexTelemetry Session', extensions: ['json'] },
      ],
      properties: ['openFile'],
    });

    if (canceled || filePaths.length === 0) return null;

    const raw = await readFile(filePaths[0], 'utf-8');
    const importData = JSON.parse(raw) as {
      version: number;
      session: SessionInfo;
      laps: LapInfo[];
      samples: TelemetrySample[];
    };

    if (importData.version !== 1) {
      throw new Error(`Unsupported export format version: ${importData.version}`);
    }

    const importTransaction = db.transaction(() => {
      // Insert session
      const sessionStmt = db.prepare(
        `INSERT INTO sessions (steam_id, game_id, track_name, car_model, start_time, end_time, conditions)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      );
      const sessionResult = sessionStmt.run(
        importData.session.steam_id,
        importData.session.game_id,
        importData.session.track_name,
        importData.session.car_model,
        importData.session.start_time,
        importData.session.end_time,
        importData.session.conditions,
      );
      const newSessionId = sessionResult.lastInsertRowid as number;

      // Insert laps with ID mapping
      const lapIdMap = new Map<number, number>();
      const lapStmt = db.prepare(
        `INSERT INTO laps (session_id, lap_number, lap_time, sector1, sector2, sector3, is_valid)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const lap of importData.laps) {
        const lapResult = lapStmt.run(
          newSessionId,
          lap.lap_number,
          lap.lap_time,
          lap.sector1,
          lap.sector2,
          lap.sector3,
          lap.is_valid,
        );
        lapIdMap.set(lap.id, lapResult.lastInsertRowid as number);
      }

      // Insert telemetry samples with updated lap IDs
      const sampleStmt = db.prepare(
        `INSERT INTO telemetry_samples (lap_id, track_progress, timestamp, data)
         VALUES (?, ?, ?, ?)`,
      );
      for (const sample of importData.samples) {
        const newLapId = sample.lap_id != null ? lapIdMap.get(sample.lap_id) : null;
        if (newLapId != null) {
          sampleStmt.run(newLapId, sample.track_progress, sample.timestamp, JSON.stringify(sample.data));
        }
      }

      return newSessionId;
    });

    return importTransaction();
  });
}

/**
 * Removes all database IPC handlers.
 * Call during app shutdown for clean teardown.
 */
export function unregisterDatabaseIPC(): void {
  const channels = [
    IPC_CHANNELS.DB_GET_SESSIONS,
    IPC_CHANNELS.DB_GET_SESSION,
    IPC_CHANNELS.DB_DELETE_SESSION,
    IPC_CHANNELS.DB_GET_LAPS,
    IPC_CHANNELS.DB_GET_LAP,
    IPC_CHANNELS.DB_GET_TELEMETRY_SAMPLES,
    IPC_CHANNELS.DB_GET_BEST_LAPS,
    IPC_CHANNELS.DB_EXPORT_SESSION,
    IPC_CHANNELS.DB_IMPORT_SESSION,
  ];

  for (const channel of channels) {
    ipcMain.removeHandler(channel);
  }
}
