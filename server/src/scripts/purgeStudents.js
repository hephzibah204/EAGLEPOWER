import '../config/env.js';
import db from '../config/db.js';

console.log('🚀 Starting clean purge of student records and related accounts...');

const beforeCounts = {
  students: db.prepare('SELECT COUNT(*) as c FROM students').get().c,
  student_users: db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'student'").get().c,
  parent_users: db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'parent'").get().c,
  classes: db.prepare('SELECT COUNT(*) as c FROM classes').get().c,
  staff: db.prepare('SELECT COUNT(*) as c FROM staff').get().c,
  subjects: db.prepare('SELECT COUNT(*) as c FROM subjects').get().c,
  admin_users: db.prepare("SELECT COUNT(*) as c FROM users WHERE role IN ('superadmin', 'admin', 'bursar', 'teacher')").get().c
};

console.log('Current state before purge:', beforeCounts);

db.exec('PRAGMA foreign_keys = ON;');
db.exec('BEGIN TRANSACTION;');

try {
  // 1. Clear student cascading and related records
  db.exec('DELETE FROM homework_submissions;');
  db.exec('DELETE FROM student_learning_profiles;');
  db.exec('DELETE FROM ai_parent_recommendations;');
  db.exec('DELETE FROM marks;');
  db.exec('DELETE FROM report_extras;');
  db.exec('DELETE FROM student_attendance;');
  db.exec('DELETE FROM payments;');
  db.exec('DELETE FROM invoices;');

  // 2. Clear all student records
  const studentDeleteResult = db.prepare('DELETE FROM students;').run();
  console.log(`✓ Deleted ${studentDeleteResult.changes} records from students table.`);

  // 3. Clear student user accounts
  const studentUsersDelete = db.prepare("DELETE FROM users WHERE role = 'student';").run();
  console.log(`✓ Deleted ${studentUsersDelete.changes} student login accounts.`);

  // 4. Clear parent user accounts
  const parentUsersDelete = db.prepare("DELETE FROM users WHERE role = 'parent';").run();
  console.log(`✓ Deleted ${parentUsersDelete.changes} parent login accounts.`);

  // 5. Reset autoincrement sequence for students
  try {
    db.prepare("DELETE FROM sqlite_sequence WHERE name = 'students'").run();
    console.log('✓ Reset students table autoincrement sequence.');
  } catch (seqErr) {
    console.warn('Note on sequence reset:', seqErr.message);
  }

  // 6. Log audit entry
  try {
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity, details, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      'ADMIN_SYSTEM',
      'PURGE_STUDENTS',
      'STUDENTS',
      `Purged ${beforeCounts.students} students, ${beforeCounts.student_users} student logins, and ${beforeCounts.parent_users} parent logins to prepare for new student roster upload.`,
      '127.0.0.1'
    );
    console.log('✓ Recorded action in audit logs.');
  } catch (auditErr) {
    console.warn('Note on audit log:', auditErr.message);
  }

  db.exec('COMMIT;');
  console.log('✓ Transaction committed successfully.');

  // Run VACUUM to reclaim space and optimize WAL
  try {
    db.exec('VACUUM;');
    console.log('✓ Database vacuumed and optimized.');
  } catch (vacErr) {
    console.warn('Vacuum notice:', vacErr.message);
  }

  const afterCounts = {
    students: db.prepare('SELECT COUNT(*) as c FROM students').get().c,
    student_users: db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'student'").get().c,
    parent_users: db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'parent'").get().c,
    classes: db.prepare('SELECT COUNT(*) as c FROM classes').get().c,
    staff: db.prepare('SELECT COUNT(*) as c FROM staff').get().c,
    subjects: db.prepare('SELECT COUNT(*) as c FROM subjects').get().c,
    admin_users: db.prepare("SELECT COUNT(*) as c FROM users WHERE role IN ('superadmin', 'admin', 'bursar', 'teacher')").get().c
  };

  console.log('\nFinal state after purge:', afterCounts);
  console.log('\n🎉 Database is ready for new student roster upload!');
} catch (err) {
  db.exec('ROLLBACK;');
  console.error('❌ Error during purge, rolled back transaction:', err);
  process.exit(1);
}
