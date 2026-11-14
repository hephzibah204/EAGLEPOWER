const management = ['executive_cockpit', 'overview', 'students', 'student_profile', 'staff', 'admissions', 'classes', 'attendance', 'gradebook', 'broadsheet', 'reportcard', 'templates', 'homework', 'lesson_notes', 'ai_progress', 'invoices', 'payroll', 'visitors', 'staff_communication', 'help_guide'];
export const ROLE_TABS = Object.freeze({
  superadmin: [...management, 'users', 'system_settings', 'threat_radar', 'security', 'audit', 'ai_analytics'],
  admin: management,
  teacher: ['teacher_cockpit', 'my_students', 'attendance', 'gradebook', 'broadsheet', 'homework', 'lesson_notes', 'reportcard', 'ai_progress', 'help_guide'],
  bursar: ['invoices', 'payroll', 'reportcard', 'help_guide'],
  student: ['reportcard', 'homework', 'student_profile', 'ai_progress', 'help_guide'],
  parent: ['child_overview', 'reportcard', 'homework', 'student_profile', 'invoices', 'ai_progress', 'help_guide'],
  frontdesk: ['visitors', 'help_guide'],
});
export function getDashboardRole(userRole, previewRole) {
  if (!ROLE_TABS[userRole]) return null;
  if (userRole === 'superadmin' && ROLE_TABS[previewRole]) return previewRole;
  if (userRole === 'admin' && ROLE_TABS[previewRole] && previewRole !== 'superadmin') return previewRole;
  return userRole;
}
export function canAccessTab(role, tab) {
  return ROLE_TABS[role]?.includes(tab) || false;
}
export function defaultTab(role) {
  return ({superadmin: 'overview', admin: 'executive_cockpit', teacher: 'teacher_cockpit', bursar: 'invoices', student: 'reportcard', parent: 'child_overview', frontdesk: 'visitors'})[role] || 'access_denied';
}
export function canLoadDashboardResource(role, resource) {
  const groups = {
    academics: ['admin', 'superadmin', 'teacher', 'bursar', 'student', 'parent'],
    students: ['admin', 'superadmin', 'teacher', 'bursar'],
    staff: ['admin', 'superadmin', 'teacher', 'bursar'],
    financeStats: ['admin', 'superadmin', 'bursar'],
    invoices: ['admin', 'superadmin', 'bursar', 'parent'],
    admissions: ['admin', 'superadmin'],
    frontdesk: ['admin', 'superadmin', 'frontdesk'],
    homework: ['admin', 'superadmin', 'teacher', 'parent', 'student'],
    lessonNotes: ['admin', 'superadmin', 'teacher'],
    payroll: ['admin', 'superadmin', 'bursar'],
  };
  return groups[resource]?.includes(role) || false;
}
