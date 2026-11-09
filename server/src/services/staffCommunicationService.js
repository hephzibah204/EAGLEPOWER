/**
 * EAGLE POWER SCHOOLS & COLLEGES, AWKA
 * Staff Communication & Automated Messaging Engine
 * Handles multi-channel automated alerts, daily duty reminders,
 * in-app teacher notifications, and WhatsApp staff broadcasts.
 */

import db from '../config/db.js';

// Ensure tables exist
export function initStaffCommunicationSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE, -- NULL means broadcast to all active staff
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'ANNOUNCEMENT', -- 'DUTY_REMINDER', 'LESSON_NOTE', 'GRADEBOOK_DEADLINE', 'PAYSLIP', 'EXECUTIVE_DIRECTIVE', 'GENERAL'
      priority TEXT NOT NULL DEFAULT 'NORMAL', -- 'LOW', 'NORMAL', 'HIGH', 'URGENT'
      action_url TEXT, -- tab or path e.g. 'attendance', 'lesson_notes', 'gradebook', 'payroll'
      is_read INTEGER DEFAULT 0,
      read_at DATETIME,
      sender_name TEXT DEFAULT 'Administration',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS staff_broadcast_campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      target_group TEXT NOT NULL, -- 'ALL_STAFF', 'TEACHERS', 'FORM_MASTERS', 'NON_TEACHING', 'MANAGEMENT', 'SPECIFIC_STAFF'
      channels TEXT NOT NULL DEFAULT 'IN_APP,WHATSAPP',
      trigger_type TEXT NOT NULL DEFAULT 'MANUAL', -- 'MANUAL', 'AUTOMATED_SCHEDULE'
      recipient_count INTEGER DEFAULT 0,
      delivered_count INTEGER DEFAULT 0,
      dispatched_by TEXT NOT NULL,
      status TEXT DEFAULT 'COMPLETED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS staff_automation_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      is_enabled INTEGER DEFAULT 1,
      schedule_time TEXT DEFAULT '07:45',
      schedule_days TEXT DEFAULT 'MON,TUE,WED,THU,FRI',
      template_title TEXT NOT NULL,
      template_body TEXT NOT NULL,
      target_audience TEXT NOT NULL DEFAULT 'TEACHERS',
      channels TEXT NOT NULL DEFAULT 'IN_APP,WHATSAPP',
      priority TEXT DEFAULT 'HIGH',
      action_url TEXT,
      last_run_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default automated rules if not present
  const existingRules = db.prepare('SELECT COUNT(*) as c FROM staff_automation_rules').get()?.c || 0;
  if (existingRules === 0) {
    const defaultRules = [
      {
        rule_key: 'DAILY_MORNING_DUTY_REMINDER',
        name: 'Daily Morning Duty & Attendance Roll-Call',
        description: 'Automated 7:45 AM reminder for Form Masters and Duty Teachers to conduct morning assembly and submit class roll calls before 8:30 AM.',
        schedule_time: '07:45',
        schedule_days: 'MON,TUE,WED,THU,FRI',
        target_audience: 'FORM_MASTERS',
        channels: 'IN_APP,WHATSAPP',
        priority: 'HIGH',
        action_url: 'attendance',
        template_title: '📋 Morning Roll Call & Gate Duty Reminder',
        template_body: 'Good morning Educator! Please ensure your classroom attendance roll-call is marked and submitted on the portal before 8:30 AM prompt. Ensure every scholar in your assigned form room is accounted for.'
      },
      {
        rule_key: 'WEEKLY_LESSON_PLAN_SUBMISSION',
        name: 'Friday Lesson Notes & Scheme Submission Alert',
        description: 'Automated weekly alert every Friday (1:00 PM) prompting all teaching faculty to submit next week’s lesson plans and scheme of work for HOD review.',
        schedule_time: '13:00',
        schedule_days: 'FRI',
        target_audience: 'TEACHERS',
        channels: 'IN_APP,WHATSAPP',
        priority: 'HIGH',
        action_url: 'lesson_notes',
        template_title: '📚 Weekly Lesson Notes & Scheme Submission Due',
        template_body: 'Good day Colleague! A reminder that your curriculum lesson notes, behavioral objectives, and schemes of work for next week’s academic schedule must be submitted on the portal by 3:00 PM today for HOD approval.'
      },
      {
        rule_key: 'TERMINAL_GRADEBOOK_DEADLINE',
        name: 'Continuous Assessment & Exam Score Upload Countdown',
        description: 'Alerts all subject teachers to enter Continuous Assessment (CA1, CA2) and terminal exam scores into the Master Gradebook before deadline.',
        schedule_time: '08:00',
        schedule_days: 'WED,THU,FRI',
        target_audience: 'TEACHERS',
        channels: 'IN_APP,WHATSAPP',
        priority: 'URGENT',
        action_url: 'gradebook',
        template_title: '📊 Continuous Assessment (CA) & Exam Score Entry Deadline',
        template_body: 'Urgent Academic Directive: Terminal Continuous Assessment (CA1, CA2) and Examination scores for your assigned subjects must be finalized in the Gradebook before the close of work this Friday.'
      },
      {
        rule_key: 'MONTHLY_PAYSLIP_PUBLISHED',
        name: 'Monthly Staff Payroll & Payslip Issuance',
        description: 'Instant notification alerting staff when monthly payroll has been finalized and electronic payslips are available for download.',
        schedule_time: '16:00',
        schedule_days: 'MON,TUE,WED,THU,FRI',
        target_audience: 'ALL_STAFF',
        channels: 'IN_APP,WHATSAPP',
        priority: 'NORMAL',
        action_url: 'payroll',
        template_title: '💳 Monthly Electronic Payslip Available',
        template_body: 'Dear Faculty Colleague, your official electronic payslip for this month has been processed and signed. You can review your salary breakdown, allowances, and statutory deductions under Payroll in your portal.'
      },
      {
        rule_key: 'STAFF_GENERAL_ANNOUNCEMENT',
        name: 'Executive Management Directive & Staff Briefing',
        description: 'Direct communication channel from the Principal and Management for general staff notices, PTA coordination, and academic calendars.',
        schedule_time: '09:00',
        schedule_days: 'MON',
        target_audience: 'ALL_STAFF',
        channels: 'IN_APP,WHATSAPP',
        priority: 'NORMAL',
        action_url: 'overview',
        template_title: '📢 Executive Academic Notice from School Management',
        template_body: 'Good day esteemed staff members! Please check your portal noticeboard for important operational guidelines, term calendar updates, and upcoming institutional events.'
      }
    ];

    const insertStmt = db.prepare(`
      INSERT INTO staff_automation_rules 
      (rule_key, name, description, schedule_time, schedule_days, target_audience, channels, priority, action_url, template_title, template_body)
      VALUES (@rule_key, @name, @description, @schedule_time, @schedule_days, @target_audience, @channels, @priority, @action_url, @template_title, @template_body)
    `);

    for (const rule of defaultRules) {
      insertStmt.run(rule);
    }
  }
}

