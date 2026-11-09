import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'eaglepower.db');
const db = new DatabaseSync(DB_PATH);

// Configure SQLite for high performance and safety
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

// Initialize tables from schema.sql
const schemaPath = path.join(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
}

// Auto-migrate deep student enrollment columns
try {
  db.exec('ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0');
} catch (error) {
  if (!String(error.message).includes('duplicate column name')) throw error;
}

// Auto-migrate deep student enrollment columns
const studentDeepColumns = [
  'middle_name TEXT',
  'religion TEXT',
  'nationality TEXT DEFAULT "Nigerian"',
  'state_of_origin TEXT',
  'lga_of_origin TEXT',
  'mother_tongue TEXT',
  'blood_group TEXT',
  'genotype TEXT',
  'allergies TEXT',
  'medical_conditions TEXT',
  'special_needs TEXT',
  'emergency_contact_name TEXT',
  'emergency_contact_phone TEXT',
  'emergency_contact_relationship TEXT',
  'admission_date DATE',
  'enrolled_session TEXT',
  'enrolled_term TEXT',
  'entry_mode TEXT DEFAULT "Fresh Admission"',
  'previous_school TEXT',
  'last_class_passed TEXT',
  'reason_for_transfer TEXT',
  'guardian_title TEXT',
  'guardian_relationship TEXT',
  'guardian_alt_phone TEXT',
  'guardian_occupation TEXT',
  'guardian_office_address TEXT',
  'mother_name TEXT',
  'mother_phone TEXT',
  'mother_email TEXT',
  'mother_occupation TEXT',
  'boarding_status TEXT DEFAULT "Day Student"',
  'transport_mode TEXT DEFAULT "Private Pick-up"',
  'bus_route TEXT',
  'passport_photo TEXT',
  'updated_at DATETIME DEFAULT CURRENT_TIMESTAMP'
];

for (const col of studentDeepColumns) {
  try {
    db.exec(`ALTER TABLE students ADD COLUMN ${col};`);
  } catch (_e) {
    // Column already exists
  }
}

// Auto-migrate deep admissions application columns
const admissionDeepColumns = [
  'middle_name TEXT',
  'religion TEXT',
  'nationality TEXT DEFAULT "Nigerian"',
  'state_of_origin TEXT',
  'lga_of_origin TEXT',
  'blood_group TEXT',
  'genotype TEXT',
  'allergies TEXT',
  'medical_conditions TEXT',
  'special_needs TEXT',
  'emergency_contact_name TEXT',
  'emergency_contact_phone TEXT',
  'emergency_contact_relationship TEXT',
  'entry_mode TEXT DEFAULT "Fresh Admission"',
  'last_class_passed TEXT',
  'guardian_title TEXT',
  'guardian_relationship TEXT',
  'guardian_alt_phone TEXT',
  'guardian_occupation TEXT',
  'guardian_office_address TEXT',
  'mother_name TEXT',
  'mother_phone TEXT',
  'mother_email TEXT',
  'mother_occupation TEXT',
  'boarding_status TEXT DEFAULT "Day Student"',
  'transport_mode TEXT DEFAULT "Private Pick-up"',
  'bus_route TEXT'
];

for (const col of admissionDeepColumns) {
  try {
    db.exec(`ALTER TABLE admissions ADD COLUMN ${col};`);
  } catch (_e) {
    // Column already exists
  }
}

// Auto-migrate multi-component assessment columns on marks table
const marksAssessmentColumns = [
  'ca1_score REAL DEFAULT NULL',
  'ca2_score REAL DEFAULT NULL',
  'project_score REAL DEFAULT NULL',
  'division_grade TEXT DEFAULT NULL'
];

for (const col of marksAssessmentColumns) {
  try {
    db.exec(`ALTER TABLE marks ADD COLUMN ${col};`);
  } catch (_e) {
    // Column already exists
  }
}

// Auto-migrate invoice fee breakdown and Paystack checkout columns
const invoiceFeeColumns = [
  'breakdown_json TEXT',
  'paystack_reference TEXT',
  'paystack_access_code TEXT'
];

for (const col of invoiceFeeColumns) {
  try {
    db.exec(`ALTER TABLE invoices ADD COLUMN ${col};`);
  } catch (_e) {
    // Column already exists
  }
}

// Auto-migrate system_settings columns
const systemSettingsColumns = [
  'term_locked INTEGER DEFAULT 0',
  'active_report_template TEXT DEFAULT "ELITE"',
  'whatsapp_phone TEXT DEFAULT "+234 907 558 0671"'
];

for (const col of systemSettingsColumns) {
  try {
    db.exec(`ALTER TABLE system_settings ADD COLUMN ${col};`);
  } catch (_e) {
    // Column already exists
  }
}

// Auto-migrate staff profile & ID card credentials
const staffProfileColumns = [
  'photo_url TEXT',
  'signature_url TEXT',
  'blood_group TEXT DEFAULT "O+"',
  'emergency_contact TEXT'
];

for (const col of staffProfileColumns) {
  try {
    db.exec(`ALTER TABLE staff ADD COLUMN ${col};`);
  } catch (_e) {
    // Column already exists
  }
}

// Auto-migrate users avatar & signature credentials
const userProfileColumns = [
  'avatar_url TEXT',
  'signature_url TEXT'
];

for (const col of userProfileColumns) {
  try {
    db.exec(`ALTER TABLE users ADD COLUMN ${col};`);
  } catch (_e) {
    // Column already exists
  }
}

// Auto-migrate comprehensive staff directory fields
const staffComprehensiveColumns = [
  'gender TEXT',
  'dob TEXT',
  'date_employed TEXT',
  'employment_type TEXT DEFAULT "Full time"',
  'address TEXT',
  'emergency_contact_name TEXT',
  'salary REAL DEFAULT 0',
  'form_responsibility TEXT'
];

for (const col of staffComprehensiveColumns) {
  try {
    db.exec(`ALTER TABLE staff ADD COLUMN ${col};`);
  } catch (_e) {
    // Column already exists
  }
}

// Ensure lesson_notes table exists
db.exec(`
CREATE TABLE IF NOT EXISTS lesson_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER REFERENCES staff(id),
  teacher_name TEXT NOT NULL,
  class_id INTEGER NOT NULL REFERENCES classes(id),
  subject_id INTEGER NOT NULL REFERENCES subjects(id),
  session TEXT DEFAULT '2026/2027',
  term TEXT DEFAULT 'Second Term',
  week_number TEXT NOT NULL,
  topic TEXT NOT NULL,
  subtopic TEXT,
  behavioral_objectives TEXT,
  instructional_materials TEXT,
  previous_knowledge TEXT,
  introduction TEXT,
  presentation_steps TEXT,
  evaluation TEXT,
  conclusion TEXT,
  assignment TEXT,
  status TEXT DEFAULT 'Under Review' CHECK(status IN ('Draft', 'Under Review', 'Approved', 'Needs Revision')),
  hod_feedback TEXT,
  reviewed_by TEXT,
  reviewed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

// Polyfill transaction method for Node.js native DatabaseSync
if (typeof db.transaction !== 'function') {
  db.transaction = function(fn) {
    return function(...args) {
      db.exec('BEGIN TRANSACTION;');
      try {
        const result = fn(...args);
        db.exec('COMMIT;');
        return result;
      } catch (err) {
        try { db.exec('ROLLBACK;'); } catch (_) {}
        throw err;
      }
    };
  };
}

export default db;
