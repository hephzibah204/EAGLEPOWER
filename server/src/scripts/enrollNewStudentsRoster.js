import '../config/env.js';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';

console.log('🦅 Starting Eagle Power Schools Official Student Enrollment & Admission Number Generation...');

const rawCsvPath = path.resolve('server/data/raw_students_upload.csv');
const rawCsv = fs.readFileSync(rawCsvPath, 'utf8');

function titleCase(str) {
  if (!str) return '';
  return str.trim().split(/\s+/).map(word => {
    if (word.includes('-')) {
      return word.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join('-');
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

function parseName(rawName) {
  const clean = rawName.trim().replace(/\s+/g, ' ');
  const parts = clean.split(' ');
  const lastName = titleCase(parts[0]);
  const givenNames = parts.slice(1).map(p => titleCase(p));
  const firstName = givenNames[0] || lastName;
  const middleName = givenNames.slice(1).join(' ') || null;
  return {
    raw: clean,
    lastName,
    firstName: middleName ? `${firstName} ${middleName}` : firstName,
    singleFirstName: firstName,
    middleName
  };
}

function parseDate(raw) {
  if (!raw || !raw.trim()) return null;
  let s = raw.trim().replace(/\s+/g, ' ');
  s = s.replace(/20819/, '2019');
  if (s.endsWith('/201/') || s.endsWith('/201')) {
    s = s.replace(/\/201\/?$/, '/2012');
  }
  s = s.replace(/(\d{1,2})\/(\d{1,2})(20\d\d)/, '$1/$2/$3');
  s = s.replace(/229\/9\/2014/, '29/9/2014');
  s = s.replace(/23-01 2021/, '23/01/2021');
  s = s.replace(/-/g, '/');

  const ymd = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (ymd) {
    const [_, y, m, d] = ymd;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const [_, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  return null;
}

function normalizePhone(raw, siblingPhone = null) {
  if (siblingPhone) return siblingPhone;
  if (!raw || !raw.trim()) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10 && ['7', '8', '9'].includes(digits[0])) {
    return '0' + digits;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits;
  }
  if (digits.length === 9) {
    return '0' + digits;
  }
  return digits;
}

const knownPhoneFixes = {
  'CHIGBO SOPHIA': '08143350410',
  'CHIGBO ANGEL': '08143350410',
  'RUFUS CHIMOBI': '08033981564',
  'UDOKWU DONALD': '08034069368',
  'UGOCHUKWU SAMUEL MMADUABUROCHUKWU': '09061566463'
};

const classMap = {
  'DAYCARE/PRE-NURSERY': (code) => code === 'D/C' ? 1 : 21,
  'NURSERY ONE': () => 7,
  'NURSERY TWO': () => 8,
  'NURSERY THREE': () => 9,
  'BASIC ONE': () => 10,
  'BASIC TWO': () => 11,
  'BASIC THREE': () => 12,
  'BASIC FOUR': () => 13,
  'BASIC FIVE': () => 14,
  'BASIC SIX': () => 15,
  'JSS ONE': () => 20,
  'JSS  TWO': () => 2,
  'JSS THREE': () => 3,
  'SSS ONE': () => 4,
  'SSS TWO': () => 5,
  'SSS THREE': () => 6
};

const lines = rawCsv.split(/\r?\n/);
let currentClass = '';
const parsedStudents = [];
let admissionCounter = 1;

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed) continue;
  if (trimmed.startsWith('CLASS:')) {
    currentClass = trimmed.replace('CLASS:', '').trim();
    continue;
  }
  if (trimmed.startsWith('STUDENT\'S') || trimmed.startsWith(',STUDENT\'S')) continue;
  const parts = trimmed.split(',');
  if (parts.length >= 2 && /^\d+$/.test(parts[0].trim())) {
    const rawName = parts[1]?.trim();
    const rawDob = parts[2]?.trim();
    let rawGender = parts[3]?.trim().toUpperCase();
    const classCode = parts[4]?.trim();
    const guardian = parts[5]?.trim();
    const rawPhone = parts[6]?.trim();

    if (!rawGender) {
      if (['UGWU OSCAR', 'OBI RAYMOND', 'UDOKWU MICHAEL', 'OKOYE ONYEDIKA'].includes(rawName)) {
        rawGender = 'M';
      } else {
        rawGender = 'F';
      }
    }
    const gender = rawGender === 'M' ? 'Male' : 'Female';

    const admNo = `EPS-2026-${String(admissionCounter).padStart(3, '0')}`;
    admissionCounter++;

    const nameObj = parseName(rawName);
    const dob = parseDate(rawDob);
    const phone = normalizePhone(rawPhone, knownPhoneFixes[rawName]);

    const classResolver = classMap[currentClass];
    if (!classResolver) {
      throw new Error(`Unknown class category: "${currentClass}" on line: ${line}`);
    }
    const classId = classResolver(classCode);

    parsedStudents.push({
      admNo,
      classCategory: currentClass,
      classCode,
      classId,
      rawName,
      lastName: nameObj.lastName,
      firstName: nameObj.firstName,
      gender,
      dob,
      guardian: guardian ? titleCase(guardian) : null,
      phone
    });
  }
}

console.log(`Parsed ${parsedStudents.length} students from roster.`);

// Precompute password hashes once
const salt = bcrypt.genSaltSync(10);
const studentPasswordHash = bcrypt.hashSync('Eagle2025!', salt);
const parentPasswordHash = bcrypt.hashSync('EagleParent2025!', salt);

db.exec('PRAGMA foreign_keys = ON;');
db.exec('BEGIN TRANSACTION;');

try {
  const insStudent = db.prepare(`
    INSERT INTO students (
      admission_no, first_name, last_name, gender, dob, class_id, section_id,
      guardian_name, guardian_phone, address, nationality, state_of_origin,
      lga_of_origin, religion, enrolled_session, enrolled_term, admission_date,
      entry_mode, boarding_status, is_active
    ) VALUES (
      ?, ?, ?, ?, ?, ?, 1,
      ?, ?, 'Awka, Anambra State', 'Nigerian', 'Anambra State',
      'Awka South', 'Christianity', '2026/2027', 'First Term', '2026-09-08',
      'Fresh Admission', 'Day Student', 1
    )
  `);

  const insStudentUser = db.prepare(`
    INSERT INTO users (
      username, email, phone, password_hash, role, reference_id, full_name, is_active
    ) VALUES (?, NULL, ?, ?, 'student', ?, ?, 1)
  `);

  const findParent = db.prepare('SELECT id FROM users WHERE username = ?');
  const insParentUser = db.prepare(`
    INSERT INTO users (
      username, email, phone, password_hash, role, reference_id, full_name, is_active
    ) VALUES (?, NULL, ?, ?, 'parent', ?, ?, 1)
  `);

  let studentCount = 0;
  let studentUserCount = 0;
  let parentUserCount = 0;

  for (const st of parsedStudents) {
    // 1. Insert Student Record
    insStudent.run(
      st.admNo,
      st.firstName,
      st.lastName,
      st.gender,
      st.dob,
      st.classId,
      st.guardian,
      st.phone
    );
    studentCount++;

    // 2. Insert Student Portal Account
    insStudentUser.run(
      st.admNo,
      st.phone,
      studentPasswordHash,
      st.admNo,
      `${st.firstName} ${st.lastName}`
    );
    studentUserCount++;

    // 3. Provision Parent Portal Account if guardian phone available
    if (st.phone && st.phone.length >= 7) {
      const existing = findParent.get(st.phone);
      if (!existing) {
        insParentUser.run(
          st.phone,
          st.phone,
          parentPasswordHash,
          st.admNo,
          st.guardian || `Guardian of ${st.firstName} ${st.lastName}`
        );
        parentUserCount++;
      }
    }
  }

  // 4. Log Audit
  db.prepare(`
    INSERT INTO audit_logs (user_id, action, entity, details, ip_address)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    'ADMIN_SYSTEM',
    'ENROLL_NEW_STUDENTS_ROSTER',
    'STUDENTS',
    `Successfully enrolled ${studentCount} students (EPS-2026-001 through EPS-2026-379), created ${studentUserCount} student logins, and provisioned ${parentUserCount} parent portal accounts.`,
    '127.0.0.1'
  );

  db.exec('COMMIT;');
  console.log('✅ [COMMIT SUCCESS]');
  console.log(`- Enrolled Students: ${studentCount}`);
  console.log(`- Student Logins Provisioned: ${studentUserCount}`);
  console.log(`- Unique Parent Logins Provisioned: ${parentUserCount}`);

  // Reclaim disk space and reindex
  db.exec('VACUUM;');
  console.log('✅ Database vacuumed and optimized.');

} catch (err) {
  db.exec('ROLLBACK;');
  console.error('❌ Error during enrollment:', err);
  process.exit(1);
}
