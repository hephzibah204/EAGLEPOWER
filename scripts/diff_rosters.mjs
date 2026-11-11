import fs from 'node:fs';

const rawOld = fs.readFileSync('server/data/raw_students_upload.csv', 'utf8');
const rawNew = fs.readFileSync('server/data/official_students_roster_user_provided.csv', 'utf8');

function cleanLines(text) {
  return text.split(/\r?\n/)
    .map(l => l.trim().replace(/^,+/, '').replace(/,+$/, ''))
    .filter(l => l.length > 0 && !l.startsWith('STUDENT\'S') && !l.startsWith('DOB'));
}

const oldLines = cleanLines(rawOld);
const newLines = cleanLines(rawNew);

console.log('Old non-empty lines:', oldLines.length);
console.log('New non-empty lines:', newLines.length);

let differences = [];
const maxLen = Math.max(oldLines.length, newLines.length);
for (let i = 0; i < maxLen; i++) {
  const o = oldLines[i];
  const n = newLines[i];
  if (o !== n) {
    differences.push({ index: i + 1, old: o, new: n });
  }
}

console.log(`Total line differences: ${differences.length}`);
if (differences.length > 0) {
  console.log('First 20 differences:');
  console.table(differences.slice(0, 20));
}
