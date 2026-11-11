const Database = require('better-sqlite3');
const db = new Database('server/data/eaglepower.db');

console.log('--- TABLES ---');
console.log(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name));

console.log('\n--- STUDENTS TABLE SCHEMA ---');
console.log(db.prepare("PRAGMA table_info(students)").all());

console.log('\n--- CLASSES ---');
console.log(db.prepare("SELECT * FROM classes").all());

console.log('\n--- CURRENT STUDENTS COUNT ---');
console.log(db.prepare("SELECT count(*) as count FROM students").get());

console.log('\n--- SAMPLE 5 STUDENTS ---');
console.log(db.prepare("SELECT * FROM students LIMIT 5").all());

console.log('\n--- USERS ASSOCIATED WITH STUDENTS ---');
console.log(db.prepare("SELECT role, count(*) as count FROM users GROUP BY role").all());
