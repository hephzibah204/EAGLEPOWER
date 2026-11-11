const fields = ['name', 'role', 'email', 'phone', 'qualification', 'assigned_class', 'gender', 'dob', 'date_employed', 'employment_type', 'address', 'emergency_contact_name', 'emergency_contact', 'blood_group', 'form_responsibility'];
const roles = ['teacher', 'admin', 'bursar'];
const reply = (data, status = 200, headers = {}) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
const fail = (message, status = 400) => reply({ success: false, message }, status);
const hex = bytes => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
const tokenFrom = request => request.headers.get('cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith('eagle_session='))?.slice(14) || request.headers.get('authorization')?.replace(/^Bearer /, '') || '';
const digest = async value => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));

const GENERIC_PASSWORDS = ['EagleSuperAdmin2025!', 'EagleAdmin2025!', 'EagleStaff2025!', 'Teacher2025!', 'Bursar2025!', 'Eagle2025!', 'EagleParent2025!'];

// Issues a single-use forced-password-change token (SHA-256-hashed at rest,
// 15-minute expiry) in the edge DB the legacy handler shares.
async function issueChangeToken(env, user) {
  if (!env?.DB) return null;
  try {
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS pwd_change_tokens (token_hash TEXT PRIMARY KEY, username TEXT NOT NULL, expires_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0)').run();
    const token = hex(crypto.getRandomValues(new Uint8Array(32)));
    const key = String(user.username || '').toLowerCase();
    await env.DB.prepare('DELETE FROM pwd_change_tokens WHERE username = ?').bind(key).run();
    await env.DB.prepare('INSERT INTO pwd_change_tokens (token_hash, username, expires_at, attempts) VALUES (?, ?, ?, ?)').bind(await digest(token), key, Date.now() + 15 * 60 * 1000, 0).run();
    return token;
  } catch { return null; }
}

export async function passwordHash(password, salt = hex(crypto.getRandomValues(new Uint8Array(16)))) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256));
  return { salt, hash };
}

function publicUser(user) {
  const safe = { ...user };
  delete safe.password_hash;
  delete safe.password;
  delete safe.credential;
  return safe;
}

export async function loadHr(db, baseline) {
  const data = { ...baseline, staff: baseline.staff.map(s => ({ ...s })), users: baseline.users.map(u => ({ ...u })), classes: (baseline.classes || []).map(c => ({ ...c })) };
  const { results } = await db.prepare('SELECT record_json, user_json, credential_json FROM hr_staff').all();
  const managed = [];
  for (const row of results) {
    const record = JSON.parse(row.record_json);
    const user = row.user_json ? JSON.parse(row.user_json) : null;
    const index = data.staff.findIndex(s => String(s.id) === String(record.id));
    if (index < 0) data.staff.push(record); else data.staff[index] = record;
    if (user) {
      const userIndex = data.users.findIndex(u => String(u.id) === String(user.id));
      if (userIndex < 0) data.users.push(user); else data.users[userIndex] = user;
    }
    managed.push({ record, user, credential: row.credential_json ? JSON.parse(row.credential_json) : null });
  }
  const classKey = name => String(name || '').toUpperCase().replace(/BASIC/g, 'PRIMARY').replace(/[^A-Z0-9]/g, '');
  for (const { record } of managed) {
    const original = baseline.staff.find(s => String(s.id) === String(record.id));
    if (original && original.assigned_class === record.assigned_class && Number(record.is_active) !== 0) continue;
    for (const cls of data.classes) {
      if (String(cls.class_teacher_id) === String(record.id)) cls.class_teacher_id = null;
      if (record.assigned_class && classKey(cls.name) === classKey(record.assigned_class) && Number(record.is_active) !== 0) cls.class_teacher_id = record.id;
    }
  }
  return { data, managed };
}

async function sessionUser(db, request, data) {
  const token = tokenFrom(request);
  if (!token.startsWith('hr_')) return null;
  const session = await db.prepare('SELECT user_json FROM hr_sessions WHERE token_hash = ? AND expires_at > ?').bind(await digest(token), Date.now()).first();
  if (!session) return null;
  const saved = JSON.parse(session.user_json);
  const current = data.users.find(u => String(u.id) === String(saved.id)) || saved;
  if (Number(current.is_active) === 0) return null;
  const staff = data.staff.find(s => s.staff_no === current.reference_id);
  if (staff && Number(staff.is_active) === 0) return null;
  return { ...publicUser(current), ...(staff ? { staff } : {}) };
}

