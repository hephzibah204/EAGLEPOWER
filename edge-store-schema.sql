-- Durable override stores for the edge API (eaglepower-data, binding DB).
-- Each row holds the full merged record as JSON; deleted=1 hides a baseline row.
CREATE TABLE IF NOT EXISTS classes_store (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  deleted INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS subjects_store (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  deleted INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS staff_store (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  deleted INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS marks_store (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  deleted INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS otp_codes (
  key TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER DEFAULT 0
);
