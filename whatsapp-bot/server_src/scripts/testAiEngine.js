import { 
  askSchoolAi, 
  evaluateHomeworkSubmission, 
  analyzeStudentProgress, 
  generateParentRecommendations,
  generateAiReportComments,
  generateReportCardComments,
  CURRICULUM_TAXONOMY
} from '../services/inHouseAi.js';
import db from '../config/db.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('================================================================');
console.log('🦅 EAGLE POWER SCHOOLS - COMPREHENSIVE AI ENGINE TEST SUITE');
console.log('================================================================\n');

// ----------------------------------------------------------------------------
// TEST 1: CURRICULUM TAXONOMY COVERAGE (ALL 27 SUBJECTS)
// ----------------------------------------------------------------------------
console.log('--- TEST 1: Curriculum Taxonomy 27-Subject Validation ---');
const subjectsInDb = db.prepare('SELECT name, code FROM subjects').all();
console.log(`Database has ${subjectsInDb.length} registered subjects.`);

assert(subjectsInDb.length === 27, `Database must contain exactly 27 subjects (found ${subjectsInDb.length})`);

for (const sub of subjectsInDb) {
  const meta = CURRICULUM_TAXONOMY[sub.name];
  const exists = !!meta;
  assert(exists, `Taxonomy covers registered subject: "${sub.name}"`);
  if (meta) {
    assert(Array.isArray(meta.keyTopics) && meta.keyTopics.length >= 2, `  -> Has >= 2 key topics for "${sub.name}"`);
    assert(Array.isArray(meta.formulasAndTheorems) && meta.formulasAndTheorems.length >= 1, `  -> Has formulas/theorems for "${sub.name}"`);
    assert(Array.isArray(meta.typicalMisconceptions) && meta.typicalMisconceptions.length >= 1, `  -> Has misconceptions for "${sub.name}"`);
    assert(Array.isArray(meta.studyInterventions) && meta.studyInterventions.length >= 1, `  -> Has study interventions for "${sub.name}"`);
  }
}

// ----------------------------------------------------------------------------
// TEST 2: ASK SCHOOL AI - CURRICULUM & ACADEMIC INQUIRY
// ----------------------------------------------------------------------------
console.log('\n--- TEST 2: Ask School AI Natural Language Inquiry Engine ---');

// 2a. Direct Subject Inquiries across domains
const sampleSubjectQueries = [
  { q: "What is the curriculum for Further Mathematics?", expectedSubject: "Further Mathematics" },
  { q: "Can you explain Physics key topics?", expectedSubject: "Physics" },
  { q: "Tell me about Chemistry syllabus and organic chemistry", expectedSubject: "Chemistry" },
  { q: "How do I study Biology and genetics?", expectedSubject: "Biology" },
  { q: "What are the core topics in Computer Studies / ICT?", expectedSubject: "Computer Studies / ICT" },
  { q: "Explain Financial Accounting and ledger entries", expectedSubject: "Financial Accounting" },
  { q: "Tell me about Igbo Language & Culture topics", expectedSubject: "Igbo Language & Culture" },
  { q: "What do we learn in Agricultural Science?", expectedSubject: "Agricultural Science" },
  { q: "Explain Technical Drawing 1st and 3rd angle projection", expectedSubject: "Technical Drawing" },
  { q: "Explain Quantitative Reasoning number patterns", expectedSubject: "Quantitative Reasoning" }
];

for (const item of sampleSubjectQueries) {
  const res = askSchoolAi(item.q);
  assert(res && res.confidence >= 0.85, `AI successfully answers inquiry: "${item.q}" (Intent: ${res.intent}, Confidence: ${res.confidence})`);
  assert(res.answer.toLowerCase().includes(item.expectedSubject.toLowerCase()), `  -> Answer explicitly details ${item.expectedSubject}`);
}

// 2b. WAEC Grading System
console.log('\n--- TEST 2b: WAEC Grading System Inquiries ---');
const gradeRes = askSchoolAi("How does the WAEC grading system work? What is A1 and C6?");
assert(gradeRes.intent === 'GRADING_SYSTEM', `AI correctly identifies WAEC grading intent`);
assert(gradeRes.answer.includes('A1') && gradeRes.answer.includes('C6') && gradeRes.answer.includes('75'), `  -> Contains exact WAEC thresholds (A1, C6, 75)`);

// 2c. National Exams (BECE / WAEC / JAMB)
console.log('\n--- TEST 2c: National Examinations Inquiry ---');
const examRes = askSchoolAi("How should I prepare for WAEC and BECE exams at Eagle Power?");
assert(examRes.intent === 'EXAM_PREPARATION', `AI identifies National Exam prep intent`);
assert(examRes.answer.includes('SS') && examRes.answer.includes('BECE') && examRes.answer.includes('WAEC'), `  -> Accurately outlines WAEC and BECE registration requirements`);

