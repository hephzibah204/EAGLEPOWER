import test from 'node:test';
import assert from 'node:assert/strict';

process.env.DB_PATH = ':memory:';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'isolated-enrollment-test-secret-at-least-32-chars';
const { default: db } = await import('../src/config/db.js');
const { default: jwt } = await import('jsonwebtoken');
const { default: admissions } = await import('../src/routes/admissions.js');
const { default: lessons } = await import('../src/routes/lessonNotes.js');
const { authenticate } = await import('../src/middleware/auth.js');

db.exec(`
  INSERT INTO users (id, username, password_hash, role, full_name, reference_id) VALUES
    (1, 'admin', 'unused', 'admin', 'Admin', NULL),
    (2, 'teacher', 'unused', 'teacher', 'Same Name', 'STAFF-10');
  INSERT INTO staff (id, staff_no, name, role) VALUES
    (2, 'OTHER', 'Same Name', 'Teacher'), (10, 'STAFF-10', 'Same Name', 'Teacher');
  INSERT INTO classes (id, name, division, termly_tuition) VALUES (1, 'Primary 1', 'Primary', 50000);
  INSERT INTO subjects (id, name, code, division) VALUES (1, 'Math', 'MATH', 'Primary');
  INSERT INTO lesson_notes (id, teacher_id, teacher_name, class_id, subject_id, week_number, topic, status)
    VALUES (1, 2, 'Same Name', 1, 1, '1', 'Private draft', 'Draft'),
           (2, 10, 'Same Name', 1, 1, '1', 'Own draft', 'Draft');
  UPDATE system_settings SET current_session = '2026/2027', current_term = 'First Term' WHERE id = 1;
`);

function request(router, path, method, user, body = {}) {
  const layer = router.stack.find(layer => layer.route?.methods[method.toLowerCase()] && layer.match(path));
  assert.ok(layer);
  return new Promise((resolve, reject) => {
    const req = { method, params: layer.params, query: {}, body, ip: '127.0.0.1', headers: {
      authorization: `Bearer ${jwt.sign({ id: user }, process.env.JWT_SECRET)}`
    } };
    const res = { statusCode: 200, status(n) { this.statusCode = n; return this; }, json(body) { resolve({ status: this.statusCode, body }); } };
    layer.route.dispatch(req, res, error => reject(error || new Error('No response')));
  });
}

test('lesson ownership uses linked staff identity, never coinciding login IDs or names', async () => {
  assert.equal((await request(lessons, '/1', 'GET', 2)).status, 403);
  assert.equal((await request(lessons, '/1', 'PUT', 2, { topic: 'Overwrite' })).status, 403);
  assert.equal((await request(lessons, '/1', 'DELETE', 2)).status, 403);
  assert.equal((await request(lessons, '/2', 'GET', 2)).status, 200);
});

test('password token version changes revoke previously issued sessions', () => {
  const req = { headers: { authorization: `Bearer ${jwt.sign({ id: 2, token_version: 0 }, process.env.JWT_SECRET)}` } };
  db.prepare('UPDATE users SET token_version = 1 WHERE id = 2').run();
  let status;
  authenticate(req, { status(n) { status = n; return this; }, json() {} }, () => assert.fail('Revoked token accepted'));
  assert.equal(status, 401);
  db.prepare('UPDATE users SET token_version = 0 WHERE id = 2').run();
});

test('admissions reject unknown classes atomically and enroll into configured academic period', async () => {
  const payload = { student_name: 'Test Child', gender: 'Male', applying_class: 'Unknown', parent_name: 'Test Parent', parent_phone: '08012345678' };
  const applied = await request(admissions, '/apply', 'POST', 1, payload);
  assert.equal(applied.status, 201);
  assert.match(applied.body.application.application_no, /^ADM-\d{4}-[a-f0-9]{32}$/);
  const application = db.prepare('SELECT id FROM admissions').get();
  assert.equal((await request(admissions, `/${application.id}/status`, 'PATCH', 1, { status: 'Admitted' })).status, 400);
  assert.equal(db.prepare('SELECT status FROM admissions').get().status, 'Under Review');
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM students').get().n, 0);
  db.prepare("UPDATE admissions SET applying_class = 'Primary 1'").run();
  const enrolled = await request(admissions, `/${application.id}/status`, 'PATCH', 1, { status: 'Admitted' });
  assert.equal(enrolled.status, 200);
  assert.equal(db.prepare('SELECT enrolled_session FROM students').get().enrolled_session, '2026/2027');
  assert.equal(db.prepare('SELECT session FROM invoices').get().session, '2026/2027');
  assert.equal((await request(admissions, `/${application.id}/status`, 'PATCH', 1, { status: 'Admitted' })).status, 200);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM students').get().n, 1);
});

test.after(() => db.close());
