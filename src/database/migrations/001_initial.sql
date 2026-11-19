-- ApexTelemetry Studio – initial schema
-- Migration 001

CREATE TABLE IF NOT EXISTS profiles (
  steam_id TEXT PRIMARY KEY,
  nickname TEXT,
  avatar_url TEXT,
  steam_api_key TEXT,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  steam_id TEXT REFERENCES profiles(steam_id),
  game_id TEXT NOT NULL,
  track_name TEXT NOT NULL,
  car_model TEXT NOT NULL,
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  conditions TEXT DEFAULT 'dry'
);

CREATE TABLE IF NOT EXISTS laps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES sessions(id),
  lap_number INTEGER NOT NULL,
  lap_time REAL,
  sector1 REAL,
  sector2 REAL,
  sector3 REAL,
  is_valid INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS telemetry_samples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lap_id INTEGER NOT NULL REFERENCES laps(id),
  track_progress REAL NOT NULL,
  timestamp REAL NOT NULL,
  data BLOB NOT NULL
);

CREATE TABLE IF NOT EXISTS hud_layouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  game_rule TEXT,
  car_rule TEXT,
  widgets_json TEXT NOT NULL,
  resolution TEXT DEFAULT '1920x1080'
);

CREATE INDEX IF NOT EXISTS idx_samples_lap_progress ON telemetry_samples(lap_id, track_progress);
CREATE INDEX IF NOT EXISTS idx_laps_session ON laps(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_game ON sessions(game_id, track_name);
