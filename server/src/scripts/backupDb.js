import '../config/env.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backupDir = path.resolve(__dirname, '../../backups');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const targetFile = path.join(backupDir, `eaglepower_backup_${timestamp}.db`);

try {
  // VACUUM INTO includes committed WAL records in a consistent snapshot.
  db.prepare('VACUUM INTO ?').run(targetFile);
  console.log(`🛡️ [BACKUP SUCCESS] Database atomically backed up to: ${targetFile}`);
} catch (err) {
  console.error(`❌ [BACKUP ERROR] Consistent backup failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  db.close();
}
