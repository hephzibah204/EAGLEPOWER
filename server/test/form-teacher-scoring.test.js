import test from 'node:test';
import assert from 'node:assert/strict';
process.env.DB_PATH = ':memory:';
process.env.NODE_ENV = 'test';
const { default: db } = await import('../src/config/db.js');
const { assertTeacherCanGrade } = await import('../src/utils/teacherPermissions.js');
const { isFormTeacherOfClass, getAllowedSubjectsForClass } = await import('../../src/utils/teacherPermissions.js');
const { canTeacherAccessWholeClass } = await import('../src/middleware/academicAccess.js');
db.exec("INSERT INTO subjects (id,name,code,division) VALUES (1,'Mathematics','MTH','Senior College'),(2,'English','ENG','Senior College')");
test('form teachers can score every subject with either an explicit class link or form responsibility', () => {
  const names = ['JSS1','JSS 2','JSS3','SS1','SS 2','SS3','Primary 1','Nursery 1','Pre-Nursery','Creche'];
  for (let index = 0; index < names.length; index++) {
    const id = index + 1;
    db.prepare('INSERT INTO staff (id,staff_no,name,role,form_responsibility) VALUES (?,?,?,?,?)').run(id,'STAFF'+id,'Teacher '+id,'Teacher','Class Teacher, '+names[index]);
    db.prepare('INSERT INTO classes (id,name,division) VALUES (?,?,?)').run(id,names[index],'Senior College');
    const user = {role:'teacher',reference_id:'STAFF'+id,staff:{id,form_responsibility:'Class Teacher, '+names[index]}};
    const cls = {id,name:names[index]};
    assert.equal(isFormTeacherOfClass(user,cls),true,names[index]);
    assert.equal(getAllowedSubjectsForClass(user,cls,[{id:1,name:'Mathematics'},{id:2,name:'English'}]).length,2);
    assert.equal(canTeacherAccessWholeClass(user,id),true,names[index]);
    for (const subject of [1,2]) assert.equal(assertTeacherCanGrade(user,id,subject),true,names[index]);
  }
  assert.throws(() => assertTeacherCanGrade({role:'teacher',reference_id:'STAFF1'},4,1));
  assert.equal(isFormTeacherOfClass({role:'teacher',staff:{id:1,form_responsibility:'JSS1'}},{id:4,name:'SS1'}),false);
  db.prepare('UPDATE classes SET class_teacher_id=1 WHERE id=1').run();
  db.prepare("UPDATE staff SET form_responsibility='' WHERE id=1").run();
  assert.equal(assertTeacherCanGrade({role:'teacher',reference_id:'STAFF1'},1,2),true);
});
test('an account id is never mistaken for the staff id', () => {
  assert.equal(isFormTeacherOfClass({role:'teacher',id:99,reference_id:'OTHER'},{id:1,name:'Unassigned',class_teacher_id:99}),false);
});
test.after(() => db.close());
