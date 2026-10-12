import express from 'express';
import db from '../config/db.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/audit/logs
 * Security Audit Log Trail
 */
router.get('/logs', authenticate, requireRoles('superadmin', 'admin'), (req, res, next) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const count = db.prepare('SELECT COUNT(*) as total FROM audit_logs').get().total;
    const logs = db.prepare(`
      SELECT * FROM audit_logs ORDER BY id DESC LIMIT ? OFFSET ?
    `).all(parseInt(limit), offset);

    res.json({
      success: true,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      data: logs
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/audit/security-status
 * System Security & Hardening Diagnostics
 */
router.get('/security-status', (req, res) => {
  res.json({
    success: true,
    diagnostics: {
      framework: 'EaglePower EduCore API (Node.js/Express)',
      legacy_php_mitigation: {
        php_file_execution: 'Permanently Disabled (Node.js runtime does not execute PHP scripts)',
        upload_sanitization: 'Active (Direct script uploads eliminated; MIME inspection enforced)',
        passwords: 'Bcrypt Hashed (Cost Factor 10, No Plaintext Storage)',
        sql_injection_defense: 'Parameterized SQLite Statements with Foreign Key Enforcement',
        xss_and_headers: 'Helmet Security Headers Enabled',
        cors_protection: 'Restricted Whitelist Origins'
      },
      database_integrity: {
        engine: 'SQLite WAL Mode (ACID Compliant)',
        records: {
          students: db.prepare('SELECT COUNT(*) as c FROM students').get().c,
          classes: db.prepare('SELECT COUNT(*) as c FROM classes').get().c,
          subjects: db.prepare('SELECT COUNT(*) as c FROM subjects').get().c,
          marks: db.prepare('SELECT COUNT(*) as c FROM marks').get().c,
          invoices: db.prepare('SELECT COUNT(*) as c FROM invoices').get().c
        }
      },
      server_time: new Date().toISOString()
    }
  });
});

export default router;
