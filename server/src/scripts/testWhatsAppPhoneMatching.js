import db from '../config/db.js';

const samplePhones = db.prepare('SELECT DISTINCT guardian_phone FROM students WHERE guardian_phone IS NOT NULL').all().map(r => r.guardian_phone);
console.log(`Testing ${samplePhones.length} unique parent phone numbers from DB...`);

let oldFailed = 0;
let newFailed = 0;

for (const p of samplePhones) {
  // Simulate WhatsApp sender phone format (e.g. 2348034838181)
  const waSender = '234' + p.replace(/^0/, '');
  const cleanPhone = waSender.replace(/\D/g, '');
  const last10 = cleanPhone.slice(-10);
  const last8 = cleanPhone.slice(-8);

  const oldMatch = db.prepare(`
    SELECT count(*) as c FROM students 
    WHERE REPLACE(REPLACE(guardian_phone, '+', ''), ' ', '') LIKE ? AND is_active = 1
  `).get(`%${last10}%`).c;

  // New robust matching: checks last10, last9, last8, or local format (080...)
  const localFormatted = cleanPhone.startsWith('234') ? '0' + cleanPhone.slice(3) : cleanPhone;
  const newMatch = db.prepare(`
    SELECT count(*) as c FROM students 
    WHERE (
      guardian_phone = ? 
      OR REPLACE(REPLACE(guardian_phone, '+', ''), ' ', '') LIKE ?
      OR REPLACE(REPLACE(guardian_phone, '+', ''), ' ', '') LIKE ?
      OR REPLACE(REPLACE(guardian_phone, '+', ''), ' ', '') LIKE ?
    ) AND is_active = 1
  `).get(localFormatted, `%${last10}%`, `%${last8}%`, `%${localFormatted}%`).c;

  if (oldMatch === 0) {
    oldFailed++;
    console.log(`[OLD FAILED] Original logic missed: ${p} (WA: ${waSender}, last10: ${last10})`);
  }
  if (newMatch === 0) {
    newFailed++;
    console.log(`[NEW FAILED] New logic missed: ${p}`);
  }
}

console.log(`\nResults across ${samplePhones.length} phones:`);
console.log(`- Old logic failed on: ${oldFailed} phone numbers`);
console.log(`- New robust logic failed on: ${newFailed} phone numbers`);
