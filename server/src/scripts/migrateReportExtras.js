import db from '../config/db.js';

console.log('Migrating report_extras table...');

db.exec(`
CREATE TABLE IF NOT EXISTS report_extras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session TEXT DEFAULT '2024/2025',
  term TEXT DEFAULT 'Second Term',
  attendance TEXT DEFAULT '{"opened":120,"present":116,"absent":4}',
  traits TEXT DEFAULT '{"politeness":5,"neatness":5,"punctuality":4,"attentiveness":5,"honesty":5,"initiative":4,"selfControl":5,"cooperation":4}',
  psychomotor TEXT DEFAULT '{"handwriting":4,"fluency":5,"sports":4,"drawing":4,"tools":4,"club":5}',
  teacher_comment TEXT DEFAULT 'A very diligent and focused student. Shows high academic promise.',
  principal_comment TEXT DEFAULT 'Commendable result. Maintain this excellent standard of discipline and hard work.',
  next_term_resumption TEXT DEFAULT '2025-04-28',
  promotion_status TEXT DEFAULT 'Promoted to Next Class',
  template TEXT DEFAULT 'ELITE',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, session, term)
);
`);

console.log('✅ report_extras table migrated successfully!');
