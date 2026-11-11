import { DatabaseSync } from 'node:sqlite';

const botDb = new DatabaseSync('whatsapp-bot/data/eaglepower.db');
const botCounts = botDb.prepare(`
  SELECT c.id, c.name, COUNT(s.id) as student_count 
  FROM classes c 
  LEFT JOIN students s ON s.class_id = c.id AND s.is_active = 1 
  GROUP BY c.id, c.name
  ORDER BY c.id ASC
`).all();
console.log('--- WHATSAPP BOT DB STUDENTS BY CLASS ---');
console.table(botCounts);
console.log('Total students in bot DB:', botDb.prepare('SELECT count(*) as count FROM students').get());
