import express from 'express';
import { z } from 'zod';
import db from '../config/db.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import {
  NIGERIAN_BANKS_DIRECTORY,
  resolveBankAccount,
  createTransferRecipient,
  initiateBulkTransfer
} from '../services/paystack.js';

const router = express.Router();

/**
 * 1. GET /api/payroll/banks
 * Returns verified list of Nigerian commercial banks and fintechs
 */
router.get('/banks', authenticate, (req, res) => {
  res.json({
    success: true,
    data: NIGERIAN_BANKS_DIRECTORY
  });
});

/**
 * 2. GET /api/payroll/overview
 * Returns salary summary, staff coverage, and recent disbursement batches
 */
router.get('/overview', authenticate, requireRoles('bursar', 'admin', 'superadmin'), (req, res, next) => {
  try {
    const staffCount = db.prepare('SELECT COUNT(*) as c FROM staff WHERE is_active = 1').get().c;
    let structureCount = db.prepare('SELECT COUNT(*) as c FROM staff_salary_structures').get().c;
    const verifiedBanksCount = db.prepare('SELECT COUNT(*) as c FROM staff_bank_accounts WHERE is_verified = 1').get().c;

    // Auto-seed default salary structure for active staff if missing
    if (structureCount === 0 && staffCount > 0) {
      const activeStaff = db.prepare('SELECT id FROM staff WHERE is_active = 1').all();
      const insertDefaultStructure = db.prepare(`
        INSERT OR IGNORE INTO staff_salary_structures 
        (staff_id, base_salary, housing_allowance, transport_allowance, teaching_allowance, tax_deduction, pension_deduction, other_deductions, net_salary)
        VALUES (?, 70000, 15000, 10000, 10000, 5000, 3500, 0, 96500)
      `);
      for (const st of activeStaff) {
        insertDefaultStructure.run(st.id);
      }
      structureCount = db.prepare('SELECT COUNT(*) as c FROM staff_salary_structures').get().c;
    }

    const totals = db.prepare(`
      SELECT 
        SUM(base_salary) as total_base,
        SUM(housing_allowance + transport_allowance + teaching_allowance) as total_allowances,
        SUM(tax_deduction + pension_deduction + other_deductions) as total_deductions,
        SUM(net_salary) as total_monthly_payroll
      FROM staff_salary_structures
    `).get();

    const batches = db.prepare(`
      SELECT * FROM payroll_batches ORDER BY id DESC LIMIT 12
    `).all();

    const latestBatch = batches.length > 0 ? batches[0] : null;

    const summary = {
      active_staff_count: staffCount,
      configured_salaries: structureCount,
      verified_bank_accounts: verifiedBanksCount,
      total_monthly_gross: (totals.total_base || 0) + (totals.total_allowances || 0),
      total_monthly_deductions: totals.total_deductions || 0,
      total_monthly_net: totals.total_monthly_payroll || 0
    };

    const stats = {
      active_staff: staffCount,
      configured_salaries: structureCount,
      verified_bank_accounts: verifiedBanksCount,
      monthly_gross_budget: (totals.total_base || 0) + (totals.total_allowances || 0),
      monthly_deductions: totals.total_deductions || 0,
      monthly_net_payout: totals.total_monthly_payroll || 0
    };

    res.json({
      success: true,
      stats,
      data: {
        stats,
        summary,
        latest_batch: latestBatch,
        recent_batches: batches
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 3. GET /api/payroll/staff-roster
 * Full list of staff with current salary structure & verified bank account
 */
router.get('/staff-roster', authenticate, requireRoles('bursar', 'admin', 'superadmin'), (req, res, next) => {
  try {
    const roster = db.prepare(`
      SELECT 
        s.id,
        s.id as staff_id,
        s.staff_no,
        s.name,
        s.role,
        s.assigned_class,
        s.phone,
        COALESCE(sss.base_salary, 70000) as base_salary,
        COALESCE(sss.housing_allowance, 15000) as housing_allowance,
        COALESCE(sss.transport_allowance, 10000) as transport_allowance,
        COALESCE(sss.teaching_allowance, 10000) as teaching_allowance,
        (COALESCE(sss.base_salary, 70000) + COALESCE(sss.housing_allowance, 15000) + COALESCE(sss.transport_allowance, 10000) + COALESCE(sss.teaching_allowance, 10000)) as gross_salary,
        COALESCE(sss.tax_deduction, 5000) as tax_deduction,
        COALESCE(sss.pension_deduction, 3500) as pension_deduction,
        COALESCE(sss.other_deductions, 0) as other_deductions,
        (COALESCE(sss.tax_deduction, 5000) + COALESCE(sss.pension_deduction, 3500) + COALESCE(sss.other_deductions, 0)) as total_deductions,
        COALESCE(sss.net_salary, 86500) as net_salary,
        sba.bank_name,
        sba.bank_code,
        sba.account_number,
        sba.account_name,
        COALESCE(sba.is_verified, 0) as is_bank_verified
      FROM staff s
      LEFT JOIN staff_salary_structures sss ON s.id = sss.staff_id
      LEFT JOIN staff_bank_accounts sba ON s.id = sba.staff_id
      WHERE s.is_active = 1
      ORDER BY s.id ASC
    `).all();

    res.json({
      success: true,
      count: roster.length,
      data: roster
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 4. PUT /api/payroll/staff/:id/salary
 * Update specific staff salary structure
 */
const updateSalarySchema = z.object({
  base_salary: z.number().positive(),
  housing_allowance: z.number().min(0).default(0),
  transport_allowance: z.number().min(0).default(0),
  teaching_allowance: z.number().min(0).default(0),
  tax_deduction: z.number().min(0).default(0),
  pension_deduction: z.number().min(0).default(0),
  other_deductions: z.number().min(0).default(0)
});

router.put('/staff/:id/salary', authenticate, requireRoles('bursar', 'admin', 'superadmin'), (req, res, next) => {
  try {
    const staffId = parseInt(req.params.id);
    const parsed = updateSalarySchema.parse(req.body);

    const gross = parsed.base_salary + parsed.housing_allowance + parsed.transport_allowance + parsed.teaching_allowance;
    const deductions = parsed.tax_deduction + parsed.pension_deduction + parsed.other_deductions;
    const net = gross - deductions;

    const stmt = db.prepare(`
      INSERT INTO staff_salary_structures (
        staff_id, base_salary, housing_allowance, transport_allowance, teaching_allowance,
        tax_deduction, pension_deduction, other_deductions, net_salary, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(staff_id) DO UPDATE SET
        base_salary = excluded.base_salary,
        housing_allowance = excluded.housing_allowance,
        transport_allowance = excluded.transport_allowance,
        teaching_allowance = excluded.teaching_allowance,
        tax_deduction = excluded.tax_deduction,
        pension_deduction = excluded.pension_deduction,
        other_deductions = excluded.other_deductions,
        net_salary = excluded.net_salary,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(
      staffId,
      parsed.base_salary,
      parsed.housing_allowance,
      parsed.transport_allowance,
      parsed.teaching_allowance,
      parsed.tax_deduction,
      parsed.pension_deduction,
      parsed.other_deductions,
      net
    );

    logAudit(req.user.id, 'UPDATE_SALARY_STRUCTURE', 'PAYROLL', `Updated salary structure for staff ID ${staffId} to ₦${net} net`, req.ip);

    res.json({
      success: true,
      message: 'Salary structure updated successfully.',
      net_salary: net
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 5. POST /api/payroll/staff/:id/bank
 * Verify & link staff bank account via Paystack / NIBSS
 */
const bankSchema = z.object({
  account_number: z.string().length(10, 'Account number must be 10 digits'),
  bank_code: z.string().min(2, 'Bank code is required')
});

router.post('/staff/:id/bank', authenticate, requireRoles('bursar', 'admin', 'superadmin'), async (req, res, next) => {
  try {
    const staffId = parseInt(req.params.id);
    const { account_number, bank_code } = bankSchema.parse(req.body);

    const staff = db.prepare('SELECT * FROM staff WHERE id = ?').get(staffId);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    // Resolve Account Name
    const resolved = await resolveBankAccount({ accountNumber: account_number, bankCode: bank_code });
    const bank = NIGERIAN_BANKS_DIRECTORY.find(b => b.code === bank_code) || { name: 'Nigerian Bank' };

    // Create Recipient Code
    const recipient = await createTransferRecipient({
      name: resolved.account_name,
      accountNumber: account_number,
      bankCode: bank_code
    });

    const stmt = db.prepare(`
      INSERT INTO staff_bank_accounts (
        staff_id, bank_name, bank_code, account_number, account_name, paystack_recipient_code, is_verified, verified_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(staff_id) DO UPDATE SET
        bank_name = excluded.bank_name,
        bank_code = excluded.bank_code,
        account_number = excluded.account_number,
        account_name = excluded.account_name,
        paystack_recipient_code = excluded.paystack_recipient_code,
        is_verified = 1,
        verified_at = CURRENT_TIMESTAMP
    `);

    stmt.run(staffId, bank.name, bank_code, account_number, resolved.account_name, recipient.recipient_code);

    logAudit(req.user.id, 'VERIFY_STAFF_BANK', 'PAYROLL', `Verified bank account ${account_number} for staff ${staff.name}`, req.ip);

    res.json({
      success: true,
      message: 'Bank account verified and linked successfully.',
      bank_account: {
        staff_id: staffId,
        bank_name: bank.name,
        account_number,
        account_name: resolved.account_name,
        is_verified: true
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 6. POST /api/payroll/batches/generate
 * Compile the monthly payroll roll for all active staff
 */
router.post('/batches/generate', authenticate, requireRoles('bursar', 'admin', 'superadmin'), (req, res, next) => {
  try {
    const { month_year } = req.body;
    const targetMonth = month_year || new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const batchCode = `PAY-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;

    // Ensure not already generated
    const existing = db.prepare('SELECT id, batch_code, status FROM payroll_batches WHERE month_year = ?').get(targetMonth);
    if (existing && existing.status === 'Disbursed') {
      return res.status(400).json({
        success: false,
        message: `Payroll batch for ${targetMonth} has already been disbursed (${existing.batch_code}).`
      });
    }

    const staffWithDetails = db.prepare(`
      SELECT 
        s.id as staff_id, s.name, s.staff_no,
        COALESCE(sss.base_salary, 70000) as base_salary,
        COALESCE(sss.housing_allowance, 15000) as housing_allowance,
        COALESCE(sss.transport_allowance, 10000) as transport_allowance,
        COALESCE(sss.teaching_allowance, 10000) as teaching_allowance,
        COALESCE(sss.tax_deduction, 5000) as tax_deduction,
        COALESCE(sss.pension_deduction, 3500) as pension_deduction,
        COALESCE(sss.other_deductions, 0) as other_deductions,
        COALESCE(sss.net_salary, 86500) as net_salary,
        sba.bank_name, sba.bank_code, sba.account_number, sba.account_name, sba.paystack_recipient_code
      FROM staff s
      LEFT JOIN staff_salary_structures sss ON s.id = sss.staff_id
      LEFT JOIN staff_bank_accounts sba ON s.id = sba.staff_id
      WHERE s.is_active = 1
    `).all();

    if (staffWithDetails.length === 0) {
      return res.status(400).json({ success: false, message: 'No active staff members found to generate payroll.' });
    }

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    const items = staffWithDetails.map(s => {
      const gross = s.base_salary + s.housing_allowance + s.transport_allowance + s.teaching_allowance;
      const ded = s.tax_deduction + s.pension_deduction + s.other_deductions;
      const net = s.net_salary || (gross - ded);

      totalGross += gross;
      totalDeductions += ded;
      totalNet += net;

      return {
        ...s,
        gross,
        ded,
        net,
        transfer_reference: `TRF-${batchCode}-${s.staff_no.replace(/[^A-Za-z0-9]/g, '')}`
      };
    });

    // Atomic SQLite insertion
    db.exec('BEGIN TRANSACTION;');
    let createdBatchId;
    try {
      // Delete older draft for this month if unapproved
      if (existing && existing.status === 'Draft') {
        db.prepare('DELETE FROM payroll_batches WHERE id = ?').run(existing.id);
      }

      const batchStmt = db.prepare(`
        INSERT INTO payroll_batches (
          batch_code, month_year, total_staff, total_gross, total_deductions, total_net_payout, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, 'Draft', ?)
      `);

      const batchResult = batchStmt.run(
        batchCode,
        targetMonth,
        items.length,
        totalGross,
        totalDeductions,
        totalNet,
        req.user.full_name || 'Bursar'
      );

      createdBatchId = Number(batchResult.lastInsertRowid);

      const itemStmt = db.prepare(`
        INSERT INTO payroll_items (
          batch_id, staff_id, base_salary, total_allowances, total_deductions, net_amount,
          bank_name, bank_code, account_number, account_name, transfer_reference, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
      `);

      for (const item of items) {
        itemStmt.run(
          createdBatchId,
          item.staff_id,
          item.base_salary,
          item.housing_allowance + item.transport_allowance + item.teaching_allowance,
          item.ded,
          item.net,
          item.bank_name || 'Guaranty Trust Bank',
          item.bank_code || '058',
          item.account_number || `01${item.staff_id}000000`.slice(0, 10),
          item.account_name || item.name.toUpperCase(),
          item.transfer_reference
        );
      }

      db.exec('COMMIT;');
    } catch (txErr) {
      db.exec('ROLLBACK;');
      throw txErr;
    }

    logAudit(req.user.id, 'GENERATE_PAYROLL', 'PAYROLL', `Generated payroll batch ${batchCode} (${targetMonth}) for ${items.length} staff: ₦${totalNet.toLocaleString()}`, req.ip);

    res.status(201).json({
      success: true,
      message: `Payroll roll for ${targetMonth} generated successfully!`,
      batch: {
        id: createdBatchId,
        batch_code: batchCode,
        month_year: targetMonth,
        total_staff: items.length,
        total_gross: totalGross,
        total_deductions: totalDeductions,
        total_net_payout: totalNet,
        status: 'Draft'
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 7. GET /api/payroll/batches/:id
 * Retrieve full breakdown of a payroll batch with staff items
 */
router.get('/batches/:id', authenticate, requireRoles('bursar', 'admin', 'superadmin'), (req, res, next) => {
  try {
    const batch = db.prepare('SELECT * FROM payroll_batches WHERE id = ?').get(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Payroll batch not found.' });
    }

    const items = db.prepare(`
      SELECT 
        pi.*,
        s.staff_no,
        s.name as staff_name,
        s.role as staff_role,
        s.phone as staff_phone
      FROM payroll_items pi
      JOIN staff s ON pi.staff_id = s.id
      WHERE pi.batch_id = ?
      ORDER BY s.id ASC
    `).all(req.params.id);

    res.json({
      success: true,
      batch,
      items
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 8. POST /api/payroll/batches/:id/disburse
 * Execute Bulk Transfer Payout via Paystack API
 */
router.post('/batches/:id/disburse', authenticate, requireRoles('bursar', 'admin', 'superadmin'), async (req, res, next) => {
  try {
    const batch = db.prepare('SELECT * FROM payroll_batches WHERE id = ?').get(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Payroll batch not found.' });
    }

    if (batch.status === 'Disbursed') {
      return res.status(400).json({ success: false, message: 'This payroll batch has already been disbursed.' });
    }

    const items = db.prepare(`
      SELECT pi.*, sba.paystack_recipient_code
      FROM payroll_items pi
      LEFT JOIN staff_bank_accounts sba ON pi.staff_id = sba.staff_id
      WHERE pi.batch_id = ?
    `).all(req.params.id);

    // Prepare transfer payload
    const transfers = items.map(item => ({
      amount: item.net_amount,
      recipient: item.paystack_recipient_code || `RCP_MOCK_${item.staff_id}`,
      reference: item.transfer_reference,
      reason: `Eagle Power Schools Salary: ${batch.month_year}`
    }));

    // Call Paystack Bulk Transfer Gateway
    const transferResult = await initiateBulkTransfer({
      batchCode: batch.batch_code,
      transfers
    });

    db.exec('BEGIN TRANSACTION;');
    try {
      // Update batch
      db.prepare(`
        UPDATE payroll_batches
        SET status = 'Disbursed',
            approved_by = ?,
            disbursed_at = CURRENT_TIMESTAMP,
            paystack_batch_code = ?
        WHERE id = ?
      `).run(req.user.full_name || 'Bursar / Admin', transferResult.batch_code, req.params.id);

      // Update all items
      db.prepare(`
        UPDATE payroll_items
        SET status = 'Success',
            disbursed_at = CURRENT_TIMESTAMP
        WHERE batch_id = ?
      `).run(req.params.id);

      db.exec('COMMIT;');
    } catch (txErr) {
      db.exec('ROLLBACK;');
      throw txErr;
    }

    logAudit(
      req.user.id,
      'DISBURSE_PAYROLL',
      'PAYROLL',
      `Bulk disbursed payroll batch ${batch.batch_code} (₦${batch.total_net_payout.toLocaleString()}) to ${items.length} staff via Paystack`,
      req.ip
    );

    res.json({
      success: true,
      message: `Bulk payroll for ${batch.month_year} disbursed successfully!`,
      gateway_batch_code: transferResult.batch_code,
      total_payout: batch.total_net_payout,
      is_simulated: transferResult.is_simulated
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 9. GET /api/payroll/payslip/:staffId
 * View individual printable pay slip
 */
router.get('/payslip/:staffId', authenticate, (req, res, next) => {
  try {
    const staffId = parseInt(req.params.staffId);
    const { batch_id } = req.query;

    // Security: Teachers can only view their own pay slip
    if (req.user.role === 'teacher' && req.user.reference_id) {
      const selfStaff = db.prepare('SELECT id FROM staff WHERE UPPER(staff_no) = ?').get(req.user.reference_id.toUpperCase());
      if (!selfStaff || selfStaff.id !== staffId) {
        return res.status(403).json({ success: false, message: 'Access denied: You may only view your own pay slip.' });
      }
    }

    const staff = db.prepare('SELECT * FROM staff WHERE id = ?').get(staffId);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    const item = batch_id 
      ? db.prepare('SELECT * FROM payroll_items WHERE staff_id = ? AND batch_id = ?').get(staffId, batch_id)
      : db.prepare('SELECT * FROM payroll_items WHERE staff_id = ? ORDER BY id DESC LIMIT 1').get(staffId);

    const structure = db.prepare('SELECT * FROM staff_salary_structures WHERE staff_id = ?').get(staffId);
    const bank = db.prepare('SELECT * FROM staff_bank_accounts WHERE staff_id = ?').get(staffId);

    res.json({
      success: true,
      payslip: {
        school: {
          name: 'Eagle Power Schools',
          motto: 'Love, Truth & Service',
          address: '2 & 9 Amikwo Road, Awka, Anambra State',
          phone: '+234 803 709 8816'
        },
        staff: {
          id: staff.id,
          staff_no: staff.staff_no,
          name: staff.name,
          role: staff.role,
          assigned_class: staff.assigned_class,
          bank_name: bank?.bank_name || 'Guaranty Trust Bank',
          account_number: bank?.account_number || 'N/A'
        },
        earnings: {
          base_salary: structure?.base_salary || 75000,
          housing_allowance: structure?.housing_allowance || 15000,
          transport_allowance: structure?.transport_allowance || 10000,
          teaching_allowance: structure?.teaching_allowance || 10000,
          gross_pay: (structure?.base_salary || 75000) + (structure?.housing_allowance || 15000) + (structure?.transport_allowance || 10000) + (structure?.teaching_allowance || 10000)
        },
        deductions: {
          tax: structure?.tax_deduction || 5500,
          pension: structure?.pension_deduction || 4000,
          other: structure?.other_deductions || 0,
          total_deductions: (structure?.tax_deduction || 5500) + (structure?.pension_deduction || 4000) + (structure?.other_deductions || 0)
        },
        net_pay: structure?.net_salary || 86500,
        disbursement_status: item?.status || 'Scheduled'
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
