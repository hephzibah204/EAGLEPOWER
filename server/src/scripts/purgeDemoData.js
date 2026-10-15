import db from '../config/db.js';

console.log('🧹 Clearing test and demo transactions from Eagle Power EduCore...');

// Begin transaction
db.exec('BEGIN TRANSACTION;');

try {
  // 1. Clear test admissions submissions
  db.exec('DELETE FROM admissions;');
  console.log('  ✓ Cleared admissions submissions');

  // 2. Clear reception / frontdesk test entries
  db.exec('DELETE FROM frontdesk_visitors;');
  db.exec('DELETE FROM frontdesk_enquiries;');
  db.exec('DELETE FROM frontdesk_calls;');
  db.exec('DELETE FROM frontdesk_dispatch;');
  db.exec('DELETE FROM frontdesk_complaints;');
  console.log('  ✓ Cleared front desk records (visitors, enquiries, calls, dispatch, complaints)');

  // 3. Clear attendance records (test attendance generated during testing)
  db.exec('DELETE FROM student_attendance;');
  db.exec('DELETE FROM staff_attendance;');
  console.log('  ✓ Cleared student & staff attendance logs');

  // 4. Clear test homework assignments and submissions
  db.exec('DELETE FROM homework_submissions;');
  db.exec('DELETE FROM homework_assignments;');
  console.log('  ✓ Cleared test homework assignments & AI submissions');

  // 5. Clear test payroll transactions
  db.exec('DELETE FROM payroll_items;');
  db.exec('DELETE FROM payroll_batches;');
  console.log('  ✓ Cleared test payroll batches and disbursement items');

  // 6. Reset payments and invoices
  db.exec('DELETE FROM payments;');
  db.exec('DELETE FROM invoices;');
  console.log('  ✓ Cleared test invoices and payment receipts');

  // 7. Clear test marks & report extras
  db.exec('DELETE FROM marks;');
  db.exec('DELETE FROM report_extras;');
  console.log('  ✓ Cleared test marks and report card draft remarks');

  // 8. Clean audit logs
  db.exec('DELETE FROM audit_logs;');
  db.exec(`
    INSERT INTO audit_logs (user_id, action, entity, details, ip_address)
    VALUES ('SUPERADMIN', 'PURGE_DEMO_DATA', 'SYSTEM', 'Demo and test transaction records purged for official production launch', '127.0.0.1');
  `);
  console.log('  ✓ Reset audit log for launch readiness');

  // Commit transaction
  db.exec('COMMIT;');

  // Optimize database file
  db.exec('VACUUM;');

  console.log('\n🎉 Production Database Cleanup Complete!');
  console.log('Retained:');
  console.log(`- Classes: ${db.prepare('SELECT count(*) as c FROM classes').get().c}`);
  console.log(`- Subjects: ${db.prepare('SELECT count(*) as c FROM subjects').get().c}`);
  console.log(`- Staff: ${db.prepare('SELECT count(*) as c FROM staff').get().c}`);
  console.log(`- Students: ${db.prepare('SELECT count(*) as c FROM students').get().c}`);
  console.log(`- Users: ${db.prepare('SELECT count(*) as c FROM users').get().c}`);
} catch (err) {
  db.exec('ROLLBACK;');
  console.error('❌ Error during cleanup:', err.message);
  process.exit(1);
}
