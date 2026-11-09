import db from '../config/db.js';

console.log('--- ALL CLASSES IN DATABASE ---');
const classes = db.prepare('SELECT * FROM classes ORDER BY id').all();
console.table(classes);
