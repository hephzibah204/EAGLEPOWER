import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

console.log('🔄 Syncing fresh database snapshot to WhatsApp bot directories...');

const sourceDbPath = path.resolve('server/data/eaglepower.db');
const target1 = path.resolve('whatsapp-bot/data/eaglepower.db');
const target2 = path.resolve('whatsapp-bot/server_src/data/eaglepower.db');

const mainDb = new DatabaseSync(sourceDbPath);

// Ensure directories exist
fs.mkdirSync(path.dirname(target1), { recursive: true });
fs.mkdirSync(path.dirname(target2), { recursive: true });

// Checkpoint WAL first
mainDb.exec('PRAGMA wal_checkpoint(TRUNCATE);');

if (fs.existsSync(target1)) fs.unlinkSync(target1);
mainDb.prepare('VACUUM INTO ?').run(target1);
console.log('✓ Synced to:', target1);

if (fs.existsSync(target2)) fs.unlinkSync(target2);
mainDb.prepare('VACUUM INTO ?').run(target2);
console.log('✓ Synced to:', target2);

const testDb1 = new DatabaseSync(target1);
const studentsCount = testDb1.prepare('SELECT count(*) as c FROM students').get().c;
const parentsCount = testDb1.prepare("SELECT count(*) as c FROM users WHERE role = 'parent'").get().c;

console.log(`✓ Verification: ${studentsCount} students and ${parentsCount} parents in target databases.`);
mainDb.close();
testDb1.close();