// Initialize on module import
initStaffCommunicationSchema();

/**
 * Resolve staff members based on target group
 */
export function resolveTargetStaff(targetGroup, specificStaffIds = []) {
  if (targetGroup === 'SPECIFIC_STAFF' && Array.isArray(specificStaffIds) && specificStaffIds.length > 0) {
    const placeholders = specificStaffIds.map(() => '?').join(',');
    return db.prepare(`
      SELECT s.*, u.username, u.id as user_id 
      FROM staff s 
      LEFT JOIN users u ON u.reference_id = s.staff_no 
      WHERE s.id IN (${placeholders}) AND s.is_active = 1
    `).all(...specificStaffIds);
  }

  if (targetGroup === 'FORM_MASTERS') {
    return db.prepare(`
      SELECT s.*, u.username, u.id as user_id 
      FROM staff s 
      LEFT JOIN users u ON u.reference_id = s.staff_no 
      WHERE s.is_active = 1 
        AND (
          s.form_responsibility IS NOT NULL 
          OR (s.assigned_class IS NOT NULL AND s.assigned_class NOT IN ('', 'General Faculty', 'None'))
          OR LOWER(s.role) LIKE '%form%'
        )
      ORDER BY s.name ASC
    `).all();
  }

  if (targetGroup === 'TEACHERS') {
    return db.prepare(`
      SELECT s.*, u.username, u.id as user_id 
      FROM staff s 
      LEFT JOIN users u ON u.reference_id = s.staff_no 
      WHERE s.is_active = 1 
        AND (
          LOWER(s.role) LIKE '%teacher%' 
          OR LOWER(s.role) LIKE '%educator%' 
          OR LOWER(s.role) LIKE '%master%' 
          OR LOWER(s.role) LIKE '%mistress%'
          OR LOWER(s.role) LIKE '%faculty%'
        )
      ORDER BY s.name ASC
    `).all();
  }

  if (targetGroup === 'MANAGEMENT') {
    return db.prepare(`
      SELECT s.*, u.username, u.id as user_id 
      FROM staff s 
      LEFT JOIN users u ON u.reference_id = s.staff_no 
      WHERE s.is_active = 1 
        AND (
          LOWER(s.role) LIKE '%principal%' 
          OR LOWER(s.role) LIKE '%director%' 
          OR LOWER(s.role) LIKE '%admin%' 
          OR LOWER(s.role) LIKE '%manager%'
          OR LOWER(s.role) LIKE '%head%'
        )
      ORDER BY s.name ASC
    `).all();
  }

  if (targetGroup === 'NON_TEACHING') {
    return db.prepare(`
      SELECT s.*, u.username, u.id as user_id 
      FROM staff s 
      LEFT JOIN users u ON u.reference_id = s.staff_no 
      WHERE s.is_active = 1 
        AND (
          LOWER(s.role) NOT LIKE '%teacher%' 
          AND LOWER(s.role) NOT LIKE '%educator%' 
          AND LOWER(s.role) NOT LIKE '%master%' 
          AND LOWER(s.role) NOT LIKE '%mistress%'
        )
      ORDER BY s.name ASC
    `).all();
  }

  // Default: ALL_STAFF
  return db.prepare(`
    SELECT s.*, u.username, u.id as user_id 
    FROM staff s 
    LEFT JOIN users u ON u.reference_id = s.staff_no 
    WHERE s.is_active = 1 
    ORDER BY s.name ASC
  `).all();
}

