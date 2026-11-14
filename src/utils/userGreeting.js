/**
 * userGreeting.js
 * Centralized utility for welcoming users by their institutional role and first name.
 * Handles Teacher, Parent, Admin/SuperAdmin, Bursar, and Student salutations.
 */

const HONORIFIC_TITLES = new Set([
  'mr', 'mr.', 'mrs', 'mrs.', 'ms', 'ms.', 'miss',
  'dr', 'dr.', 'engr', 'engr.', 'barr', 'barr.',
  'rev', 'rev.', 'pastor', 'prof', 'prof.', 'chief', 'lady', 'sir',
  '(mrs.)', '(mrs)', '(mr.)', '(mr)', '(dr.)', '(dr)'
]);

/**
 * Extracts the first name from a user object or name string,
 * automatically stripping professional / academic honorifics.
 * 
 * @param {string|object} userOrName 
 * @param {string} fallback 
 * @returns {string} First name or fallback
 */
export function getFirstName(userOrName, fallback = '') {
  if (!userOrName) return fallback;

  let raw = '';
  if (typeof userOrName === 'string') {
    raw = userOrName.trim();
  } else if (typeof userOrName === 'object') {
    raw = userOrName.first_name ||
          userOrName.staff?.first_name ||
          userOrName.student?.first_name ||
          userOrName.full_name ||
          userOrName.name ||
          userOrName.staff?.name ||
          userOrName.guardian_name ||
          userOrName.username ||
          '';
  }

  if (!raw || typeof raw !== 'string') return fallback;

  // Split tokens by whitespace and filter empties
  const parts = raw.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;

  // Advance past any leading titles (e.g. "Dr.", "Mrs.", "Barr. (Mrs.)")
  let idx = 0;
  while (idx < parts.length) {
    const token = parts[idx].toLowerCase().replace(/[,:]/g, '');
    if (HONORIFIC_TITLES.has(token)) {
      idx++;
    } else {
      break;
    }
  }

  const chosen = idx < parts.length ? parts[idx] : parts[0];
  const cleaned = chosen.replace(/[^a-zA-ZÀ-ÿ'-]/g, '');
  return cleaned || fallback;
}

/**
 * Formats a role-specific welcome salutation mentioning role and first name.
 * e.g. "Teacher Blessing", "Parent Chinyere", "Admin Kenechukwu"
 * 
 * @param {string|object} userOrName 
 * @param {string} explicitRole Optional override role ('teacher'|'parent'|'admin'|'superadmin'|etc.)
 * @returns {string} Formatted salutation (e.g. "Teacher Blessing", "Parent Chinyere")
 */
export function formatRoleWelcome(userOrName, explicitRole = null) {
  if (!userOrName && !explicitRole) return 'Welcome';

  const role = (
    explicitRole ||
    (typeof userOrName === 'object' ? userOrName?.role : '') ||
    ''
  ).toLowerCase();

  const firstName = getFirstName(userOrName);

  if (role === 'teacher') {
    return firstName ? `Teacher ${firstName}` : 'Teacher';
  }
  if (role === 'parent') {
    return firstName ? `Parent ${firstName}` : 'Parent';
  }
  if (role === 'admin' || role === 'superadmin') {
    return firstName ? `Admin ${firstName}` : 'Admin';
  }
  if (role === 'bursar') {
    return firstName ? `Bursar ${firstName}` : 'Bursar';
  }
  if (role === 'student') {
    return firstName ? `Student ${firstName}` : 'Student';
  }
  if (role === 'frontdesk') {
    return firstName ? `Front Desk ${firstName}` : 'Front Desk';
  }

  return firstName || 'User';
}
