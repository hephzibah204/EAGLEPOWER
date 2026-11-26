// Production weekly report for Eagle Power Schools.
//
// HISTORY: the weekly Executive Report used to be generated from the bot's own
// local SQLite file on the Fly volume. That file was a one-time snapshot that
// never synced with the portal, so leadership received stale or invented
// figures (99 pupils when the school had 379, a 100% punctuality rate computed
// from zero clock-ins, a hardcoded 96.4% SLA line, "all systems normal"
// printed unconditionally). This module is the replacement: it fetches live
// aggregates from the portal's /api/executive/weekly-report-data endpoint
// (baseline portalDbData merged with the D1 stores and attendance_records)
// and formats ONLY what the data actually supports. When production data
// cannot be fetched, it returns an honest "unavailable" notice. It never
// falls back to the local snapshot.

const PORTAL_BASE = (process.env.PORTAL_BASE_URL || 'https://eaglepowerschools.com.ng').replace(/\/$/, '');

export async function fetchProductionReportData(days = 7) {
  const key = process.env.WEEKLY_REPORT_KEY || '';
  if (key.length < 32) {
    console.warn('[Weekly Report] WEEKLY_REPORT_KEY is not configured on the bot; cannot fetch production data.');
    return null;
  }
  try {
    const res = await fetch(`${PORTAL_BASE}/api/executive/weekly-report-data?days=${days}`, {
      headers: { 'x-weekly-report-key': key },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      console.warn(`[Weekly Report] Portal report endpoint returned HTTP ${res.status}.`);
      return null;
    }
    const data = await res.json();
    return data?.success ? data : null;
  } catch (err) {
    console.warn('[Weekly Report] Failed to fetch production report data:', err.message);
    return null;
  }
}

const fmtDate = (iso) => {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
};
const naira = (n) => `₦${Number(n || 0).toLocaleString('en-NG')}`;

export function formatProductionReport(data, recipientName = null, recipientRole = null) {
  const { period, session, term, enrollment, attendance, marks, bursary } = data;
  const recipientHeader = recipientName
    ? `👤 *Recipient:* ${recipientName}${recipientRole ? ` (${recipientRole})` : ''}`
    : `👤 *Executive Directorate:* Revd Nnamdi Nathaniel (Principal), Mrs. Adaeze Uzoefuna (Vice Principal) & Mr. Abiodun Emmanuel (Director)`;
  const presentPct = attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : null;
  const registerClasses = attendance.byClass?.length || 0;

  let out = `🦅 *EAGLE POWER SCHOOLS & COLLEGES, AWKA*
🏛️ *EXECUTIVE WEEKLY REPORT — SCHOOL LEADERSHIP*
═════════════════════════════
${recipientHeader}
📅 *Reporting Period:* ${fmtDate(period.from)} – ${fmtDate(period.to)} ${new Date(`${period.to}T12:00:00Z`).getUTCFullYear()}
🎓 *Academic Calendar:* ${term}, ${session} Session
═════════════════════════════

📊 *1. SCHOLAR ENROLLMENT & FACULTY*
• Active Scholars Enrolled: *${enrollment.active_students} Pupils*
• Teaching & Support Staff: *${enrollment.staff} Staff Members*
• Classes: *${enrollment.classes}*
• Registered Portal Accounts: *${enrollment.portal_accounts}*

📝 *2. STUDENT ATTENDANCE (PORTAL REGISTERS)*
• Attendance marks this period: *${attendance.total}* (${attendance.present} Present, ${attendance.absent} Absent${presentPct !== null ? `, ${presentPct}% present` : ''})
• Classes that took register on the portal: *${registerClasses} of ${enrollment.classes}*${registerClasses ? ` — ${attendance.byClass.map(c => c.class_name).join(', ')}` : ''}
• All-time portal attendance records: *${attendance.all_time_total}*`;

  if (registerClasses < enrollment.classes) {
    out += `
⚠️ Most classes are not yet taking attendance on the portal. The attendance figures above cover only the classes listed.`;
  }

  out += `

🏆 *3. ACADEMIC WORK — CA SCORES (${term.toUpperCase()})*
• CA scores entered so far this term: *${marks.term_total}*, covering *${marks.students_covered} pupils* in *${marks.subjects_covered} subjects*
• Entered this period: *${marks.entered_in_window} scores*${marks.avg_ca !== null ? `
• Average CA score: *${marks.avg_ca}*` : ''}
• Examination scores entered: *${marks.exam_scores_entered}*${marks.exam_scores_entered === 0 ? ' (none recorded on the portal yet)' : ''}`;

  if (marks.by_class?.length) {
    out += `
• By class: ${marks.by_class.map(c => `${c.class_name} ${c.count}`).join(', ')}`;
  }
  if (marks.top_scholars_ca?.length) {
    out += `
• Top CA averages so far: ${marks.top_scholars_ca.map(s => `${s.name} (${s.class_name || 'class n/a'}) ${s.avg_ca}`).join('; ')}`;
  }

  if (data.most_active_teachers?.length) {
    out += `

👨‍🏫 *4. MOST ACTIVE TEACHERS ON THE PORTAL*`;
    for (const t of data.most_active_teachers) {
      out += `
• *${t.teacher} (${t.class_name}):* ${t.ca_scores} CA scores entered, register taken on ${t.register_days} different days`;
    }
  }

  out += `

💰 *5. BURSARY*`;
  if (bursary.invoices_count === 0 && bursary.payments_all_time === 0) {
    out += `
• The portal currently holds no invoice or payment records, so no collection figure can be reported until fees are recorded on the system.`;
  } else {
    out += `
• Payments this period: *${naira(bursary.payments_in_window_total)}* (${bursary.payments_in_window} transactions)
• Invoiced this term: *${naira(bursary.invoiced_total)}* across ${bursary.invoices_count} invoices; paid: *${naira(bursary.invoiced_paid)}*`;
  }

  out += `

🏫 *6. ADMISSIONS & VISITORS*
• New admissions recorded on the portal this period: *${data.admissions.in_window}* (${data.admissions.total} total)
• Visitor passes recorded on the portal this period: *${data.visitors.in_window}* (${data.visitors.total} total)`;

  if (enrollment.classes_without_form_teacher?.length) {
    out += `

📌 *Management note:* ${enrollment.classes_without_form_teacher.join(', ')} currently ha${enrollment.classes_without_form_teacher.length === 1 ? 's' : 've'} *no form teacher assigned* on the portal.`;
  }

  out += `

═════════════════════════════
📡 Figures drawn from the live portal database (generated ${new Date(data.generated_at).toLocaleString('en-GB', { timeZone: 'Africa/Lagos' })} WAT).
🌐 Portal: https://eaglepowerschools.com.ng
_Eagle Power Intelligent Assistant — Executive Dispatch_`;
  return out;
}

export async function getWeeklyReportText(recipientName = null, recipientRole = null, days = 7) {
  const data = await fetchProductionReportData(days);
  if (!data) {
    return `🦅 *EAGLE POWER SCHOOLS & COLLEGES, AWKA*
🏛️ *EXECUTIVE WEEKLY REPORT*

The weekly report could not be generated from the live portal database at this time, so no figures are being sent rather than risk reporting numbers that cannot be verified. The ICT desk has been notified through the system logs.

🌐 Portal: https://eaglepowerschools.com.ng`;
  }
  return formatProductionReport(data, recipientName, recipientRole);
}