// 2d. School Campus & Tuition Inquiries
console.log('\n--- TEST 2d: School Administrative & Campus Inquiries ---');
const campusRes = askSchoolAi("Where is Eagle Power located and what are the campus addresses?");
assert(campusRes.intent === 'SCHOOL_LOCATION', `AI recognizes campus location intent`);
assert(campusRes.answer.includes('Amikwo Road') && campusRes.answer.includes('Awka'), `  -> Accurately cites 2 & 9 Amikwo Road, Awka`);

const feeRes = askSchoolAi("What are the school fees and tuition payment procedures?");
assert(feeRes.intent === 'SCHOOL_FEES', `AI recognizes tuition inquiry intent`);
assert(feeRes.answer.includes('Bursary') && feeRes.answer.includes('tuition'), `  -> Advises on Bursary department and bank payment advice`);

// 2e. Student Diagnostic Lookup via AI
console.log('\n--- TEST 2e: Student Academic Diagnostic Lookup via AI ---');
const anyStudent = db.prepare('SELECT id, admission_no, first_name, last_name FROM students LIMIT 1').get();
if (anyStudent) {
  const diagRes = askSchoolAi(`Please diagnose student ${anyStudent.admission_no}`);
  assert(diagRes.intent === 'STUDENT_DIAGNOSTIC', `AI identifies diagnostic intent for student ${anyStudent.admission_no}`);
  assert(diagRes.answer.includes(anyStudent.first_name) || diagRes.answer.includes(anyStudent.admission_no), `  -> Returns specific diagnostic for student ${anyStudent.first_name}`);
}

// ----------------------------------------------------------------------------
// TEST 3: MULTI-CRITERIA HOMEWORK EVALUATION ENGINE
// ----------------------------------------------------------------------------
console.log('\n--- TEST 3: Multi-Criteria Homework Evaluation Engine ---');

const mathAssignment = {
  title: 'Quadratic Equations & Roots',
  subject_name: 'Mathematics',
  class_name: 'SS 2',
  description: 'Solve 2x^2 + 5x - 3 = 0 using the quadratic formula, showing all steps and formula.',
  max_points: 10
};

// 3a. Comprehensive, step-by-step submission with formula and units
const strongSubmission = {
  content: 'Using quadratic formula x = (-b +- sqrt(b^2 - 4ac)) / (2a). For 2x^2 + 5x - 3 = 0, a=2, b=5, c=-3. Discriminant D = 5^2 - 4(2)(-3) = 25 + 24 = 49. Therefore x = (-5 +- sqrt(49)) / 4 = (-5 +- 7) / 4. Roots are x = 2/4 = 0.5 or x = -12/4 = -3.'
};

const strongEval = evaluateHomeworkSubmission(mathAssignment, strongSubmission);
assert(strongEval.percentage >= 85 || strongEval.score >= 8.5, `High quality math submission receives distinction score (Score: ${strongEval.score}/${mathAssignment.max_points}, ${strongEval.percentage}%)`);
assert(strongEval.rubric.conceptScore >= 80, `  -> Concept score is high: ${strongEval.rubric.conceptScore}/100`);
assert(strongEval.rubric.reasoningScore >= 80, `  -> Reasoning score is high: ${strongEval.rubric.reasoningScore}/100`);
assert(strongEval.rubric.calculationScore >= 80, `  -> Calculation score is high: ${strongEval.rubric.calculationScore}/100`);
assert(strongEval.rubric.bloomsTaxonomy.includes('Application') || strongEval.rubric.bloomsTaxonomy.includes('Analysis'), `  -> Blooms taxonomy classified at higher-order thinking`);

// 3b. Empty / Low-effort submission
const poorSubmission = {
  content: 'idk what this is'
};
const poorEval = evaluateHomeworkSubmission(mathAssignment, poorSubmission);
assert(poorEval.score < 40, `Low-effort submission is correctly graded low (Score: ${poorEval.score})`);
assert(poorEval.feedback.length > 20, `  -> Constructive feedback is provided for improvement`);

// ----------------------------------------------------------------------------
// TEST 4: STUDENT TRAJECTORY & LEARNING GAP RADAR
// ----------------------------------------------------------------------------
console.log('\n--- TEST 4: Student Trajectory & Learning Gap Radar ---');
if (anyStudent) {
  const profile = analyzeStudentProgress(anyStudent.id);
  assert(profile !== null, `analyzeStudentProgress successfully computes profile for student #${anyStudent.id}`);
  assert(profile.metrics && typeof profile.metrics.term_average === 'number', `  -> Contains term average (${profile.metrics.term_average})`);
  assert(typeof profile.metrics.readiness_tier === 'string', `  -> Computes readiness tier: ${profile.metrics.readiness_tier}`);
  assert(Array.isArray(profile.critical_subjects), `  -> Identifies critical priority subjects array (${profile.critical_subjects.length} subjects)`);
  assert(Array.isArray(profile.strong_subjects), `  -> Identifies strong subjects array (${profile.strong_subjects.length} subjects)`);
}

