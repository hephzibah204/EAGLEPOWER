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
router.get('/', authenticate, (req, res, next) => {
  try {
    const isStaffOrAdmin = ['superadmin', 'admin', 'bursar'].includes(req.user.role);
    const staff = db.prepare(`
      SELECT s.*, u.username, u.is_active as user_active
      FROM staff s
      LEFT JOIN users u ON u.reference_id = s.staff_no
      WHERE s.is_active = 1
      ORDER BY s.id ASC
    `).all();

    const sanitizedStaff = isStaffOrAdmin 
      ? staff 
      : staff.map(s => ({
          id: s.id,
          name: s.name,
          role: s.role,
          assigned_class: s.assigned_class,
          qualification: s.qualification
        }));

    res.json({
      success: true,
      count: sanitizedStaff.length,
      data: sanitizedStaff
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

    const newName = name !== undefined ? (name ? name.trim() : existing.name) : existing.name;
    const newRole = role !== undefined ? (role ? role.trim() : existing.role) : existing.role;
    const newEmail = email !== undefined ? (email ? email.trim() : null) : existing.email;
    const newPhone = phone !== undefined ? (phone ? phone.trim() : null) : existing.phone;
    const newQual = qualification !== undefined ? (qualification ? qualification.trim() : null) : existing.qualification;
    const newAssignedClass = assigned_class !== undefined ? (assigned_class ? assigned_class.trim() : null) : existing.assigned_class;
    const newIsActive = is_active !== undefined ? is_active : existing.is_active;

    const stmt = db.prepare(`
      UPDATE staff SET
        name = ?,
        role = ?,
        email = ?,
        phone = ?,
        qualification = ?,
        assigned_class = ?,
        is_active = ?
      WHERE id = ?
    `);

    stmt.run(
      newName,
      newRole,
      newEmail,
      newPhone,
      newQual,
      newAssignedClass,
      newIsActive,
      req.params.id
    );

    // Sync classes table class_teacher_id
    if (assigned_class !== undefined) {
      if (newAssignedClass) {
        db.prepare(`
          UPDATE classes 
          SET class_teacher_id = ? 
          WHERE name = ? OR name = ?
        `).run(req.params.id, newAssignedClass, newAssignedClass.replace(/Junior College |Senior College |Nursery |Primary /i, ''));
      } else {
        // Teacher unassigned from class
        db.prepare(`UPDATE classes SET class_teacher_id = NULL WHERE class_teacher_id = ?`).run(req.params.id);
      }
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

/**
 * Helper to build printable ID card payload
 */
function buildStaffIdCardData(staff, user) {
  const system = db.prepare('SELECT * FROM system_settings WHERE id = 1').get() || {};
  const currentYear = new Date().getFullYear();
  const issueDate = `09/${currentYear}`;
  const expiryDate = `08/${currentYear + 3}`;

  return {
    id: staff.id,
    staff_no: staff.staff_no || user?.reference_id || 'EPS-STF-01',
    name: staff.name || user?.full_name || 'Staff Member',
    role: staff.role || (user?.role === 'superadmin' ? 'Proprietor & Director' : 'Academic Faculty'),
    qualification: staff.qualification || 'B.Ed / NCE',
    assigned_class: staff.assigned_class || 'General Faculty',
    email: staff.email || user?.email || '',
    phone: staff.phone || system.phone || '+234 907 558 0671',
    blood_group: staff.blood_group || 'O+',
    emergency_contact: staff.emergency_contact || staff.phone || '+234 907 558 0671',
    photo_url: staff.photo_url || user?.avatar_url || null,
    signature_url: staff.signature_url || user?.signature_url || null,
    issue_date: issueDate,
    expiry_date: expiryDate,
    school: {
      name: system.school_name || 'Eagle Power Schools',
      motto: system.motto || 'Love, Truth & Service',
      address: system.address || '2 & 9 Amikwo Road, Awka, Anambra State',
      phone: system.phone || system.whatsapp_phone || '+234 907 558 0671',
      email: system.email || 'info@eaglepowerschools.com.ng',
      website: 'https://eaglepowerschools.com.ng',
      authorized_signatory: 'Adaeze Uzoefuna (Vice Principal / Registrar)'
    }
  };
}

/**
 * GET /api/staff/profile
 * Get current logged in staff's profile and ID card
 */
router.get('/profile', authenticate, (req, res, next) => {
  try {
    let staff = null;
    if (req.user.reference_id) {
      staff = db.prepare('SELECT * FROM staff WHERE UPPER(staff_no) = UPPER(?)').get(req.user.reference_id);
    }
    if (!staff && req.user.full_name) {
      staff = db.prepare('SELECT * FROM staff WHERE LOWER(name) = LOWER(?)').get(req.user.full_name);
    }
    if (!staff) {
      staff = {
        id: req.user.id,
        staff_no: req.user.reference_id || 'EPS-DIR-01',
        name: req.user.full_name || 'Proprietor & Director',
        role: req.user.role === 'superadmin' ? 'Proprietor & Director' : 'Administrator',
        email: req.user.email,
        phone: '+234 907 558 0671',
        qualification: 'Directorate / Institutional Governance',
        assigned_class: 'Executive Administration',
        photo_url: req.user.avatar_url || null,
        signature_url: req.user.signature_url || null,
        blood_group: 'O+',
        emergency_contact: '+234 907 558 0671'
      };
    }
    res.json({
      success: true,
      staff,
      id_card: buildStaffIdCardData(staff, req.user)
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/staff/profile
 * Staff updates their own photo, signature, blood group, emergency contact, phone, email
 */
router.patch('/profile', authenticate, (req, res, next) => {
  try {
    const { photo_url, signature_url, blood_group, emergency_contact, phone, email } = req.body;

    let staff = null;
    if (req.user.reference_id) {
      staff = db.prepare('SELECT * FROM staff WHERE UPPER(staff_no) = UPPER(?)').get(req.user.reference_id);
    }
    if (!staff && req.user.full_name) {
      staff = db.prepare('SELECT * FROM staff WHERE LOWER(name) = LOWER(?)').get(req.user.full_name);
    }

    if (staff) {
      db.prepare(`
        UPDATE staff SET
          photo_url = COALESCE(?, photo_url),
          signature_url = COALESCE(?, signature_url),
          blood_group = COALESCE(?, blood_group),
          emergency_contact = COALESCE(?, emergency_contact),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email)
        WHERE id = ?
      `).run(
        photo_url !== undefined ? photo_url : null,
        signature_url !== undefined ? signature_url : null,
        blood_group !== undefined ? blood_group : null,
        emergency_contact !== undefined ? emergency_contact : null,
        phone !== undefined ? phone : null,
        email !== undefined ? email : null,
        staff.id
      );
    }

    // Also update users table avatar_url and signature_url
    db.prepare(`
      UPDATE users SET
        avatar_url = COALESCE(?, avatar_url),
        signature_url = COALESCE(?, signature_url),
        email = COALESCE(?, email)
      WHERE id = ?
    `).run(
      photo_url !== undefined ? photo_url : null,
      signature_url !== undefined ? signature_url : null,
      email !== undefined ? email : null,
      req.user.id
    );

    logAudit(req.user.id, 'UPDATE_PROFILE', 'STAFF', `Staff updated profile credentials (photo: ${!!photo_url}, signature: ${!!signature_url})`, req.ip);

    const updatedStaff = staff ? db.prepare('SELECT * FROM staff WHERE id = ?').get(staff.id) : null;
    const updatedUser = db.prepare('SELECT id, username, email, role, reference_id, full_name, avatar_url, signature_url FROM users WHERE id = ?').get(req.user.id);

    res.json({
      success: true,
      message: 'Profile picture and signature credentials updated successfully.',
      staff: updatedStaff,
      user: updatedUser,
      id_card: buildStaffIdCardData(updatedStaff || updatedUser, updatedUser)
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/staff/:id/id-card
 * Get official ID card data for any staff member
 */
router.get('/:id/id-card', authenticate, (req, res, next) => {
  try {
    const staff = db.prepare('SELECT * FROM staff WHERE id = ? OR UPPER(staff_no) = UPPER(?)').get(req.params.id, req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }
    if (!['admin', 'superadmin'].includes(req.user.role) && String(req.user.reference_id || '').toUpperCase() !== String(staff.staff_no).toUpperCase()) {
      return res.status(403).json({ success: false, message: 'You may only access your own staff ID card.' });
    }
    const user = db.prepare('SELECT * FROM users WHERE UPPER(reference_id) = UPPER(?)').get(staff.staff_no);
    res.json({
      success: true,
      id_card: buildStaffIdCardData(staff, user)
    });
  } catch (err) {
    next(err);
  }
});

export default router;
