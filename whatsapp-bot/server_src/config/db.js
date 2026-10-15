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
