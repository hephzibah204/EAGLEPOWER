import db from '../server/src/config/db.js';
import fs from 'node:fs';

const raw = fs.readFileSync('server/data/official_students_roster_user_provided.csv', 'utf8');

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
  'JSS TWO': () => 2,
  'JSS THREE': () => 3,
  'SSS ONE': () => 4,
  'SSS TWO': () => 5,
  'SSS THREE': () => 6
};

const lines = raw.split(/\r?\n/);
let currentClass = '';
const parsed = [];
const classCounts = {};

for (const line of lines) {
  let trimmed = line.trim();
  if (!trimmed) continue;
  if (trimmed.startsWith(',')) {
    trimmed = trimmed.replace(/^,+/, '');
  }
  if (trimmed.startsWith('CLASS:')) {
    currentClass = trimmed.replace('CLASS:', '').replace(/,/g, '').trim();
    classCounts[currentClass] = 0;
    continue;
  }
  if (trimmed.startsWith('STUDENT\'S') || trimmed.startsWith('DOB') || trimmed.startsWith(',DOB')) continue;
  const parts = trimmed.split(',');
  if (parts.length >= 2 && /^\d+$/.test(parts[0].trim())) {
    const rawName = parts[1]?.trim();
    if (!rawName) continue;
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

    const nameObj = parseName(rawName);
    const dob = parseDate(rawDob);
    const phone = normalizePhone(rawPhone, knownPhoneFixes[rawName]);

    const resolver = classMap[currentClass];
    if (!resolver) {
      console.error(`UNKNOWN CLASS: "${currentClass}"`);
    }
    const classId = resolver ? resolver(classCode) : null;
    classCounts[currentClass] = (classCounts[currentClass] || 0) + 1;

    parsed.push({
      index: parsed.length + 1,
      classHeader: currentClass,
      classId,
      classCode,
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

console.log(`Parsed ${parsed.length} students from user roster:`);
console.table(classCounts);

// Query all students currently in DB
const dbStudents = db.prepare(`
  SELECT s.*, c.name as current_class_name
  FROM students s
  JOIN classes c ON s.class_id = c.id
  ORDER BY s.id ASC
`).all();

console.log(`Current DB students: ${dbStudents.length}`);

// Compare
let classMismatches = [];
let dobMismatches = [];
let phoneMismatches = [];
let genderMismatches = [];
let guardianMismatches = [];

for (let i = 0; i < parsed.length; i++) {
  const p = parsed[i];
  const d = dbStudents[i];
  if (!d) continue;

  if (p.classId !== d.class_id) {
    classMismatches.push({
      admNo: d.admission_no,
      name: `${d.last_name} ${d.first_name}`,
      expectedClassId: p.classId,
      expectedClassName: p.classHeader,
      currentClassId: d.class_id,
      currentClassName: d.current_class_name
    });
  }

  if (p.dob !== d.dob) {
    dobMismatches.push({
      admNo: d.admission_no,
      name: `${d.last_name} ${d.first_name}`,
      expectedDob: p.dob,
      currentDob: d.dob
    });
  }

  if (p.phone !== d.guardian_phone) {
    phoneMismatches.push({
      admNo: d.admission_no,
      name: `${d.last_name} ${d.first_name}`,
      expectedPhone: p.phone,
      currentPhone: d.guardian_phone
    });
  }

  if (p.gender !== d.gender) {
    genderMismatches.push({
      admNo: d.admission_no,
      name: `${d.last_name} ${d.first_name}`,
      expectedGender: p.gender,
      currentGender: d.gender
    });
  }

  if (p.guardian !== d.guardian_name) {
    guardianMismatches.push({
      admNo: d.admission_no,
      name: `${d.last_name} ${d.first_name}`,
      expectedGuardian: p.guardian,
      currentGuardian: d.guardian_name
    });
  }
}

console.log(`\n--- DISCREPANCY AUDIT ---`);
console.log(`Class mismatches: ${classMismatches.length}`);
console.log(`DOB mismatches: ${dobMismatches.length}`);
console.log(`Phone mismatches: ${phoneMismatches.length}`);
console.log(`Gender mismatches: ${genderMismatches.length}`);
console.log(`Guardian mismatches: ${guardianMismatches.length}`);

if (classMismatches.length > 0) {
  console.log('\n--- CLASS MISMATCHES (first 15) ---');
  console.table(classMismatches.slice(0, 15));
  console.log('\n--- CLASS MISMATCHES (last 15) ---');
  console.table(classMismatches.slice(-15));
}

if (phoneMismatches.length > 0) {
  console.log('\n--- PHONE MISMATCHES (first 5) ---');
  console.table(phoneMismatches.slice(0, 5));
}

if (dobMismatches.length > 0) {
  console.log('\n--- DOB MISMATCHES (first 5) ---');
  console.table(dobMismatches.slice(0, 5));
}
