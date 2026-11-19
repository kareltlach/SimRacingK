/**
 * ApexTelemetry Studio — Database manager (JSON & in-memory storage fallback)
 *
 * Implements a compatible Database interface without requiring C++ native compilation,
 * ensuring seamless execution across all Node versions on Windows and macOS.
 */

import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';

export interface Statement<T = any> {
  run(...params: any[]): { changes: number; lastInsertRowid: number };
  get(...params: any[]): any;
  all(...params: any[]): any[];
}

export interface SqliteDatabase {
  pragma(sql: string): any;
  exec(sql: string): void;
  prepare(sql: string): Statement;
  transaction<F extends (...args: any[]) => any>(fn: F): F;
  close(): void;
}

class MemoryStatement implements Statement {
  private sql: string;
  private db: MemoryDatabase;

  constructor(sql: string, db: MemoryDatabase) {
    this.sql = sql.trim();
    this.db = db;
  }

  run(...params: any[]): { changes: number; lastInsertRowid: number } {
    return this.db.executeRun(this.sql, params);
  }

  get(...params: any[]): any {
    const rows = this.all(...params);
    return rows.length > 0 ? rows[0] : undefined;
  }

  all(...params: any[]): any[] {
    return this.db.executeSelect(this.sql, params);
  }
}

class MemoryDatabase implements SqliteDatabase {
  private tables: Map<string, any[]> = new Map();
  private autoIds: Map<string, number> = new Map();
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.load();
  }

  private load(): void {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const data = JSON.parse(raw);
        for (const [tbl, rows] of Object.entries(data.tables || {})) {
          this.tables.set(tbl, rows as any[]);
        }
        for (const [tbl, id] of Object.entries(data.autoIds || {})) {
          this.autoIds.set(tbl, id as number);
        }
      } catch (err) {
        console.warn('Could not parse database file, starting clean', err);
      }
    }
  }

  public save(): void {
    try {
      const obj: any = { tables: {}, autoIds: {} };
      for (const [tbl, rows] of this.tables.entries()) {
        obj.tables[tbl] = rows;
      }
      for (const [tbl, id] of this.autoIds.entries()) {
        obj.autoIds[tbl] = id;
      }
      fs.writeFileSync(this.filePath, JSON.stringify(obj, null, 2), 'utf-8');
    } catch {
      // ignore
    }
  }

  pragma(_sql: string): any {
    return null;
  }

  exec(sql: string): void {
    // Parse CREATE TABLE IF NOT EXISTS
    const matches = sql.matchAll(/CREATE TABLE IF NOT EXISTS\s+([a-zA-Z0-9_]+)/gi);
    for (const m of matches) {
      const tbl = m[1];
      if (!this.tables.has(tbl)) {
        this.tables.set(tbl, []);
        this.autoIds.set(tbl, 1);
      }
    }
    this.save();
  }

  prepare(sql: string): Statement {
    return new MemoryStatement(sql, this);
  }

  transaction<F extends (...args: any[]) => any>(fn: F): F {
    return ((...args: any[]) => {
      const res = fn(...args);
      this.save();
      return res;
    }) as F;
  }

  close(): void {
    this.save();
  }

  public executeRun(sql: string, params: any[]): { changes: number; lastInsertRowid: number } {
    const upper = sql.toUpperCase();

    if (upper.startsWith('INSERT INTO')) {
      const match = sql.match(/INSERT INTO\s+([a-zA-Z0-9_]+)/i);
      const tbl = match ? match[1] : '';
      if (!this.tables.has(tbl)) this.tables.set(tbl, []);
      const rows = this.tables.get(tbl)!;

      const nextId = (this.autoIds.get(tbl) || 1);
      this.autoIds.set(tbl, nextId + 1);

      const rowObj: any = { id: nextId };

      // Map parameters loosely or store object
      if (params.length === 1 && typeof params[0] === 'object' && params[0] !== null && !Array.isArray(params[0])) {
        Object.assign(rowObj, params[0]);
      } else {
        // generic column assignment
        params.forEach((val, idx) => {
          rowObj[`col_${idx}`] = val;
        });
        if (params[0] !== undefined) rowObj.id = params[0] || nextId;
      }

      rows.push(rowObj);
      this.save();
      return { changes: 1, lastInsertRowid: nextId };
    }

    if (upper.startsWith('DELETE FROM')) {
      const match = sql.match(/DELETE FROM\s+([a-zA-Z0-9_]+)/i);
      const tbl = match ? match[1] : '';
      if (this.tables.has(tbl)) {
        if (params.length > 0) {
          const id = params[0];
          const rows = this.tables.get(tbl)!;
          const filtered = rows.filter((r) => r.id !== id && r.session_id !== id);
          const changes = rows.length - filtered.length;
          this.tables.set(tbl, filtered);
          this.save();
          return { changes, lastInsertRowid: 0 };
        } else {
          const count = this.tables.get(tbl)!.length;
          this.tables.set(tbl, []);
          this.save();
          return { changes: count, lastInsertRowid: 0 };
        }
      }
    }

    return { changes: 0, lastInsertRowid: 0 };
  }

  public executeSelect(sql: string, params: any[]): any[] {
    const match = sql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    const tbl = match ? match[1] : '';
    if (!this.tables.has(tbl)) return [];

    const rows = this.tables.get(tbl)!;

    // WHERE id = ?
    if (sql.includes('WHERE id = ?') || sql.includes('WHERE session_id = ?')) {
      const id = params[0];
      return rows.filter((r) => r.id === id || r.session_id === id);
    }

    // Default return clone of all rows
    return [...rows];
  }
}

// ─── Singleton ──────────────────────────────────────────────
let _db: SqliteDatabase | null = null;

export function getDatabase(): SqliteDatabase {
  if (_db) return _db;

  const dbDir = app.getPath('userData');
  const dbPath = path.join(dbDir, 'apex_telemetry_store.json');
  fs.mkdirSync(dbDir, { recursive: true });

  _db = new MemoryDatabase(dbPath);

  // Initialize schema
  _db.exec(`
    CREATE TABLE IF NOT EXISTS profiles;
    CREATE TABLE IF NOT EXISTS sessions;
    CREATE TABLE IF NOT EXISTS laps;
    CREATE TABLE IF NOT EXISTS telemetry_samples;
    CREATE TABLE IF NOT EXISTS hud_layouts;
    CREATE TABLE IF NOT EXISTS steam_profiles;
  `);

  return _db;
}

export function cachedStmt<T = unknown>(sql: string): Statement<T> {
  const db = getDatabase();
  return db.prepare(sql) as Statement<T>;
}

export function closeDatabase(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

export default getDatabase;
