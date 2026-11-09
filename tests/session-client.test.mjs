import test from 'node:test';
import assert from 'node:assert/strict';

test('refresh restores the cookie session without persisting or transmitting browser tokens', async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const storage = new Map([['eagle_token', 'legacy-secret'], ['token', 'legacy-secret'], ['eagle_user', '{"role":"superadmin"}']]);
  const events = [];
  globalThis.window = {
    location: { hostname: '127.0.0.1', port: '4174', origin: 'http://127.0.0.1:4174' },
    localStorage: { removeItem(key) { storage.delete(key); }, getItem(key) { return storage.get(key); } },
    dispatchEvent(event) { events.push(event.type); },
  };
  try {
    const firstPage = await import('../src/config/api.js?session-first-page');
    assert.equal(storage.size, 0);
    assert.equal(firstPage.getSessionToken(), '');
    globalThis.fetch = async (_url, init) => {
      assert.equal(init.credentials, 'include');
      assert.equal(init.headers.get('x-eagle-request'), '1');
      assert.equal(init.headers.get('authorization'), null);
      return Response.json({ success: true, session: true, user: { id: 42, role: 'parent' } });
    };
    const login = await firstPage.apiFetch(`${firstPage.getApiBase()}/auth/login`, {
      method: 'POST', headers: { Authorization: `Bearer ${firstPage.COOKIE_SESSION}`, 'Content-Type': 'application/json' },
      body: '{}',
    });
    assert.equal((await login.json()).session, true);
    firstPage.setSessionToken(firstPage.COOKIE_SESSION);
    assert.equal(storage.size, 0);

    // A fresh module models a reload: there is no credential or cached profile to recover locally.
    const refreshedPage = await import('../src/config/api.js?session-refreshed-page');
    assert.equal(refreshedPage.getSessionToken(), '');
    globalThis.fetch = async (url, init) => {
      assert.equal(url, 'http://127.0.0.1:4174/api/auth/me');
      assert.equal(init.credentials, 'include');
      assert.equal(init.cache, 'no-store');
      assert.equal(init.headers.get('authorization'), null);
      return Response.json({ success: true, user: { id: 42, role: 'parent' } });
    };
    assert.deepEqual(await refreshedPage.restoreSession(), { id: 42, role: 'parent' });
    refreshedPage.setSessionToken(refreshedPage.COOKIE_SESSION);
    globalThis.fetch = async () => Response.json({ success: false }, { status: 401 });
    assert.equal(await refreshedPage.restoreSession(), null);
    assert.equal(refreshedPage.getSessionToken(), '');
    assert.deepEqual(events, ['eagle-session-expired']);
    globalThis.fetch = async () => Response.json({ success: false }, { status: 503 });
    await assert.rejects(refreshedPage.restoreSession(), /Unable to restore/);

    window.localStorage = { removeItem() { throw new Error('Storage disabled'); } };
    refreshedPage.setSessionToken(refreshedPage.COOKIE_SESSION);
    assert.equal(refreshedPage.getSessionToken(), refreshedPage.COOKIE_SESSION);
    refreshedPage.setSessionToken('a-real-token-must-not-be-stored');
    assert.equal(refreshedPage.getSessionToken(), '');
  } finally {
    globalThis.fetch = originalFetch;
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});