async function mintSession(db, user, request, data) {
  const token = 'hr_' + hex(crypto.getRandomValues(new Uint8Array(32)));
  await db.prepare('INSERT INTO hr_sessions (token_hash, user_id, user_json, expires_at) VALUES (?, ?, ?, ?)')
    .bind(await digest(token), String(user.id), JSON.stringify(publicUser(user)), Date.now() + 7 * 86400000).run();
  const staff = data.staff.find(s => s.staff_no === user.reference_id);
  return reply({ success: true, session: true, user: { ...publicUser(user), ...(staff ? { staff } : {}) } }, 200, {
    'Set-Cookie': `eagle_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`,
  });
}

function roster(data) {
  return data.staff.map(staff => {
    const user = data.users.find(u => u.reference_id === staff.staff_no);
    return { ...staff, username: user?.username || '', user_role: user?.role || '', user_active: user?.is_active ?? 0, has_portal_account: !!user };
  });
}

export async function handleHr(context, baseline, legacy) {
  const { request, env = {} } = context;
  if (env.API_ORIGIN) return legacy(context, baseline);
  const path = new URL(request.url).pathname.replace(/\/$/, '');
  const management = path.startsWith('/api/staff/management');
  const db = env.HR_DB;
  if (!db) return management ? fail('Staff management storage is unavailable. Please contact the administrator.', 503) : legacy(context, baseline);
  const { data, managed } = await loadHr(db, baseline);
  const method = request.method.toUpperCase();
  if (method === 'OPTIONS') return legacy(context, data);
  if (path === '/api/auth/logout') {
    await db.prepare('DELETE FROM hr_sessions WHERE token_hash = ?').bind(await digest(tokenFrom(request))).run();
    return legacy(context, data);
  }
  if (['/api/auth/me', '/api/auth/verify', '/api/auth/refresh'].includes(path) && tokenFrom(request).startsWith('hr_')) {
    const user = await sessionUser(db, request, data);
    return user ? reply({ success: true, session: true, user }) : fail('Your session expired. Sign in again.', 401);
  }
  if (path === '/api/auth/force-change-password' && method === 'POST') {
    if (!env.DB) return legacy(context, data);
    const fbody = await request.clone().json().catch(() => ({}));
    const tokenHash = await digest(String(fbody.change_token || ''));
    let rec = null;
    try { rec = await env.DB.prepare('SELECT username, expires_at, attempts FROM pwd_change_tokens WHERE token_hash = ?').bind(tokenHash).first(); } catch {}
    if (!rec || rec.expires_at <= Date.now() || rec.attempts >= 5) return fail('This password-change session has expired. Sign in again with the default password to restart.', 401);
    const target = data.users.find(u => (u.username || '').toLowerCase() === rec.username);
    if (!target || !['superadmin', 'admin', 'teacher', 'bursar'].includes(target.role)) return fail('This password-change session has expired. Sign in again with the default password to restart.', 401);
    const newPassword = String(fbody.new_password || '');
    const bad = !newPassword || newPassword.length < 8 ? 'New password must be at least 8 characters long.'
      : (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) ? 'New password must contain both letters and numbers.'
      : GENERIC_PASSWORDS.includes(newPassword) ? 'That is one of the default passwords. Choose a new personal password instead.'
      : (newPassword.toLowerCase() === String(target.username || '').toLowerCase() || newPassword === String(target.reference_id || '')) ? 'New password cannot be your username or ID.'
      : null;
    if (bad) {
      try { await env.DB.prepare('UPDATE pwd_change_tokens SET attempts = attempts + 1 WHERE token_hash = ?').bind(tokenHash).run(); } catch {}
      return fail(bad, 400);
    }
    const credential = await passwordHash(newPassword);
    // Persist to the HR credential store when the user has a staff record,
    // and always to the edge credential store the legacy login checks.
    const staffRec = data.staff.find(s => s.staff_no === target.reference_id);
    const existingManaged = managed.find(m => String(m.user?.id) === String(target.id));
    if (staffRec || existingManaged) {
      const record = existingManaged?.record || staffRec;
      const hrUser = existingManaged?.user || target;
      await db.prepare('INSERT INTO hr_staff (id, username, record_json, user_json, credential_json) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET username=excluded.username, record_json=excluded.record_json, user_json=excluded.user_json, credential_json=excluded.credential_json')
        .bind(String(record.id), hrUser.username || null, JSON.stringify(record), JSON.stringify(publicUser(hrUser)), JSON.stringify(credential)).run();
    }
    try {
      await env.DB.prepare('CREATE TABLE IF NOT EXISTS user_credentials (username TEXT PRIMARY KEY, salt TEXT NOT NULL, hash TEXT NOT NULL, updated_at INTEGER NOT NULL)').run();
      await env.DB.prepare('INSERT INTO user_credentials (username, salt, hash, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(username) DO UPDATE SET salt = excluded.salt, hash = excluded.hash, updated_at = excluded.updated_at')
        .bind(String(target.username || '').toLowerCase(), credential.salt, credential.hash, Date.now()).run();
    } catch {}
    try { await env.DB.prepare('DELETE FROM pwd_change_tokens WHERE username = ?').bind(rec.username).run(); } catch {}
    await db.prepare('DELETE FROM hr_sessions WHERE user_id = ?').bind(String(target.id)).run();
    return mintSession(db, target, request, data);
  }
  if (['/api/auth/login', '/api/auth/executive-login'].includes(path) && method === 'POST') {
    const body = await request.clone().json().catch(() => ({}));
    const identifier = String(body.username || body.email || body.phone || body.identifier || '').trim().toLowerCase();
    const match = managed.find(({ record, user }) => user && [user.username, user.email, user.phone, record.phone, record.staff_no].some(v => v && String(v).toLowerCase() === identifier));
    if (match) {
      if (path.endsWith('executive-login') || body.portal_source === 'executive') return fail('Use the staff portal to sign in with this account.', 403);
      if (Number(match.user.is_active) === 0 || Number(match.record.is_active) === 0) return fail('This staff account is inactive. Contact the school administrator.', 403);
      if (match.credential) {
        const attempt = await passwordHash(String(body.password || ''), match.credential.salt);
        if (attempt.hash !== match.credential.hash) return fail('Invalid username or password.', 401);
        if (GENERIC_PASSWORDS.includes(String(body.password || ''))) {
          const changeToken = await issueChangeToken(env, match.user);
          if (changeToken) return reply({ success: true, session: false, must_change_password: true, change_token: changeToken, message: 'You signed in with the default password. Set a new personal password to continue.', user: publicUser(match.user) }, 200);
        }
        return mintSession(db, match.user, request, data);
      }
    }
    const response = await legacy(context, data);
    if (!response.ok) return response;
    const result = await response.clone().json().catch(() => ({}));
    if (result.must_change_password) return response;
    if (result.success && result.user) {
      // A managed password replaces all legacy aliases and default passwords.
      const overridden = managed.find(m => String(m.user?.id) === String(result.user.id));
      if (overridden && (overridden.credential || overridden.user.username !== result.user.username || Number(overridden.user.is_active) === 0 || Number(overridden.record.is_active) === 0)) return fail('Invalid username or password.', 401);
      return mintSession(db, result.user, request, data);
    }
    return response;
  }
  if (path === '/api/staff' && method === 'GET') {
    const user = await sessionUser(db, request, data);
    const records = user && ['admin', 'superadmin'].includes(user.role) ? roster(data) : data.staff
      .filter(s => Number(s.is_active) !== 0)
      .map(({ id, name, role, qualification, assigned_class, photo_url }) => ({ id, name, role, qualification, assigned_class, photo_url }));
    return reply({ success: true, count: records.length, data: records });
  }
  if (!management) {
    if (!tokenFrom(request).startsWith('hr_')) return legacy(context, data);
    const user = await sessionUser(db, request, data);
    if (!user) return fail('Your session expired. Sign in again.', 401);
    // Existing academic routes decode the legacy token internally. Only translate
    // after validating the random, server-stored browser session.
    const internalToken = `eagle_${user.role}_${btoa(`${user.username}:${Date.now()}`)}`;
    const headers = new Headers(request.headers);
    headers.set('authorization', `Bearer ${internalToken}`);
    headers.set('cookie', `eagle_session=${internalToken}`);
    return legacy({ ...context, request: new Request(request, { headers }) }, data);
  }
  const actor = await sessionUser(db, request, data);
  if (!actor) return fail('Please sign out and sign in again to manage staff.', 401);
  if (!['admin', 'superadmin'].includes(actor.role)) return fail('Only school administrators may manage staff.', 403);
  if (method === 'GET' && path === '/api/staff/management') return reply({ success: true, data: roster(data) });
  if (method === 'GET' && path === '/api/staff/management/audit') {
    const { results } = await db.prepare('SELECT actor_name, action, staff_no, created_at FROM hr_audit ORDER BY id DESC LIMIT 50').all();
    return reply({ success: true, data: results });
  }
  if (!['POST', 'PUT'].includes(method)) return fail('Method not allowed.', 405);
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) return fail('Request origin is not allowed.', 403);
  if (request.headers.get('x-eagle-request') !== '1') return fail('Please reload the page and try again.', 403);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return fail('Invalid staff details.');
  const match = path.match(/^\/api\/staff\/management\/(\d+)(\/portal-access)?$/);
  const creating = method === 'POST' && path === '/api/staff/management';
  if (!creating && (!match || method !== 'PUT')) return fail('Staff route not found.', 404);
  const existing = creating ? null : data.staff.find(s => String(s.id) === match[1]);
  if (!creating && !existing) return fail('Staff member not found.', 404);
  const oldUser = existing ? data.users.find(u => u.reference_id === existing.staff_no) : null;
  if (oldUser?.role === 'superadmin') return fail('Director accounts are managed separately.', 403);
  const portalOnly = !!match?.[2];
  const id = creating ? 1000000000 + crypto.getRandomValues(new Uint32Array(1))[0] : existing.id;
  const staff = creating ? { id, staff_no: `EPS-STF-${id}`, is_active: 1 } : { ...existing };
  let user = oldUser ? { ...oldUser } : null;
  const stored = managed.find(m => String(m.record.id) === String(id));
  let credential = stored?.credential || null;
  if (!portalOnly) {
    for (const key of fields) {
      if (body[key] !== undefined) {
        if (typeof body[key] !== 'string' || body[key].length > 2000) return fail(`Invalid ${key.replaceAll('_', ' ')}.`);
        staff[key] = body[key].trim();
      }
    }
    if (!staff.name || staff.name.length < 2 || !staff.role || staff.role.length < 2) return fail('Staff name and designation are required.');
    if (staff.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(staff.email)) return fail('Enter a valid email address.');
    if (body.is_active !== undefined) {
      if (![0, 1].includes(body.is_active)) return fail('Invalid employment status.');
      staff.is_active = body.is_active;
    }
    if (user) Object.assign(user, { full_name: staff.name, email: staff.email, phone: staff.phone });
    if (Number(staff.is_active) === 0 && user) user.is_active = 0;
    if (user && String(actor.id) === String(user.id) && Number(user.is_active) === 0) return fail('You cannot deactivate your own staff account.');
  }
  if (portalOnly || (creating && body.create_portal_account)) {
    const username = String(body.username || '').trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(username)) return fail('Username must be 3–64 letters, numbers, dots, underscores or hyphens.');
    const portalRole = body.portal_role || user?.role || 'teacher';
    if (!roles.includes(portalRole)) return fail('Select a valid staff portal role.');
    if (data.users.some(u => String(u.id) !== String(user?.id) && [u.username, u.email, u.reference_id].some(v => String(v || '').toLowerCase() === username))) return fail('That username is already in use.', 409);
    if (body.password && (typeof body.password !== 'string' || body.password.length < 10 || body.password.length > 128)) return fail('Use a password between 10 and 128 characters.');
    if (!user && !body.password) return fail('Set an initial password for the new portal account.');
    if (body.user_active !== undefined && ![0, 1].includes(body.user_active)) return fail('Invalid portal access status.');
    user = { ...(user || {}), id: user?.id ?? `hr-${id}`, username, role: portalRole, reference_id: staff.staff_no, full_name: staff.name, email: staff.email || '', phone: staff.phone || '', is_active: body.user_active ?? user?.is_active ?? 1 };
    if (Number(staff.is_active) === 0 && Number(user.is_active) === 1) return fail('Reactivate employment before enabling portal access.');
    if (String(actor.id) === String(user.id) && (Number(user.is_active) === 0 || user.role !== actor.role)) return fail('You cannot disable or change the role of your own account.');
    if (body.password) credential = await passwordHash(body.password);
  }
  const action = creating ? 'Staff onboarded' : portalOnly ? 'Portal access updated' : 'Staff record updated';
  const statements = [
    db.prepare('INSERT INTO hr_staff (id, username, record_json, user_json, credential_json) VALUES (?, ?, ?, ?, ?)' + (creating ? '' : ' ON CONFLICT(id) DO UPDATE SET username=excluded.username, record_json=excluded.record_json, user_json=excluded.user_json, credential_json=excluded.credential_json'))
      .bind(String(id), user?.username || null, JSON.stringify(staff), user ? JSON.stringify(publicUser(user)) : null, credential ? JSON.stringify(credential) : null),
    db.prepare('INSERT INTO hr_audit (actor_name, action, staff_no) VALUES (?, ?, ?)').bind(actor.full_name || actor.username, action, staff.staff_no),
  ];
  if (user) statements.push(db.prepare('DELETE FROM hr_sessions WHERE user_id = ?').bind(String(user.id)));
  await db.batch(statements);
  return reply({ success: true, message: `${action} successfully.`, staff }, creating ? 201 : 200);
}
