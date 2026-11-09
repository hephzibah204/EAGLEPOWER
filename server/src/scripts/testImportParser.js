import fs from 'node:fs';

const rawCsv = fs.readFileSync('./server/data/raw_students_upload.csv', 'utf8');

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
  // 31/102020 -> 31/10/2020
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

// Known sibling phone fixes for truncated numbers
const knownPhoneFixes = {
  'CHIGBO SOPHIA': '08143350410',
  'CHIGBO ANGEL': '08143350410',
  'RUFUS CHIMOBI': '08033981564',
  'UDOKWU DONALD': '08034069368',
  'UGOCHUKWU SAMUEL MMADUABUROCHUKWU': '09061566463'
};

const lines = rawCsv.split(/\r?\n/);
let currentClass = '';
const parsed = [];
let counter = 1;

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

    // Gender inference if blank
    if (!rawGender) {
      if (['UGWU OSCAR', 'OBI RAYMOND', 'UDOKWU MICHAEL', 'OKOYE ONYEDIKA'].includes(rawName)) {
        rawGender = 'M';
      } else {
        rawGender = 'F';
      }
    }
    const gender = rawGender === 'M' ? 'Male' : 'Female';

    const admNo = `EPS-2026-${String(counter).padStart(3, '0')}`;
    counter++;

    const nameObj = parseName(rawName);
    const dob = parseDate(rawDob);
    const phone = normalizePhone(rawPhone, knownPhoneFixes[rawName]);

    parsed.push({
      admNo,
      classCategory: currentClass,
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

console.log(`Parsed ${parsed.length} students successfully.`);
console.log('First 5:', parsed.slice(0, 5));
console.log('Last 5:', parsed.slice(-5));
