import db from '../server/src/config/db.js';

console.log('--- ALL CLASSES IN DB ---');
const classes = db.prepare('SELECT * FROM classes ORDER BY id ASC').all();
console.table(classes);

console.log('\n--- CURRENT STUDENTS COUNT BY CLASS ---');
const counts = db.prepare(`
  SELECT c.id, c.name, COUNT(s.id) as student_count 
  FROM classes c 
  LEFT JOIN students s ON s.class_id = c.id AND s.is_active = 1 
  GROUP BY c.id, c.name
  ORDER BY c.id ASC
`).all();
console.table(counts);

console.log('\nTotal active students in DB:', db.prepare('SELECT count(*) as count FROM students WHERE is_active = 1').get());
console.log('Total students in DB (all):', db.prepare('SELECT count(*) as count FROM students').get());
