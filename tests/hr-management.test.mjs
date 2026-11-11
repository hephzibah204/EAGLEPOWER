import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { handleHr, loadHr } from '../functions/_lib/hr.js';

function setup() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../migrations/hr/0001_staff.sql', import.meta.url), 'utf8'));
  const db = {
    prepare(sql) {
      const stmt = sqlite.prepare(sql);
      const wrap = args => ({
        bind: (...values) => wrap(values),
        all: async () => ({ results: stmt.all(...args) }),
        first: async () => stmt.get(...args) || null,
        run: async () => stmt.run(...args),
      });
      return wrap([]);
    },
    async batch(statements) { sqlite.exec('BEGIN'); try { const results = []; for (const stmt of statements) results.push(await stmt.run()); sqlite.exec('COMMIT'); return results; } catch (e) { sqlite.exec('ROLLBACK'); throw e; } },
  };
  const baseline = {
    staff: [{ id: 1, staff_no: 'STF-1', name: 'Test Teacher', role: 'Teacher', is_active: 1, phone: '08000000001' }],
    users: [{ id: 1, username: 'director', role: 'superadmin', full_name: 'Director', is_active: 1 }, { id: 2, username: 'testteacher', role: 'teacher', reference_id: 'STF-1', is_active: 1 }],
  };
  const legacy = async ({ request }, data) => {
    if (new URL(request.url).pathname === '/api/auth/login') {
      const body = await request.json();
      const user = data.users.find(u => u.username === body.username);
      return user && body.password === 'legacy-test-password' ? Response.json({ success: true, user }) : Response.json({ success: false }, { status: 401 });
    }
    return Response.json({ success: true });
  };
  const call = (path, { token, method = 'GET', body, headers = {} } = {}) => handleHr({ env: { HR_DB: db }, request: new Request(`https://portal.test/api${path}`, { method, headers: { ...(token ? { cookie: token } : {}), ...(body ? { 'content-type': 'application/json', 'x-eagle-request': '1' } : {}), ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) }) }, baseline, legacy);
  const login = async (username = 'director', password = 'legacy-test-password') => {
    const response = await call('/auth/login', { method: 'POST', body: { username, password } });
    assert.equal(response.status, 200);
    return response.headers.get('set-cookie').split(';')[0];
  };
  return { db, baseline, call, login };
}

test('HR requires a real admin session, rejects forged tokens and cross-origin changes', async () => {
  const { call, login } = setup();
  assert.equal((await call('/staff/management')).status, 401);
  assert.equal((await call('/staff/management', { token: 'eagle_session=eagle_root_exec_fake' })).status, 401);
  const teacher = await login('testteacher');
  assert.equal((await call('/staff/management', { token: teacher })).status, 403);
  const admin = await login();
  assert.equal((await call('/staff/management/1', { method: 'PUT', token: admin, body: { name: 'New Name' }, headers: { origin: 'https://attacker.test' } })).status, 403);
});

test('staff edits persist across requests and create an audit record', async () => {
  const { call, login, db, baseline } = setup();
  const token = await login();
  const response = await call('/staff/management/1', { method: 'PUT', token, body: { name: 'Updated Teacher', employment_type: 'Contract', phone: '08000000002', assigned_class: 'Primary 4' } });
  assert.equal(response.status, 200);
  const { data } = await loadHr(db, baseline);
  assert.equal(data.staff[0].name, 'Updated Teacher');
  assert.equal(data.staff[0].employment_type, 'Contract');
  assert.equal(data.users[1].full_name, 'Updated Teacher');
  const audit = await (await call('/staff/management/audit', { token })).json();
  assert.equal(audit.data.length, 1);
  assert.equal(audit.data[0].actor_name, 'Director');
});

test('password reset revokes sessions, changes login and stores only a salted hash', async () => {
  const { call, login, db } = setup();
  const token = await login();
  const oldSession = await login('testteacher');
  const password = 'New-test-password-2026';
  const response = await call('/staff/management/1/portal-access', { method: 'PUT', token, body: { username: 'newteacher', portal_role: 'teacher', user_active: 1, password } });
  assert.equal(response.status, 200);
  assert.ok(!(await response.text()).includes(password));
  const stored = await db.prepare('SELECT credential_json FROM hr_staff WHERE id = ?').bind('1').first();
  assert.ok(!stored.credential_json.includes(password));
  assert.equal(JSON.parse(stored.credential_json).hash.length, 64);
  assert.equal((await call('/auth/me', { token: oldSession })).status, 401);
  assert.equal((await call('/auth/login', { method: 'POST', body: { username: 'newteacher', password: 'legacy-test-password' } })).status, 401);
  const newSession = await login('newteacher', password);
  const me = await (await call('/auth/me', { token: newSession })).json();
  assert.equal(me.user.username, 'newteacher');
  assert.equal(me.user.role, 'teacher');
});

test('duplicate usernames, privilege escalation and short passwords are rejected', async () => {
  const { call, login } = setup();
  const token = await login();
  const base = { method: 'PUT', token };
  assert.equal((await call('/staff/management/1/portal-access', { ...base, body: { username: 'director', password: 'Strong-test-password' } })).status, 409);
  assert.equal((await call('/staff/management/1/portal-access', { ...base, body: { username: 'testteacher', portal_role: 'superadmin' } })).status, 400);
  assert.equal((await call('/staff/management/1/portal-access', { ...base, body: { username: 'testteacher', password: 'short' } })).status, 400);
});

test('inactive employment disables login; onboarding saves a new employee and account', async () => {
  const { call, login } = setup();
  const token = await login();
  assert.equal((await call('/staff/management/1', { method: 'PUT', token, body: { is_active: 0 } })).status, 200);
  assert.equal((await call('/auth/login', { method: 'POST', body: { username: 'testteacher', password: 'legacy-test-password' } })).status, 403);
  const created = await call('/staff/management', { method: 'POST', token, body: { name: 'New Employee', role: 'Bursar', employment_type: 'Full time', username: 'newbursar', password: 'New-staff-password', portal_role: 'bursar', create_portal_account: true } });
  assert.equal(created.status, 201);
  const result = await (await call('/staff/management', { token })).json();
  assert.equal(result.data.length, 2);
  assert.equal(result.data[1].username, 'newbursar');
  await login('newbursar', 'New-staff-password');
});
