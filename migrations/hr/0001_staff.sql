CREATE TABLE IF NOT EXISTS hr_staff (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE COLLATE NOCASE,
  record_json TEXT NOT NULL,
  user_json TEXT,
  credential_json TEXT
);
CREATE TABLE IF NOT EXISTS hr_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_json TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS hr_sessions_user ON hr_sessions(user_id);
CREATE TABLE IF NOT EXISTS hr_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  staff_no TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
