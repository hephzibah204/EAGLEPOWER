import db from '../config/db.js';
import { logSafeError, sanitizeAuditDetails } from './safeLogging.js';

/**
 * Log audit events to database
 */
export function logAudit(userId, action, entity, details, ipAddress) {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity, details, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `);
    const safeDetails = process.env.NODE_ENV === 'development' ? details : sanitizeAuditDetails(details);
    stmt.run(
      userId ? String(userId) : 'ANONYMOUS',
      action,
      entity,
      typeof safeDetails === 'object' ? JSON.stringify(safeDetails) : String(safeDetails),
      ipAddress || '127.0.0.1'
    );
  } catch (err) {
    logSafeError('Failed to write audit log', err);
  }
}
