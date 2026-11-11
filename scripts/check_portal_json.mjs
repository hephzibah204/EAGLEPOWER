import fs from 'node:fs';

const portalData = JSON.parse(fs.readFileSync('src/data/portalDbData.json', 'utf8'));
console.log('portalDbData.json students count:', portalData.students?.length);
console.log('portalDbData.json classes count:', portalData.classes?.length);
console.log('portalDbData.json staff count:', portalData.staff?.length);
console.log('portalDbData.json sample student:', portalData.students?.[0]);
console.log('portalDbData.json last student:', portalData.students?.[portalData.students?.length - 1]);
