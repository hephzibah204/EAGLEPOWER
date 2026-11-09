import test from 'node:test';
import assert from 'node:assert/strict';
process.env.DB_PATH = ':memory:';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'cookie-session-isolated-test-secret-at-least-32';
process.env.CORS_ORIGIN = 'https://school.example';
const { default: bcrypt } = await import('bcryptjs');
const { default: express } = await import('express');
const { default: jwt } = await import('jsonwebtoken');
const { default: db } = await import('../src/config/db.js');
const { default: auth } = await import('../src/routes/auth.js');
const { setSessionCookie } = await import('../src/middleware/session.js');

test('persistent browser sessions and CSRF protection', async () => {
  db.prepare('INSERT INTO users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)')
    .run('cookie-admin', bcrypt.hashSync('Password123', 4), 'admin', 'Cookie Admin');
  db.prepare('INSERT INTO users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)')
    .run('cookie-root', bcrypt.hashSync('Password123', 4), 'superadmin', 'Cookie Root');
  async function request(path, { cookie, body, origin = 'https://school.example', header = true, bearer } = {}) {
    const headers = { host: 'localhost:5050' };
    if (origin) headers.origin = origin;
    if (header) headers['x-eagle-request'] = '1';
    if (cookie) headers.cookie = cookie;
    if (bearer) headers.authorization = `Bearer ${bearer}`;
    const method = body ? 'POST' : 'GET';
    const layer = auth.stack.find(layer => layer.route?.path === path && layer.route.methods[method.toLowerCase()]);
    assert.ok(layer);
    return new Promise((resolve, reject) => {
      const req = { method, headers, protocol: 'https', body: body || {}, ip: '127.0.0.1', get(name) { return headers[name.toLowerCase()]; } };
      const result = { status: 200, cookie: null, cache: null };
      const res = {
        status(code) { result.status = code; return this; },
        set(name, value) { if (name === 'Cache-Control') result.cache = value; return this; },
        cookie(name, value, options) { result.cookie = `${name}=${value}; Path=${options.path}; Max-Age=${options.maxAge / 1000}; HttpOnly; SameSite=Lax`; return this; },
        clearCookie(name) { result.cookie = `${name}=; Expires=Thu, 01 Jan 1970`; return this; },
        json(value) { result.body = value; resolve(result); return this; }
      };
      layer.route.dispatch(req, res, error => reject(error || new Error('No response')));
    });
  }  const credentials = { username: 'cookie-admin', password: 'Password123' };
  assert.equal((await request('/login', { body: credentials, header: false })).status, 403);
  assert.equal((await request('/login', { body: credentials, origin: null })).status, 403);
  assert.equal((await request('/login', { body: credentials, origin: 'https://evil.example' })).status, 403);
  assert.equal((await request('/login', { body: credentials, origin: 'http://127.0.0.1:4174' })).status, 200);
  assert.equal((await request('/login', { body: credentials, origin: 'http://localhost:4174' })).status, 200);
  const login = await request('/login', { body: credentials });
  assert.equal(login.status, 200);
  assert.equal(login.body.session, true);
  assert.equal(login.body.token, undefined);
  assert.match(login.cookie, /HttpOnly/);
  assert.match(login.cookie, /SameSite=Lax/);
  assert.match(login.cookie, /Path=\/api/);
  assert.match(login.cookie, /Max-Age=604800/);
  const cookie = login.cookie.split(';')[0];
  const refreshed = await request('/me', { cookie });
  assert.equal(refreshed.status, 200);
  assert.equal(refreshed.body.user.username, 'cookie-admin');
  assert.equal(refreshed.cache, 'no-store');
  assert.equal((await request('/change-password', { cookie, body: {}, origin: 'https://evil.example' })).status, 403);
  assert.equal((await request('/change-password', { cookie, body: {}, origin: null })).status, 403);
  assert.equal((await request('/logout', { cookie, body: {}, header: false })).status, 403);
  const provisioned = await request('/register', { cookie, body: { username: 'newteacher', password: 'Teacher123', role: 'teacher', full_name: 'New Teacher' } });
  assert.equal(provisioned.status, 201);
  assert.equal(provisioned.cookie, null);
  assert.equal(provisioned.body.token, undefined);
  assert.equal((await request('/me', { cookie })).body.user.username, 'cookie-admin');
  const logout = await request('/logout', { cookie, body: {} });
  assert.equal(logout.status, 200);
  assert.match(logout.cookie, /Expires=Thu, 01 Jan 1970/);
  assert.equal((await request('/me', { cookie })).status, 401);
  const expired = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: -1 });
  assert.equal((await request('/me', { cookie: `eagle_session=${expired}` })).status, 401);
  assert.equal((await request('/logout', { cookie: `eagle_session=${expired}`, body: {} })).status, 200);
  const nextLogin = await request('/login', { body: credentials });
  const nextCookie = nextLogin.cookie.split(';')[0];
  const changed = await request('/change-password', { cookie: nextCookie, body: { old_password: 'Password123', new_password: 'Updated123' } });
  assert.equal(changed.status, 200);
  assert.match(changed.cookie, /Expires=Thu, 01 Jan 1970/);
  assert.equal((await request('/me', { cookie: nextCookie })).status, 401);
  const executive = await request('/executive-login', { body: { username: 'cookie-root', password: 'Password123' } });
  assert.equal(executive.status, 200);
  assert.match(executive.cookie, /Max-Age=86400/);
  assert.equal(executive.body.token, undefined);
  const version = db.prepare('SELECT token_version FROM users WHERE id = 1').get().token_version;
  assert.equal((await request('/me', { bearer: jwt.sign({ id: 1, token_version: version }, process.env.JWT_SECRET) })).status, 200);
  process.env.NODE_ENV = 'production';
  assert.equal((await request('/login', { body: credentials, origin: 'http://127.0.0.1:4174' })).status, 403);
  assert.equal((await request('/login', { body: credentials, origin: 'http://localhost:4174' })).status, 403);
  let options;
  setSessionCookie({ cookie(_name, _token, value) { options = value; }, set() {} }, 'test', 123);
  assert.equal(options.secure, true);
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, 'lax');
  assert.equal(options.path, '/api');
  process.env.NODE_ENV = 'test';
});