/**
 * Format a high-visibility, professional WhatsApp alert for staff
 */
export function formatStaffWhatsAppMessage({ staffName, title, message, priority, actionUrl, senderName }) {
  const priorityBadge = priority === 'URGENT' ? '🚨 *URGENT NOTICE*' : (priority === 'HIGH' ? '⚠️ *HIGH PRIORITY*' : '📌 *STAFF BULLETIN*');
  
  return `🦅 *EAGLE POWER SCHOOLS & COLLEGES, AWKA*
_Motto: Love, Truth & Service_

${priorityBadge}
*To:* ${staffName || 'Staff Colleague'}
*From:* ${senderName || 'Eagle Power Administration'}
*Date:* ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}

*Subject: ${title}*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${message}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 *Teacher Portal Workspace:*
https://eaglepower.pages.dev/portal${actionUrl ? `?tab=${actionUrl}` : ''}

_Eagle Power Schools Educator Support Network_`;
}

/**
 * Dispatch / Broadcast message to staff members across selected channels
 */
export async function broadcastToStaff({
  title,
  message,
  targetGroup = 'ALL_STAFF',
  specificStaffIds = [],
  channels = 'IN_APP,WHATSAPP',
  dispatchedBy = 'Administration',
  priority = 'NORMAL',
  actionUrl = null,
  triggerType = 'MANUAL'
}) {
  if (!title || !message) {
    throw new Error('Title and message are required for staff broadcast.');
  }

  const recipients = resolveTargetStaff(targetGroup, specificStaffIds);
  const includeInApp = channels.includes('IN_APP');
  const includeWhatsApp = channels.includes('WHATSAPP');

  let inAppCount = 0;
  let whatsAppQueuedCount = 0;

  // 1. Deliver In-App Notifications
  if (includeInApp && recipients.length > 0) {
    const notifStmt = db.prepare(`
      INSERT INTO staff_notifications (staff_id, title, message, type, priority, action_url, is_read, sender_name)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `);

    const insertMany = db.transaction((staffList) => {
      for (const st of staffList) {
        notifStmt.run(
          st.id,
          title.trim(),
          message.trim(),
          priority === 'URGENT' ? 'EXECUTIVE_DIRECTIVE' : 'ANNOUNCEMENT',
          priority,
          actionUrl,
          dispatchedBy
        );
      }
    });

    insertMany(recipients);
    inAppCount = recipients.length;
  }

  // 2. Queue & Dispatch WhatsApp Notifications
  if (includeWhatsApp && recipients.length > 0) {
    const validPhones = recipients.filter(s => s.phone && s.phone.replace(/\D/g, '').length >= 10);
    whatsAppQueuedCount = validPhones.length;

    // Log the broadcast in whatsapp_broadcast_logs for visibility
    const audienceDesc = targetGroup === 'ALL_STAFF' 
      ? 'All Active Faculty & Staff' 
      : (targetGroup === 'TEACHERS' ? 'All Teaching Faculty' : (targetGroup === 'FORM_MASTERS' ? 'Class Form Masters' : `Staff Selection (${recipients.length} members)`));

    const sampleText = formatStaffWhatsAppMessage({
      staffName: 'Staff Member',
      title,
      message,
      priority,
      actionUrl,
      senderName: dispatchedBy
    });

    db.prepare(`
      INSERT INTO whatsapp_broadcast_logs 
      (broadcast_type, target_audience, title, message, recipient_count, dispatched_by, status)
      VALUES (?, ?, ?, ?, ?, ?, 'QUEUED_FOR_DISPATCH')
    `).run('STAFF_AUTOMATION', audienceDesc, title.trim(), sampleText, validPhones.length, dispatchedBy);
  }

  // 3. Record Campaign Log
  const campaignStmt = db.prepare(`
    INSERT INTO staff_broadcast_campaigns 
    (title, message, target_group, channels, trigger_type, recipient_count, delivered_count, dispatched_by, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED')
  `);

  const campaignResult = campaignStmt.run(
    title.trim(),
    message.trim(),
    targetGroup,
    channels,
    triggerType,
    recipients.length,
    inAppCount + whatsAppQueuedCount,
    dispatchedBy
  );

  return {
    success: true,
    campaignId: campaignResult.lastInsertRowid,
    targetGroup,
    totalRecipients: recipients.length,
    inAppDelivered: inAppCount,
    whatsAppQueued: whatsAppQueuedCount,
    channels,
    dispatchedBy,
    timestamp: new Date().toISOString()
  };
}

