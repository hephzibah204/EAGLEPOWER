import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../data/eaglepower.db');
const backupDir = path.resolve(__dirname, '../../backups');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const targetFile = path.join(backupDir, `eaglepower_backup_${timestamp}.db`);

if (fs.existsSync(dbPath)) {
  fs.copyFileSync(dbPath, targetFile);
  console.log(`🛡️ [BACKUP SUCCESS] Database backed up cleanly to: ${targetFile}`);
} else {
  console.error(`❌ [BACKUP ERROR] Database file not found at ${dbPath}`);
  process.exit(1);
}