test('HTTP cookies persist through refresh and are revoked on logout', async t => {
  db.prepare('INSERT INTO users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)')
    .run('http-session-user', bcrypt.hashSync('Password123', 4), 'admin', 'HTTP Session User');
  const app = express();
  app.use(express.json());
  app.use('/api/auth', auth);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  t.after(() => new Promise(resolve => {
    server.close(resolve);
    server.closeAllConnections();
  }));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const login = await fetch(`${origin}/api/auth/login`, {
    method: 'POST',
    headers: { Origin: origin, 'X-Eagle-Request': '1', 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'http-session-user', password: 'Password123' })
  });
  assert.equal(login.status, 200);
  const loginBody = await login.json();
  assert.equal(loginBody.session, true);
  assert.equal(loginBody.token, undefined);
  const serialized = login.headers.get('set-cookie');
  assert.match(serialized, /eagle_session=/);
  assert.match(serialized, /HttpOnly/);
  assert.match(serialized, /SameSite=Lax/);
  assert.match(serialized, /Path=\/api/);
  assert.match(serialized, /Max-Age=604800/);
  const cookie = serialized.split(';')[0];
  const refreshed = await fetch(`${origin}/api/auth/me`, { headers: { Cookie: cookie } });
  assert.equal(refreshed.status, 200);
  assert.equal(refreshed.headers.get('cache-control'), 'no-store');
  assert.equal((await refreshed.json()).user.username, 'http-session-user');
  const logout = await fetch(`${origin}/api/auth/logout`, {
    method: 'POST', headers: { Cookie: cookie, Origin: origin, 'X-Eagle-Request': '1' }
  });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
  await logout.json();
  const revoked = await fetch(`${origin}/api/auth/me`, { headers: { Cookie: cookie } });
  assert.equal(revoked.status, 401);
  await revoked.json();
  const expired = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: -1 });
  const expiredLogout = await fetch(`${origin}/api/auth/logout`, {
    method: 'POST', headers: { Cookie: `eagle_session=${expired}`, Origin: origin, 'X-Eagle-Request': '1' }
  });
  assert.equal(expiredLogout.status, 200);
  assert.match(expiredLogout.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
  await expiredLogout.json();
});