/**
 * Trigger an automated rule manually or via scheduler
 */
export async function triggerAutomationRule(ruleKey, customDispatchedBy = 'System Scheduler') {
  const rule = db.prepare('SELECT * FROM staff_automation_rules WHERE rule_key = ?').get(ruleKey);
  if (!rule) {
    throw new Error(`Automation rule '${ruleKey}' not found.`);
  }

  const result = await broadcastToStaff({
    title: rule.template_title,
    message: rule.template_body,
    targetGroup: rule.target_audience,
    channels: rule.channels,
    dispatchedBy: customDispatchedBy,
    priority: rule.priority || 'HIGH',
    actionUrl: rule.action_url,
    triggerType: 'AUTOMATED_SCHEDULE'
  });

  // Update rule last_run_at
  db.prepare(`
    UPDATE staff_automation_rules 
    SET last_run_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
    WHERE rule_key = ?
  `).run(ruleKey);

  return {
    ...result,
    ruleKey,
    ruleName: rule.name
  };
}

/**
 * Get notifications for a specific logged in staff member
 */
export function getStaffNotifications(staffId, { limit = 30, unreadOnly = false } = {}) {
  let query = `
    SELECT * FROM staff_notifications 
    WHERE (staff_id = ? OR staff_id IS NULL)
  `;
  const params = [staffId];

  if (unreadOnly) {
    query += ` AND is_read = 0`;
  }

  query += ` ORDER BY id DESC LIMIT ?`;
  params.push(limit);

  const notifications = db.prepare(query).all(...params);

  const unreadCount = db.prepare(`
    SELECT COUNT(*) as c 
    FROM staff_notifications 
    WHERE (staff_id = ? OR staff_id IS NULL) AND is_read = 0
  `).get(staffId)?.c || 0;

  return {
    notifications,
    unreadCount,
    total: notifications.length
  };
}

/**
 * Mark a single notification or all notifications as read
 */
export function markNotificationRead(notificationId, staffId) {
  if (notificationId === 'ALL') {
    db.prepare(`
      UPDATE staff_notifications 
      SET is_read = 1, read_at = CURRENT_TIMESTAMP 
      WHERE (staff_id = ? OR staff_id IS NULL) AND is_read = 0
    `).run(staffId);
    return { success: true, message: 'All notifications marked as read.' };
  }

  db.prepare(`
    UPDATE staff_notifications 
    SET is_read = 1, read_at = CURRENT_TIMESTAMP 
    WHERE id = ? AND (staff_id = ? OR staff_id IS NULL)
  `).run(notificationId, staffId);

  return { success: true, notificationId };
}

