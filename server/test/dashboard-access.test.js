import test from 'node:test';
import assert from 'node:assert/strict';
process.env.DB_PATH = ':memory:';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'dashboard-access-isolated-test-secret-long-enough';
const { default: db } = await import('../src/config/db.js');
const { default: jwt } = await import('jsonwebtoken');
const routers = {};
for (const name of ['frontdesk', 'staff', 'exams', 'attendance', 'students', 'lessonNotes', 'reports', 'finance', 'payroll', 'homework']) routers[name] = (await import(`../src/routes/${name}.js`)).default;
db.exec(`
  INSERT INTO users (id, username, password_hash, role, full_name, reference_id) VALUES
  (1, 'teacher', 'unused', 'teacher', 'Teacher', 'STAFF-1'),
  (2, 'bursar', 'unused', 'bursar', 'Bursar', NULL),
  (3, 'admin', 'unused', 'admin', 'Admin', NULL),
  (4, 'parent', 'unused', 'parent', 'Parent', 'CHILD-1'),
  (5, 'student', 'unused', 'student', 'Student', 'CHILD-1');
  INSERT INTO staff (id, staff_no, name, role, phone) VALUES (1, 'STAFF-1', 'Teacher', 'Teacher', 'private'), (2, 'STAFF-2', 'Other', 'Teacher', 'secret');
  INSERT INTO classes (id, name, division, class_teacher_id) VALUES (1, 'Primary 1', 'Primary', 1), (2, 'Primary 2', 'Primary', 2);
  INSERT INTO subjects (id, name, code, division) VALUES (1, 'Math', 'MTH', 'Primary');
  INSERT INTO students (id, admission_no, first_name, last_name, class_id) VALUES (1, 'CHILD-1', 'Own', 'Child', 1), (2, 'CHILD-2', 'Other', 'Child', 2);
  INSERT INTO homework_assignments (id, assignment_code, class_id, subject_id, teacher_id, title, description, due_date) VALUES
  (1, 'HW-1', 1, 1, 1, 'Own class', 'Practice', '2026-11-01'),
  (2, 'HW-2', 2, 1, 2, 'Other class', 'Practice', '2026-11-01');
`);
function request(name, path, user, method = 'GET', query = {}, body = {}) {
  const layer = routers[name].stack.find(l => l.route?.methods[method.toLowerCase()] && l.match(path));
  assert.ok(layer, path);
  return new Promise((resolve, reject) => {
    const req = { method, params: layer.params, query, body, ip: '127.0.0.1', headers: { authorization: `Bearer ${jwt.sign({ id: user }, process.env.JWT_SECRET)}` } };
    const res = { statusCode: 200, status(n) { this.statusCode = n; return this; }, json(body) { resolve({status: this.statusCode, body}); } };
    layer.route.dispatch(req, res, err => reject(err || new Error('No response')));
  });
}
test('teachers and families cannot read reception, finance summaries, or payroll rosters', async () => {
  for (const user of [1, 4, 5]) for (const [route, path] of [['frontdesk', '/visitors'], ['finance', '/stats'], ['payroll', '/staff-roster'], ['reports', '/executive-summary']]) {
    assert.equal((await request(route, path, user)).status, 403, `${user}: ${route}`);
  }
  assert.equal((await request('finance', '/stats', 2)).status, 200);
  assert.equal((await request('frontdesk', '/visitors', 3)).status, 200);
});
test('bursars cannot inspect lessons or front desk records', async () => {
  assert.equal((await request('lessonNotes', '/', 2)).status, 403);
  assert.equal((await request('frontdesk', '/visitors', 2)).status, 403);
});
test('staff directory and ID cards do not expose other staff personal information', async () => {
  const response = await request('staff', '/', 1);
  assert.equal(response.status, 200);
  assert.equal(response.body.data[1].phone, undefined);
  assert.equal((await request('staff', '/2/id-card', 1)).status, 403);
  assert.equal((await request('staff', '/1/id-card', 1)).status, 200);
});
test('teachers can access their class but not another class through direct API requests', async () => {
  assert.equal((await request('attendance', '/students', 1, 'GET', {class_id: '1'})).status, 200);
  assert.equal((await request('attendance', '/students', 1, 'GET', {class_id: '2'})).status, 403);
  assert.equal((await request('exams', '/class-sheet', 1, 'GET', {class_id: '2', subject_id: '1'})).status, 403);
  assert.equal((await request('students', '/lookup/CHILD-2', 1)).status, 403);
  assert.deepEqual((await request('students', '/', 1)).body.data.map(s => s.id), [1]);
  assert.equal((await request('attendance', '/students/batch', 1, 'POST', {}, {class_id: 1, records: [{student_id: 2, status: 'Present'}]})).status, 403);
});
test('homework lists and direct links stay within the teacher or family class', async () => {
  for (const user of [1, 4, 5]) {
    assert.deepEqual((await request('homework', '/', user)).body.data.map(a => a.id), [1]);
    assert.equal((await request('homework', '/1', user)).status, 200);
    assert.equal((await request('homework', '/2', user)).status, 403);
  }
});
test.after(() => db.close());
