import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../data/eaglepower.db');
const backupDir = path.resolve(__dirname, '../../backups');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const targetFile = path.join(backupDir, `eaglepower_backup_${timestamp}.db`);

try {
  // 1. Flush uncheckpointed transactions from WAL into main database
  db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
  // 2. Perform atomic, consistent SQLite snapshot
  db.prepare('VACUUM INTO ?').run(targetFile);
  console.log(`🛡️ [BACKUP SUCCESS] Database atomically backed up to: ${targetFile}`);
} catch (err) {
  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, targetFile);
    console.log(`🛡️ [BACKUP FALLBACK] Copied raw database file to: ${targetFile}`);
  } else {
    console.error(`❌ [BACKUP ERROR] Backup failed: ${err.message}`);
    process.exit(1);
  }
}
