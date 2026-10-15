import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import db from '../config/db.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import { getThreatTelemetry, unbanIp } from '../middleware/threatDefense.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUPS_DIR = path.resolve(__dirname, '../../backups');

const router = express.Router();

// Ensure system_settings table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    school_name TEXT DEFAULT 'Eagle Power Schools Awka',
    school_motto TEXT DEFAULT 'Love, Truth & Service',
    current_session TEXT DEFAULT '2024/2025',
    current_term TEXT DEFAULT 'Second Term',
    next_resumption_date TEXT DEFAULT '2025-05-05',
    active_report_template TEXT DEFAULT 'classic_british',
    principal_name TEXT DEFAULT 'Adaeze Uzoefuna',
    logo_url TEXT DEFAULT '/assets/official-logo.jpg',
    contact_phone TEXT DEFAULT '+234 803 359 1058',
    contact_email TEXT DEFAULT 'info@eaglepowerschools.com.ng',
    address TEXT DEFAULT '2 & 9 Amikwo Road, Awka, Anambra State',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  INSERT OR IGNORE INTO system_settings (id, current_session, current_term, next_resumption_date)
  VALUES (1, '2024/2025', 'Second Term', '2025-05-05');
`);

try {
  db.exec('ALTER TABLE system_settings ADD COLUMN term_locked INTEGER DEFAULT 0;');
} catch {
  // Column already exists
}

const settingsSchema = z.object({
  school_name: z.string().min(2).optional(),
  school_motto: z.string().optional(),
  current_session: z.string().min(4),
  current_term: z.enum(['First Term', 'Second Term', 'Third Term']),
  next_resumption_date: z.string().optional(),
  active_report_template: z.string().optional(),
  principal_name: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional()
});

/**
 * 1. GET /api/system/settings
 * Retrieve institutional parameters (active session, term, dates)
 */
router.get('/settings', (req, res, next) => {
  try {
    let settings = db.prepare('SELECT * FROM system_settings WHERE id = 1').get();
    if (!settings) {
      db.prepare(`
        INSERT INTO system_settings (id, current_session, current_term, next_resumption_date)
        VALUES (1, '2024/2025', 'Second Term', '2025-05-05')
      `).run();
      settings = db.prepare('SELECT * FROM system_settings WHERE id = 1').get();
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 2. PUT /api/system/settings
 * SuperAdmin configuration of institutional academic session & branding
 */
router.put('/settings', authenticate, requireRoles('superadmin'), (req, res, next) => {
  try {
    const parseResult = settingsSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors[0].message
      });
    }

    const d = parseResult.data;
    db.prepare(`
      UPDATE system_settings
      SET school_name = COALESCE(?, school_name),
          school_motto = COALESCE(?, school_motto),
          current_session = ?,
          current_term = ?,
          next_resumption_date = COALESCE(?, next_resumption_date),
          active_report_template = COALESCE(?, active_report_template),
          principal_name = COALESCE(?, principal_name),
          contact_phone = COALESCE(?, contact_phone),
          contact_email = COALESCE(?, contact_email),
          address = COALESCE(?, address),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(
      d.school_name || null,
      d.school_motto || null,
      d.current_session,
      d.current_term,
      d.next_resumption_date || null,
      d.active_report_template || null,
      d.principal_name || null,
      d.contact_phone || null,
      d.contact_email || null,
      d.address || null
    );

    logAudit(
      req.user.id,
      'UPDATE_SYSTEM_SETTINGS',
      'SYSTEM',
      `Updated session to ${d.current_session} (${d.current_term}), resumption: ${d.next_resumption_date}`,
      req.ip
    );

    const updated = db.prepare('SELECT * FROM system_settings WHERE id = 1').get();

    res.json({
      success: true,
      message: 'Institutional parameters updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 3. POST /api/system/backup
 * SuperAdmin one-click SQLite WAL checkpoint & timestamped snapshot creation
 */
router.post('/backup', authenticate, requireRoles('superadmin'), (req, res, next) => {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }

    // Force WAL checkpoint to flush all data from memory & WAL into primary DB
    db.exec('PRAGMA wal_checkpoint(TRUNCATE);');

    const dbPath = path.resolve(__dirname, '../../data/eaglepower.db');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `eaglepower_backup_${timestamp}.db`;
    const backupFilePath = path.join(BACKUPS_DIR, backupFileName);

    fs.copyFileSync(dbPath, backupFilePath);
    const stats = fs.statSync(backupFilePath);

    logAudit(
      req.user.id,
      'CREATE_DATABASE_BACKUP',
      'SYSTEM',
      `Created database backup: ${backupFileName} (${(stats.size / 1024).toFixed(1)} KB)`,
      req.ip
    );

    // List recent backups
    const recentBackups = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.endsWith('.db'))
      .map(f => {
        const fileStat = fs.statSync(path.join(BACKUPS_DIR, f));
        return {
          filename: f,
          size_kb: (fileStat.size / 1024).toFixed(1),
          created_at: fileStat.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    res.json({
      success: true,
      message: 'Database backup snapshot created successfully!',
      backup: {
        filename: backupFileName,
        size_kb: (stats.size / 1024).toFixed(1),
        path: backupFilePath,
        timestamp: new Date().toISOString()
      },
      recent_backups: recentBackups
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 4. GET /api/system/threat-defense
 * SuperAdmin WAF telemetry & banned IPs list
 */
router.get('/threat-defense', authenticate, requireRoles('superadmin'), (req, res, next) => {
  try {
    const telemetry = getThreatTelemetry();
    res.json({
      success: true,
      data: telemetry
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 5. POST /api/system/threat-defense/unban
 * SuperAdmin unban IP address
 */
router.post('/threat-defense/unban', authenticate, requireRoles('superadmin'), (req, res, next) => {
  try {
    const { ip } = req.body;
    if (!ip) {
      return res.status(400).json({ success: false, message: 'IP address is required.' });
    }

    const success = unbanIp(ip);
    logAudit(
      req.user.id,
      'UNBAN_IP_ADDRESS',
      'SECURITY',
      `SuperAdmin unbanned IP: ${ip}`,
      req.ip
    );

    res.json({
      success: true,
      message: success ? `IP address ${ip} was successfully unbanned.` : `IP ${ip} was not actively banned.`
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 6. GET /api/system/backups
 * SuperAdmin list of all available atomic database backups
 */
router.get('/backups', authenticate, requireRoles('superadmin'), (req, res, next) => {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      return res.json({ success: true, count: 0, data: [] });
    }

    const backups = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.endsWith('.db'))
      .map(f => {
        const fileStat = fs.statSync(path.join(BACKUPS_DIR, f));
        return {
          filename: f,
          size_kb: (fileStat.size / 1024).toFixed(1),
          created_at: fileStat.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      success: true,
      count: backups.length,
      data: backups
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 7. POST /api/system/term-lock
 * SuperAdmin toggle term grade editing lock
 */
router.post('/term-lock', authenticate, requireRoles('superadmin'), (req, res, next) => {
  try {
    const { locked } = req.body;
    const isLocked = locked === true || locked === 1 ? 1 : 0;

    db.prepare('UPDATE system_settings SET term_locked = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(isLocked);

    logAudit(
      req.user.id,
      isLocked === 1 ? 'LOCK_TERM_GRADES' : 'UNLOCK_TERM_GRADES',
      'ACADEMICS',
      `SuperAdmin ${isLocked === 1 ? 'LOCKED' : 'UNLOCKED'} term grade alterations`,
      req.ip
    );

    res.json({
      success: true,
      term_locked: isLocked === 1,
      message: isLocked === 1
        ? 'Term grade entry is now LOCKED. Teachers cannot modify published assessment scores.'
        : 'Term grade entry is now UNLOCKED. Teachers may submit and edit scores.'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 8. GET /api/system/status
 * SuperAdmin comprehensive operational health overview
 */
router.get('/status', authenticate, requireRoles('superadmin'), (req, res, next) => {
  try {
    const dbPath = path.resolve(__dirname, '../../data/eaglepower.db');
    let dbSizeKb = 0;
    if (fs.existsSync(dbPath)) {
      dbSizeKb = (fs.statSync(dbPath).size / 1024).toFixed(1);
    }

    const studentCount = db.prepare('SELECT COUNT(*) as count FROM students WHERE is_active = 1').get().count;
    const staffCount = db.prepare('SELECT COUNT(*) as count FROM staff WHERE is_active = 1').get().count;
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get().count;
    const settings = db.prepare('SELECT * FROM system_settings WHERE id = 1').get() || {};

    const memUsage = process.memoryUsage();

    res.json({
      success: true,
      status: 'operational',
      database: {
        engine: 'SQLite 3 (WAL mode)',
        size_kb: dbSizeKb,
        path: dbPath
      },
      counts: {
        active_students: studentCount,
        active_staff: staffCount,
        active_users: userCount
      },
      session: {
        current_session: settings.current_session,
        current_term: settings.current_term,
        next_resumption_date: settings.next_resumption_date,
        term_locked: Boolean(settings.term_locked)
      },
      server: {
        uptime_seconds: Math.floor(process.uptime()),
        memory_heap_used_mb: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
        node_version: process.version,
        platform: process.platform
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
