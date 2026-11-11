import db from '../server/src/config/db.js';

console.log('--- BASIC 4 STUDENTS IN DB ---');
const b4 = db.prepare(`
  SELECT s.id, s.admission_no, s.first_name, s.last_name, s.class_id, c.name as class_name
  FROM students s
  JOIN classes c ON s.class_id = c.id
  WHERE s.last_name LIKE '%Adigwe%' OR s.first_name LIKE '%Diamond%'
`).all();
console.table(b4);

console.log('--- JSS 2 STUDENTS IN DB ---');
const j2 = db.prepare(`
  SELECT s.id, s.admission_no, s.first_name, s.last_name, s.class_id, c.name as class_name
  FROM students s
  JOIN classes c ON s.class_id = c.id
  WHERE s.last_name LIKE '%Abafor%'
`).all();
console.table(j2);

console.log('--- STUDENTS WITH CLASS_ID 13 (Primary 4) ---');
const c13 = db.prepare(`
  SELECT s.id, s.admission_no, s.first_name, s.last_name, s.class_id, c.name as class_name
  FROM students s
  JOIN classes c ON s.class_id = c.id
  WHERE s.class_id = 13
  LIMIT 5
`).all();
console.table(c13);

console.log('--- STUDENTS WITH CLASS_ID 2 (JSS2) ---');
const c2 = db.prepare(`
  SELECT s.id, s.admission_no, s.first_name, s.last_name, s.class_id, c.name as class_name
  FROM students s
  JOIN classes c ON s.class_id = c.id
  WHERE s.class_id = 2
  LIMIT 5
`).all();
console.table(c2);
