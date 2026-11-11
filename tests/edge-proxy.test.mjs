import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/api/[[catchall]].js';
import dbData from '../src/data/portalDbData.json' with { type: 'json' };

test('student class filter applies before pagination and counts only that class', async () => {
  const classId = dbData.students[0].class_id;
  const expected = dbData.students.filter(student => String(student.class_id) === String(classId));
  assert.ok(expected.length > 2);
  for (const page of [1, 2]) {
    const response = await onRequest({ request: new Request(`https://portal.test/api/students?class_id=${classId}&page=${page}&limit=2`) });
    const result = await response.json();
    assert.equal(result.total, expected.length);
    assert.deepEqual(result.data.map(student => student.id), expected.slice((page - 1) * 2, page * 2).map(student => student.id));
    assert.ok(result.data.every(student => String(student.class_id) === String(classId)));
  }
});

test('student filter returns empty results for unknown classes and combines search with class', async () => {
  const empty = await onRequest({ request: new Request('https://portal.test/api/students?class_id=nonexistent&page=1&limit=25') });
  assert.deepEqual(await empty.json(), { success: true, total: 0, page: 1, limit: 25, data: [] });
  const student = dbData.students[0];
  const params = new URLSearchParams({ class_id: String(student.class_id), q: student.admission_no, page: '1', limit: '25' });
  const response = await onRequest({ request: new Request(`https://portal.test/api/students?${params}`) });
  const result = await response.json();
  assert.equal(result.total, 1);
  assert.equal(result.data[0].id, student.id);
});

test('unpaginated student roster remains complete and status filter runs before counting', async () => {
  const response = await onRequest({ request: new Request('https://portal.test/api/students') });
  assert.equal((await response.json()).data.length, dbData.students.length);
  const inactive = await onRequest({ request: new Request('https://portal.test/api/students?status=inactive&page=1&limit=25') });
  const result = await inactive.json();
  assert.equal(result.total, dbData.students.filter(student => Number(student.is_active) === 0).length);
  assert.ok(result.data.every(student => Number(student.is_active) === 0));
});

test('edge API refuses invalid, unsafe, and recursive proxy origins', async () => {
  for (const API_ORIGIN of ['http://backend.test', 'https://portal.test', 'https://user:pass@backend.test', 'https://backend.test/api']) {
    const response = await onRequest({ request: new Request('https://portal.test/api/students'), env: { API_ORIGIN } });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
});

test('edge provides autonomous fallback when external backend is not configured', async () => {
  for (const path of ['health', 'students', 'staff']) {
    const response = await onRequest({ request: new Request('https://portal.test/api/' + path) });
    assert.equal(response.status, 200);
  }
  const unauth = await onRequest({ request: new Request('https://portal.test/api/auth/me') });
  assert.equal(unauth.status, 401);
});

test('edge forwards authenticated mutations and returns actual origin errors', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, init) => {
      assert.equal(String(url), 'https://backend.test/api/students?class=1');
      assert.equal(init.headers.get('authorization'), 'Bearer signed-token');
      assert.equal(init.headers.get('x-forwarded-for'), null);
      assert.equal(init.redirect, 'manual');
      assert.equal(new TextDecoder().decode(init.body), '{"name":"Example"}');
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    };
    const response = await onRequest({
      request: new Request('https://portal.test/api/students?class=1', {
        method: 'POST', headers: { authorization: 'Bearer signed-token', 'x-forwarded-for': '127.0.0.1' }, body: '{"name":"Example"}',
      }), env: { API_ORIGIN: 'https://backend.test' },
    });
    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { error: 'Forbidden' });
  } finally { globalThis.fetch = originalFetch; }
});

test('edge refuses redirects and upstream connection failures', async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const upstream of [() => Response.redirect('https://other.test'), () => { throw new Error('offline'); }]) {
      globalThis.fetch = upstream;
      const response = await onRequest({ request: new Request('https://portal.test/api/auth/login'), env: { API_ORIGIN: 'https://backend.test' } });
      assert.equal(response.status, 502);
    }
  } finally { globalThis.fetch = originalFetch; }
});

test('edge preserves session cookies and CSRF headers across login and refresh', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (_url, init) => {
      assert.equal(init.headers.get('cookie'), 'eagle_session=existing-session');
      assert.equal(init.headers.get('origin'), 'https://portal.test');
      assert.equal(init.headers.get('x-eagle-request'), '1');
      const response = Response.json({ success: true, session: true });
      response.headers.append('Set-Cookie', 'eagle_session=new-session; Path=/api; HttpOnly; Secure; SameSite=Lax');
      response.headers.append('Set-Cookie', 'other=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/api');
      return response;
    };
    const response = await onRequest({
      request: new Request('https://portal.test/api/auth/login', {
        method: 'POST', headers: { cookie: 'eagle_session=existing-session', origin: 'https://portal.test', 'x-eagle-request': '1' },
        body: '{}',
      }), env: { API_ORIGIN: 'https://backend.test' },
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.getSetCookie().length, 2);
    assert.match(response.headers.getSetCookie()[0], /HttpOnly; Secure; SameSite=Lax/);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  } finally { globalThis.fetch = originalFetch; }
});

test('edge requires valid credentials to mint a session in standalone mode', async () => {
  const response = await onRequest({ request: new Request('https://portal.test/api/auth/login', { method: 'POST', body: '{}' }) });
  assert.equal(response.status, 401);
  assert.equal(response.headers.get('set-cookie'), null);
});
