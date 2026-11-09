import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// Imported before modules that capture secrets or open the database.
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const serverEnv = path.join(serverRoot, '.env');
const rootEnv = path.resolve(serverRoot, '../.env');
dotenv.config({ path: fs.existsSync(serverEnv) ? serverEnv : rootEnv });
