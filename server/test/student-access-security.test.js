import test from 'node:test';
import assert from 'node:assert/strict';

process.env.DB_PATH = ':memory:';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'isolated-student-access-test-secret-at-least-32-chars';
const { default: db } = await import('../src/config/db.js');
const { default: jwt } = await import('jsonwebtoken');
const { default: attendance } = await import('../src/routes/attendance.js');
const { default: homework } = await import('../src/routes/homework.js');
const { default: progress } = await import('../src/routes/progress.js');

db.exec(`
  INSERT INTO users (id, username, password_hash, role, full_name, reference_id) VALUES
    (1, 'parent', 'unused', 'parent', 'Parent', 'CHILD-1'),
    (2, 'student', 'unused', 'student', 'Student', 'CHILD-1'),
    (3, 'teacher', 'unused', 'teacher', 'Teacher', 'STAFF-10'),
    (4, 'unlinked', 'unused', 'teacher', 'Unlinked', NULL),
    (5, 'admin', 'unused', 'admin', 'Admin', NULL);
  INSERT INTO classes (id, name, division) VALUES (1, 'Primary 1', 'Primary');
  INSERT INTO subjects (id, name, code, division) VALUES (1, 'Math', 'MATH', 'Primary');
  INSERT INTO staff (id, staff_no, name, role) VALUES
    (10, 'STAFF-10', 'Teacher', 'Teacher'), (11, 'OTHER', 'Other', 'Teacher');
  INSERT INTO students (id, admission_no, first_name, last_name, class_id, guardian_email) VALUES
    (1, 'CHILD-1', 'Own', 'Child', 1, ''), (2, 'CHILD-2', 'Other', 'Child', 1, '');
  INSERT INTO homework_assignments (id, assignment_code, class_id, subject_id, teacher_id, title, description, due_date)
    VALUES (1, 'HW-1', 1, 1, 10, 'Test', 'Test assignment', '2026-10-22');
  INSERT INTO homework_submissions (submission_code, assignment_id, student_id, submitted_by_phone, submission_text)
    VALUES ('SUB-1', 1, 1, '08000000000', 'Own submission'), ('SUB-2', 1, 2, '08000000001', 'Private submission');
`);

function request(router, path, method, user, body = {}, query = {}) {
  const layer = router.stack.find(layer => layer.route?.methods[method.toLowerCase()] && layer.match(path));
  assert.ok(layer);
  return new Promise((resolve, reject) => {
    const req = { method, params: layer.params, query, body, ip: '127.0.0.1', headers: {
      authorization: `Bearer ${jwt.sign({ id: user }, process.env.JWT_SECRET)}`
    } };
    const res = { statusCode: 200, status(n) { this.statusCode = n; return this; }, json(body) { resolve({ status: this.statusCode, body }); } };
    layer.route.dispatch(req, res, error => reject(error || new Error('No response')));
  });
}

test('parents and students cannot obtain class attendance or alter staff attendance', async () => {
  for (const user of [1, 2]) {
    assert.equal((await request(attendance, '/students', 'GET', user, {}, { class_id: '1' })).status, 403);
    for (const path of ['/staff/clockin', '/staff/clockout']) {
      assert.equal((await request(attendance, path, 'POST', user, { staff_id: 10 })).status, 403);
    }
  }
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM staff_attendance').get().n, 0);
});

test('staff attendance requires teachers to use their active linked staff identity', async () => {
  for (const path of ['/staff/clockin', '/staff/clockout']) {
    assert.equal((await request(attendance, path, 'POST', 3, { staff_id: 11 })).status, 403);
    assert.equal((await request(attendance, path, 'POST', 4, { staff_id: 10 })).status, 403);
  }
  assert.equal((await request(attendance, '/staff/clockin', 'POST', 3)).status, 200);
  assert.equal(db.prepare('SELECT staff_id FROM staff_attendance').get().staff_id, 10);
  assert.equal((await request(attendance, '/staff/clockout', 'POST', 3)).status, 200);
  assert.equal((await request(attendance, '/staff/clockin', 'POST', 5, { staff_id: 11 })).status, 200);
  db.prepare('UPDATE staff SET is_active = 0 WHERE id = 10').run();
  assert.equal((await request(attendance, '/staff/clockin', 'POST', 3)).status, 403);
});

test('parents cannot submit homework for an unrelated child', async () => {
  const response = await request(homework, '/1/submit', 'POST', 1, {
    student_id: 2, submitted_by_phone: '08000000000', submission_text: 'Forged answer'
  });
  assert.equal(response.status, 403);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM homework_submissions').get().n, 2);
});

test('blank guardian emails do not expose another family homework or progress', async () => {
  const response = await request(homework, '/1', 'GET', 1);
  assert.deepEqual(response.body.data.submissions.map(submission => submission.student_id), [1]);
  for (const path of ['/student/2', '/student/2/recommendations']) {
    assert.equal((await request(progress, path, 'GET', 1)).status, 403);
  }
});

test('homework creation cannot spoof a staff identity or fall back to an unrelated staff record', async () => {
  const payload = { class_id: 1, subject_id: 1, title: 'Math practice', description: 'Practice addition', due_date: '2026-10-22' };
  db.prepare('UPDATE staff SET is_active = 1 WHERE id = 10').run();
  assert.equal((await request(homework, '/', 'POST', 3, { ...payload, teacher_id: 11 })).status, 403);
  assert.equal((await request(homework, '/', 'POST', 4, payload)).status, 403);
  assert.equal((await request(homework, '/', 'POST', 5, payload)).status, 400);
  assert.equal((await request(homework, '/', 'POST', 5, { ...payload, teacher_id: 999 })).status, 400);
  assert.equal((await request(homework, '/', 'POST', 3, payload)).status, 201);
  assert.equal(db.prepare('SELECT teacher_id FROM homework_assignments ORDER BY id DESC LIMIT 1').get().teacher_id, 10);
});

test.after(() => db.close());