/**
 * Get dashboard overview statistics for staff communication
 */
export function getStaffCommunicationOverview() {
  const totalStaff = db.prepare('SELECT COUNT(*) as c FROM staff WHERE is_active = 1').get()?.c || 0;
  const totalTeachers = db.prepare(`
    SELECT COUNT(*) as c FROM staff 
    WHERE is_active = 1 AND (LOWER(role) LIKE '%teacher%' OR LOWER(role) LIKE '%educator%' OR LOWER(role) LIKE '%master%' OR LOWER(role) LIKE '%mistress%')
  `).get()?.c || 0;
  const totalFormMasters = db.prepare(`
    SELECT COUNT(*) as c FROM staff 
    WHERE is_active = 1 AND (form_responsibility IS NOT NULL OR (assigned_class IS NOT NULL AND assigned_class NOT IN ('', 'General Faculty', 'None')))
  `).get()?.c || 0;

  const totalCampaigns = db.prepare('SELECT COUNT(*) as c FROM staff_broadcast_campaigns').get()?.c || 0;
  const totalNotificationsSent = db.prepare('SELECT COUNT(*) as c FROM staff_notifications').get()?.c || 0;
  const unreadNotifications = db.prepare('SELECT COUNT(*) as c FROM staff_notifications WHERE is_read = 0').get()?.c || 0;

  const recentCampaigns = db.prepare(`
    SELECT * FROM staff_broadcast_campaigns ORDER BY id DESC LIMIT 10
  `).all();

  const rules = db.prepare(`
    SELECT * FROM staff_automation_rules ORDER BY id ASC
  `).all();

  return {
    totalStaff,
    totalTeachers,
    totalFormMasters,
    totalCampaigns,
    totalNotificationsSent,
    unreadNotifications,
    recentCampaigns,
    rules
  };
}

/**
 * Curated Library of Ready-to-Use Institutional Communication Templates
 */
export const STAFF_COMMUNICATION_TEMPLATES = [
  {
    id: 'morning_rollcall',
    category: 'Attendance & Duty',
    title: 'Daily Morning Roll Call & Gate Duty Reminder',
    subject: '📋 Morning Roll Call & Gate Duty Reminder',
    targetGroup: 'FORM_MASTERS',
    priority: 'HIGH',
    actionUrl: 'attendance',
    body: 'Good morning Educator! Please ensure your classroom attendance roll-call is marked and submitted on the portal before 8:30 AM prompt. Ensure every scholar in your assigned form room is accounted for.'
  },
  {
    id: 'lesson_notes_friday',
    category: 'Academics & Curriculum',
    title: 'Friday Lesson Scheme & Notes Submission Due',
    subject: '📚 Weekly Lesson Notes & Scheme Submission Due',
    targetGroup: 'TEACHERS',
    priority: 'HIGH',
    actionUrl: 'lesson_notes',
    body: 'Good day Colleague! A reminder that your curriculum lesson notes, behavioral objectives, and schemes of work for next week’s academic schedule must be submitted on the portal by 3:00 PM today for HOD approval.'
  },
  {
    id: 'ca_marks_deadline',
    category: 'Academics & Curriculum',
    title: 'Continuous Assessment (CA) Score Entry Deadline',
    subject: '📊 Continuous Assessment (CA) Score Entry Deadline',
    targetGroup: 'TEACHERS',
    priority: 'URGENT',
    actionUrl: 'gradebook',
    body: 'Urgent Academic Directive: Terminal Continuous Assessment (CA1, CA2) and Examination scores for your assigned subjects must be finalized in the Gradebook before the close of work this Friday.'
  },
  {
    id: 'monthly_payslip',
    category: 'Finance & Payroll',
    title: 'Monthly E-Payslip & Salary Disbursement Notice',
    subject: '💳 Monthly Electronic Payslip Available',
    targetGroup: 'ALL_STAFF',
    priority: 'NORMAL',
    actionUrl: 'payroll',
    body: 'Dear Faculty Colleague, your official electronic payslip for this month has been processed and signed. You can review your salary breakdown, allowances, and statutory deductions under Payroll in your portal.'
  },
  {
    id: 'pta_meeting_duty',
    category: 'Administration',
    title: 'Parent-Teacher Association (PTA) Meeting Briefing',
    subject: '🤝 PTA General Assembly — Staff Attendance & Duty Roster',
    targetGroup: 'ALL_STAFF',
    priority: 'HIGH',
    actionUrl: 'overview',
    body: 'Notice to All Staff: The Termly PTA General Meeting is scheduled for this Saturday at 10:00 AM in the School Auditorium. All form masters and subject teachers are required to be seated in academic attire by 9:30 AM.'
  },
  {
    id: 'exam_invigilation',
    category: 'Examinations',
    title: 'Terminal Examination Invigilation Roster Released',
    subject: '📝 Terminal Examination Invigilation Timetable & Conduct Guidelines',
    targetGroup: 'TEACHERS',
    priority: 'URGENT',
    actionUrl: 'gradebook',
    body: 'Attention Teaching Staff: The official examination hall invigilation timetable has been uploaded. Please verify your hall assignments, question paper custody duties, and ensure zero tolerance for examination malpractice.'
  },
  {
    id: 'emergency_closure',
    category: 'Security & Safety',
    title: 'Emergency Campus Security & Advisory Notice',
    subject: '🚨 URGENT: Campus Safety Advisory & Operational Directive',
    targetGroup: 'ALL_STAFF',
    priority: 'URGENT',
    actionUrl: 'overview',
    body: 'Urgent Directive from Management: Please adhere to standard security protocols. Keep scholars in their respective classrooms, ensure gates remain secured, and direct any visitor enquiries to the security desk.'
  },
  {
    id: 'professional_development',
    category: 'Workshops & Training',
    title: 'Faculty Continuous Professional Development Workshop',
    subject: '🎓 Staff Professional Development & Curriculum Workshop',
    targetGroup: 'TEACHERS',
    priority: 'NORMAL',
    actionUrl: 'overview',
    body: 'Colleagues, you are invited to this term’s pedagogical workshop on modern STEM instructional delivery and digital continuous assessment tracking. Venue: Digital Library, Friday 2:30 PM.'
  }
];

