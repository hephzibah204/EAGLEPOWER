CREATE TABLE IF NOT EXISTS attendance_records (
  class_id TEXT NOT NULL,
  attendance_date TEXT NOT NULL,
  student_id TEXT NOT NULL,
  status TEXT NOT NULL,
  remarks TEXT DEFAULT '',
  updated_at TEXT DEFAULT '',
  PRIMARY KEY (class_id, attendance_date, student_id)
);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance_records (class_id, attendance_date);
