import db from '../server/src/config/db.js';

console.log('Count with class_id = 13:', db.prepare('SELECT count(*) as c FROM students WHERE class_id = 13').get().c);
console.log('Count with class_id = 2:', db.prepare('SELECT count(*) as c FROM students WHERE class_id = 2').get().c);