/**
 * Background Scheduler: Runs periodically, checks Lagos/WAT time,
 * and automatically triggers daily/weekly staff rules.
 */
let lastSchedulerHourChecked = -1;

export function runStaffCommunicationSchedulerCheck() {
  try {
    const lagosFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Lagos',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
      hourCycle: 'h23'
    });

    const parts = lagosFormatter.formatToParts(new Date());
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    const weekday = (parts.find(p => p.type === 'weekday')?.value || '').toUpperCase().slice(0, 3); // MON, TUE, etc.

    const currentTimeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    const todayDateStr = new Date().toISOString().slice(0, 10);

    // Fetch active rules
    const rules = db.prepare('SELECT * FROM staff_automation_rules WHERE is_enabled = 1').all();

    for (const rule of rules) {
      const days = (rule.schedule_days || '').split(',').map(d => d.trim().toUpperCase());
      if (!days.includes(weekday)) continue;

      // Check if time matches (within current 15 min window) and hasn't run today
      const [rHour, rMin] = (rule.schedule_time || '07:45').split(':').map(Number);
      const diffMinutes = (hour * 60 + minute) - (rHour * 60 + rMin);

      const hasRunToday = rule.last_run_at && rule.last_run_at.startsWith(todayDateStr);

      if (diffMinutes >= 0 && diffMinutes <= 15 && !hasRunToday) {
        console.log(`[STAFF COMM SCHEDULER] Triggering automated rule "${rule.name}" (${rule.rule_key}) for ${weekday} ${currentTimeStr} WAT`);
        triggerAutomationRule(rule.rule_key, 'Eagle Power Automated Cron')
          .then(res => console.log(`[STAFF COMM SCHEDULER] Successfully dispatched "${rule.name}" to ${res.totalRecipients} staff members.`))
          .catch(err => console.warn(`[STAFF COMM SCHEDULER] Error running "${rule.name}":`, err.message));
      }
    }
  } catch (err) {
    console.warn('[STAFF COMM SCHEDULER] Error in scheduler loop:', err.message);
  }
}

export function startStaffCommunicationScheduler() {
  console.log('⏰ Starting Eagle Power Automated Staff Communication Scheduler (Africa/Lagos)...');
  // Run initial check immediately
  runStaffCommunicationSchedulerCheck();
  // Check every 5 minutes
  const timer = setInterval(runStaffCommunicationSchedulerCheck, 5 * 60 * 1000);
  timer.unref();
}
