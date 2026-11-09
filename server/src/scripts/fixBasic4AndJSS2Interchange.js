import '../config/env.js';
import db from '../config/db.js';

console.log('🔄 Executing Class Interchange Correction: Basic 4 (Primary 4, id: 13) <-> JSS 2 (id: 2)...');

const beforeCount13 = db.prepare('SELECT COUNT(*) as c FROM students WHERE class_id = 13').get().c;
const beforeCount2 = db.prepare('SELECT COUNT(*) as c FROM students WHERE class_id = 2').get().c;

console.log(`[BEFORE] Class 13 (Primary 4): ${beforeCount13} students`);
console.log(`[BEFORE] Class 2 (JSS2): ${beforeCount2} students`);

if (beforeCount13 !== 17 || beforeCount2 !== 39) {
  throw new Error(`Unexpected pre-swap student counts: Primary 4 = ${beforeCount13}, JSS 2 = ${beforeCount2}`);
}

const transaction = db.transaction(() => {
  // Step 1: Create a temporary class row to maintain valid foreign keys
  db.prepare(`
    INSERT INTO classes (id, name, division, termly_tuition) 
    VALUES (999, 'Temporary Swap Staging', 'Primary', 0)
  `).run();
  console.log('✓ Step 1: Created temporary staging class (id: 999)');

  // Step 2: Move class_id 13 students into temporary staging class 999
  const res1 = db.prepare('UPDATE students SET class_id = 999 WHERE class_id = 13').run();
  console.log(`✓ Step 2: Staged ${res1.changes} Basic 4 students into temporary class 999`);

  // Step 3: Assign class_id 2 students to 13 (Basic 4)
  const res2 = db.prepare('UPDATE students SET class_id = 13 WHERE class_id = 2').run();
  console.log(`✓ Step 3: Moved ${res2.changes} JSS2 students into Class 13 (Basic 4)`);

  // Step 4: Assign staged students (999) to 2 (JSS 2)
  const res3 = db.prepare('UPDATE students SET class_id = 2 WHERE class_id = 999').run();
  console.log(`✓ Step 4: Moved ${res3.changes} staged students into Class 2 (JSS 2)`);

  // Step 5: Remove temporary staging class
  db.prepare('DELETE FROM classes WHERE id = 999').run();
  console.log('✓ Step 5: Cleaned up temporary staging class (id: 999)');

  // Step 6: Record audit log entry
  try {
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, target_type, target_id, details, ip_address)
      VALUES (1, 'UPDATE_CLASS_ASSIGNMENTS', 'CLASS', 13, 'Corrected interchange between Basic 4 (39 students) and JSS 2 (17 students)', '127.0.0.1')
    `).run();
    console.log('✓ Step 6: Audit log entry recorded');
  } catch (err) {
    console.warn('⚠️ Audit log insertion skipped:', err.message);
  }
});

transaction();

const afterCount13 = db.prepare('SELECT COUNT(*) as c FROM students WHERE class_id = 13').get().c;
const afterCount2 = db.prepare('SELECT COUNT(*) as c FROM students WHERE class_id = 2').get().c;

console.log(`\n[AFTER] Class 13 (Primary 4 / Basic 4): ${afterCount13} students`);
console.log(`[AFTER] Class 2 (JSS2): ${afterCount2} students`);

// Checkpoint WAL
db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
console.log('✓ WAL checkpoint completed.');

db.close();
console.log('🎉 Class interchange successfully completed!');
