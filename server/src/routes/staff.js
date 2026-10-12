import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import db from '../config/db.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = express.Router();

const staffSchema = z.object({
  name: z.string().min(2, 'Staff name is required'),
  role: z.string().min(2, 'Staff role or designation is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  qualification: z.string().optional().or(z.literal('')),
  assigned_class: z.string().optional().or(z.literal('')),
  username: z.string().optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  create_portal_account: z.boolean().default(true)
});

/**
 * GET /api/staff
 * Public & authenticated staff faculty roster
 */
router.get('/', (req, res, next) => {
  try {
    const staff = db.prepare(`
      SELECT s.*, u.username, u.is_active as user_active
      FROM staff s
      LEFT JOIN users u ON u.reference_id = s.staff_no
      WHERE s.is_active = 1
      ORDER BY s.id ASC
    `).all();

    res.json({
      success: true,
      count: staff.length,
      data: staff
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/staff
 * Add new staff member & auto-provision portal account (Admin/SuperAdmin)
 */
router.post('/', authenticate, requireRoles('admin', 'superadmin'), (req, res, next) => {
  try {
    const parseResult = staffSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors[0].message
      });
    }

    const {
      name, role, email, phone, qualification,
      assigned_class, username, password, create_portal_account
    } = parseResult.data;

    // Generate next staff number
    const totalStaff = db.prepare('SELECT COUNT(*) as c FROM staff').get().c;
    const staffNo = `EPS-STF-${String(totalStaff + 1).padStart(2, '0')}`;

    const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : null;
    const cleanPhone = phone && phone.trim() ? phone.trim() : null;

    // Insert staff record
    const staffStmt = db.prepare(`
      INSERT INTO staff (staff_no, name, role, email, phone, qualification, assigned_class, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const staffRes = staffStmt.run(
      staffNo,
      name.trim(),
      role.trim(),
      cleanEmail,
      cleanPhone,
      qualification ? qualification.trim() : 'B.Ed / NCE',
      assigned_class ? assigned_class.trim() : 'General Faculty'
    );

    const staffId = staffRes.lastInsertRowid;
    let provisionedUser = null;

    if (create_portal_account) {
      // Determine portal username
      const portalUsername = username && username.trim()
        ? username.trim().toLowerCase()
        : name.trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) + (totalStaff + 1);

      // Determine portal role
      const lowerRole = role.toLowerCase();
      let userRole = 'teacher';
      if (lowerRole.includes('bursar') || lowerRole.includes('accountant') || lowerRole.includes('finance')) {
        userRole = 'bursar';
      } else if (lowerRole.includes('admin') || lowerRole.includes('principal') || lowerRole.includes('director')) {
        userRole = 'admin';
      }

      const defaultPassword = password && password.trim() ? password.trim() : 'EagleStaff2025!';
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(defaultPassword, salt);

      // Check if username exists, append if needed
      let finalUsername = portalUsername;
      const userExists = db.prepare('SELECT id FROM users WHERE username = ?').get(finalUsername);
      if (userExists) {
        finalUsername = `${portalUsername}_${totalStaff + 1}`;
      }

      const userStmt = db.prepare(`
        INSERT INTO users (username, email, password_hash, role, reference_id, full_name, is_active)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `);

      const userRes = userStmt.run(
        finalUsername,
        cleanEmail,
        passwordHash,
        userRole,
        staffNo,
        name.trim()
      );

      provisionedUser = {
        id: userRes.lastInsertRowid,
        username: finalUsername,
        temporary_password: defaultPassword,
        role: userRole
      };
    }

    logAudit(req.user.id, 'ADD_STAFF', 'STAFF', `Added staff member ${name} (${staffNo}) with role ${role}`, req.ip);

    res.status(201).json({
      success: true,
      message: 'Staff member onboarded successfully.',
      staff: {
        id: staffId,
        staff_no: staffNo,
        name: name.trim(),
        role: role.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        qualification,
        assigned_class
      },
      portal_account: provisionedUser
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/staff/:id
 * Update staff record
 */
router.put('/:id', authenticate, requireRoles('admin', 'superadmin'), (req, res, next) => {
  try {
    const { name, role, email, phone, qualification, assigned_class, is_active } = req.body;

    const existing = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    const stmt = db.prepare(`
      UPDATE staff SET
        name = COALESCE(?, name),
        role = COALESCE(?, role),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        qualification = COALESCE(?, qualification),
        assigned_class = COALESCE(?, assigned_class),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `);

    const cleanAssignedClass = assigned_class !== undefined ? (assigned_class ? assigned_class.trim() : null) : null;

    stmt.run(
      name ? name.trim() : null,
      role ? role.trim() : null,
      email ? email.trim() : null,
      phone ? phone.trim() : null,
      qualification ? qualification.trim() : null,
      cleanAssignedClass,
      is_active !== undefined ? is_active : null,
      req.params.id
    );

    // If assigned_class matches an existing class in classes table, link it
    if (cleanAssignedClass) {
      db.prepare(`
        UPDATE classes 
        SET class_teacher_id = ? 
        WHERE name = ? OR name = ?
      `).run(req.params.id, cleanAssignedClass, cleanAssignedClass.replace(/Junior College |Senior College |Nursery |Primary /i, ''));
    }

    logAudit(req.user.id, 'UPDATE_STAFF', 'STAFF', `Updated staff record for ID ${req.params.id}`, req.ip);

    res.json({
      success: true,
      message: 'Staff record updated successfully.'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/staff/:id
 * Deactivate staff member
 */
router.delete('/:id', authenticate, requireRoles('admin', 'superadmin'), (req, res, next) => {
  try {
    const staff = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff record not found.' });
    }

    db.prepare('UPDATE staff SET is_active = 0 WHERE id = ?').run(req.params.id);
    db.prepare('UPDATE users SET is_active = 0 WHERE reference_id = ?').run(staff.staff_no);

    logAudit(req.user.id, 'DEACTIVATE_STAFF', 'STAFF', `Deactivated staff ${staff.staff_no}`, req.ip);

    res.json({
      success: true,
      message: `Staff member ${staff.name} deactivated.`
    });
  } catch (err) {
    next(err);
  }
});

export default router;