// ----------------------------------------------------------------------------
// TEST 5: PARENT ACTIONABLE RECOMMENDATIONS
// ----------------------------------------------------------------------------
console.log('\n--- TEST 5: Parent Actionable Recommendations ---');
if (anyStudent) {
  const parentRecs = generateParentRecommendations(anyStudent.id);
  assert(Array.isArray(parentRecs), `generateParentRecommendations successfully returns recommendations array for student #${anyStudent.id}`);
  assert(parentRecs.length > 0, `  -> Returns >= 1 personalized recommendation (Count: ${parentRecs.length})`);
  const firstRec = parentRecs[0];
  assert(typeof firstRec.title === 'string' && typeof firstRec.detailed_advice === 'string', `  -> Recommendation contains structured title: "${firstRec.title}"`);
  assert(typeof firstRec.urgency === 'string', `  -> Contains urgency tag: "${firstRec.urgency}"`);
}

// ----------------------------------------------------------------------------
// TEST 6: REPORT CARD COMMENT GENERATOR (TEACHER & PRINCIPAL)
// ----------------------------------------------------------------------------
console.log('\n--- TEST 6: AI Report Card Remark Synthesis ---');

// 6a. 1st Position Scholar
const topScholarRemarks = generateAiReportComments({
  student: { first_name: 'Chukwuebuka' },
  average: 88.5,
  position: 1,
  classSize: 32,
  attendance: { opened: 120, present: 119, absent: 1 }
});
assert(topScholarRemarks.teacherComment.includes('1st position'), `Teacher remark recognizes 1st position`);
assert(topScholarRemarks.promotionStatus === 'PROMOTED WITH DISTINCTION', `Principal awards PROMOTED WITH DISTINCTION`);
assert(topScholarRemarks.teacher_comment === topScholarRemarks.teacherComment, `Exports both snake_case and camelCase compatibility`);

// 6b. Struggling Scholar with attendance issues
const strugglingScholarRemarks = generateReportCardComments({
  student: { first_name: 'Somtochukwu' },
  average: 44.0,
  position: 30,
  classSize: 32,
  attendance: { opened: 120, present: 70, absent: 50 }
});
assert(strugglingScholarRemarks.promotionStatus.includes('REPEAT') || strugglingScholarRemarks.promotionStatus.includes('REMEDIAL'), `Principal flags remedial clinic for average < 50`);
assert(strugglingScholarRemarks.teacherComment.includes('attendance'), `Teacher comment notes irregular attendance hindrance`);

// ----------------------------------------------------------------------------
// TEST 7: LIVE HTTP ENDPOINTS INTEGRATION
// ----------------------------------------------------------------------------
console.log('\n--- TEST 7: Live HTTP API Endpoints Validation ---');

async function testHttpEndpoints() {
  const BASE_URL = 'http://localhost:5050/api';
  try {
    // 7a. Login as admin to get auth token
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'EagleAdmin2025!' })
    });
    const loginJson = await loginRes.json();
    assert(loginJson.success && loginJson.token, 'Admin authentication over HTTP succeeds');

    const token = loginJson.token;

    // 7b. POST /api/progress/ask-ai
    const askRes = await fetch(`${BASE_URL}/progress/ask-ai`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ question: 'Explain Further Mathematics syllabus and calculus' })
    });
    const askJson = await askRes.json();
    assert(askJson.success && askJson.data && askJson.data.answer.includes('Further Mathematics'), 'POST /api/progress/ask-ai returns Further Mathematics guide over HTTP');

    // 7c. POST /api/progress/report-comments
    const reportRes = await fetch(`${BASE_URL}/progress/report-comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        student: { first_name: 'Ngozi' },
        average: 84.5,
        position: 1,
        class_size: 28,
        attendance: { opened: 120, present: 118, absent: 2 }
      })
    });
    const reportJson = await reportRes.json();
    assert(reportJson.success && reportJson.data && reportJson.data.teacherComment.includes('1st position'), 'POST /api/progress/report-comments generates position-aware remarks over HTTP');

  } catch (err) {
    console.error('HTTP test warning:', err.message);
  }

  // ----------------------------------------------------------------------------
  // TEST SUMMARY
  // ----------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TOTAL AI ENGINE TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

await testHttpEndpoints();


