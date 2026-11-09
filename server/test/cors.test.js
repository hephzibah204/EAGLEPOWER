import test from 'node:test';
import assert from 'node:assert/strict';
import { createCorsOptions } from '../src/config/cors.js';

function check(options, origin) {
  let result;
  options.origin(origin, (error, allowed) => { result = { error, allowed }; });
  return result;
}

test('production CORS accepts only configured exact HTTPS origins', () => {
  const options = createCorsOptions({ NODE_ENV: 'production', CORS_ORIGIN: 'https://eaglepower.pages.dev' });
  assert.equal(check(options, 'https://eaglepower.pages.dev').allowed, true);
  for (const origin of ['https://attacker.pages.dev', 'https://eaglepower.pages.dev.attacker.com', 'http://localhost:3000', 'null']) {
    assert.equal(check(options, origin).error.status, 403);
  }
  assert.equal(check(options, undefined).allowed, true);
  assert.equal(check(createCorsOptions({ NODE_ENV: 'production' }), 'https://eaglepower.pages.dev').error.status, 403);
});

test('wildcards, URL paths and insecure production origins are rejected', () => {
  for (const origin of ['*', 'https://eaglepower.pages.dev/', 'http://eaglepower.pages.dev']) {
    assert.throws(() => createCorsOptions({ NODE_ENV: 'production', CORS_ORIGIN: origin }));
  }
  assert.equal(check(createCorsOptions({ NODE_ENV: 'development' }), 'http://localhost:4174').allowed, true);
});
