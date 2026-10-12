import db from '../config/db.js';

/**
 * Log audit events to database
 */
export function logAudit(userId, action, entity, details, ipAddress) {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity, details, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      userId ? String(userId) : 'ANONYMOUS',
      action,
      entity,
      typeof details === 'object' ? JSON.stringify(details) : String(details),
      ipAddress || '127.0.0.1'
    );
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}
