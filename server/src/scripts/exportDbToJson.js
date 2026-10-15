import db from '../config/db.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetFile = path.resolve(__dirname, '../../../src/data/portalDbData.json');

console.log('🔄 Exporting SQLite database to portalDbData.json...');

const classes = db.prepare(`
  SELECT c.*, (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id AND s.is_active = 1) as student_count 
  FROM classes c 
  ORDER BY c.id ASC
`).all();

const sections = db.prepare('SELECT * FROM sections ORDER BY id ASC').all();
const subjects = db.prepare('SELECT * FROM subjects ORDER BY id ASC').all();
const students = db.prepare(`
  SELECT s.*, c.name as class_name, c.division 
  FROM students s 
  LEFT JOIN classes c ON s.class_id = c.id 
  WHERE s.is_active = 1 
  ORDER BY s.id ASC
`).all();

const staff = db.prepare(`
  SELECT s.*, u.username, u.role as user_role 
  FROM staff s 
  LEFT JOIN users u ON u.reference_id = s.staff_no 
  WHERE s.is_active = 1 
  ORDER BY s.id ASC
`).all();

const invoices = db.prepare(`
  SELECT i.*, s.admission_no, s.first_name || ' ' || s.last_name as student_name, c.name as class_name 
  FROM invoices i 
  JOIN students s ON i.student_id = s.id 
  LEFT JOIN classes c ON s.class_id = c.id 
  ORDER BY i.id DESC
`).all();

const payments = db.prepare('SELECT * FROM payments ORDER BY id DESC').all();

const staff_salary_structures = db.prepare(`
  SELECT sss.*, st.name as staff_name, st.role as staff_role, st.staff_no 
  FROM staff_salary_structures sss 
  JOIN staff st ON sss.staff_id = st.id 
  ORDER BY sss.id ASC
`).all();

const payroll_batches = db.prepare('SELECT * FROM payroll_batches ORDER BY id DESC').all();
const visitors = db.prepare('SELECT * FROM frontdesk_visitors ORDER BY id DESC').all();
const enquiries = db.prepare('SELECT * FROM frontdesk_enquiries ORDER BY id DESC').all();
const calls = db.prepare('SELECT * FROM frontdesk_calls ORDER BY id DESC').all();
const dispatch = db.prepare('SELECT * FROM frontdesk_dispatch ORDER BY id DESC').all();
const complaints = db.prepare('SELECT * FROM frontdesk_complaints ORDER BY id DESC').all();
const admissions = db.prepare('SELECT * FROM admissions ORDER BY id DESC').all();
const users = db.prepare('SELECT id, username, email, role, reference_id, full_name, is_active, last_login, created_at FROM users ORDER BY id ASC').all();
const audit_logs = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100').all();
const system_settings = db.prepare('SELECT * FROM system_settings WHERE id = 1').get() || {};

const exportData = {
  system: {
    name: system_settings.school_name || "Eagle Power Schools",
    motto: system_settings.motto || "Love, Truth & Service",
    legacy_portal: "https://portal.eaglepowerschools.com.ng/",
    admin_contact: system_settings.phone || "+234 803 359 1058",
    admin_email: system_settings.email || "adaeze3011@gmail.com",
    address: system_settings.address || "2 & 9 Amikwo Road, Awka, Anambra State",
    current_session: system_settings.session || system_settings.current_session || "2024/2025",
    current_term: system_settings.term || system_settings.current_term || "Second Term",
    next_resumption_date: system_settings.next_resumption_date || "2025-05-05"
  },
  classes,
  sections,
  subjects,
  students,
  staff,
  invoices,
  payments,
  staff_salary_structures,
  payroll_batches,
  visitors,
  enquiries,
  calls,
  dispatch,
  complaints,
  admissions,
  users,
  audit_logs,
  system_settings
};

fs.writeFileSync(targetFile, JSON.stringify(exportData, null, 2), 'utf8');

console.log(`✅ Successfully exported to ${targetFile}`);
console.log(`📊 Export summary:`);
console.log(`   - Classes: ${classes.length}`);
console.log(`   - Subjects: ${subjects.length}`);
console.log(`   - Students: ${students.length}`);
console.log(`   - Staff: ${staff.length}`);
console.log(`   - Invoices: ${invoices.length}`);
console.log(`   - Salary Structures: ${staff_salary_structures.length}`);
console.log(`   - Visitors: ${visitors.length}`);
console.log(`   - Users: ${users.length}`);
console.log(`   - Admissions: ${admissions.length}`);
console.log(`   - Audit Logs: ${audit_logs.length}`);
