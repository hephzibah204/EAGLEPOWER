import test from 'node:test';
import assert from 'node:assert/strict';
import { logSafeError, sanitizeAuditDetails } from '../src/middleware/safeLogging.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

process.env.DB_PATH = ':memory:';
const { default: db } = await import('../src/config/db.js');
const { logAudit } = await import('../src/middleware/audit.js');
const { threatDefense } = await import('../src/middleware/threatDefense.js');

test('production diagnostics exclude messages, stacks and nested provider payloads', () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  const logs = [];
  const original = console.error;
  console.error = (...args) => logs.push(args);
  try {
    const error = Object.assign(new Error('secret@example.test password=private'), {
      code: 'ECONNRESET', response: { token: 'private-token' }
    });
    logSafeError('Provider failed', error);
    assert.deepEqual(logs, [['Provider failed', { category: 'Error', code: 'ECONNRESET' }]]);
    const res = { status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } };
    error.status = 'not-a-status';
    errorHandler(error, {}, res, () => {});
    assert.equal(res.statusCode, 500);
    assert.ok(!JSON.stringify(res.body).includes('secret@example.test'));
  } finally {
    console.error = original;
    if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous;
  }
});

test('audit details drop freeform PII and credential fields while keeping numeric metadata', () => {
  assert.deepEqual(sanitizeAuditDetails({ email: 'private@example.test', count: 3, nested: { token: 'secret', note: 'Student Name' } }), {
    email: '[REDACTED]', count: 3, nested: { token: '[REDACTED]', note: '[REDACTED]' }
  });
  logAudit(null, 'TEST_EVENT', 'SECURITY', 'Private Student private@example.test', '127.0.0.1');
  const entry = db.prepare('SELECT details FROM audit_logs WHERE action = ?').get('TEST_EVENT');
  assert.equal(entry.details, '[REDACTED]');
});

test('malformed encoded URLs are rejected without exceptions or query logging', () => {
  const response = () => ({ status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
  const res = response();
  threatDefense({ ip: '127.0.0.1', originalUrl: '/api/%E0%A4%A', query: {} }, res, () => assert.fail('Malformed URL passed through'));
  assert.equal(res.statusCode, 400);
  const blocked = response();
  threatDefense({ ip: '127.0.0.1', originalUrl: '/.env?token=private-secret', query: { token: 'private-secret' } }, blocked, () => assert.fail('Probe passed through'));
  assert.equal(blocked.statusCode, 403);
  const entry = db.prepare('SELECT details FROM audit_logs WHERE action = ? ORDER BY id DESC LIMIT 1').get('SECURITY_THREAT_BLOCKED');
  assert.ok(!entry.details.includes('private-secret'));
  assert.ok(!entry.details.includes('/.env'));
});

test.after(() => db.close());
