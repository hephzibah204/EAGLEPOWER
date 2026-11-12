import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DIVISION_ASSESSMENT_CONFIG,
  isPrimaryDivision,
  getAssessmentConfig,
  calculateMultiComponentScore,
  calculateGradeAndRemark
} from '../server/src/services/gradingScale.js';

test('Assessment configs correctly define Primary (20/20/60) and Secondary (30/70)', () => {
  assert.equal(DIVISION_ASSESSMENT_CONFIG.Primary.ca1_max, 20);
  assert.equal(DIVISION_ASSESSMENT_CONFIG.Primary.ca2_max, 20);
  assert.equal(DIVISION_ASSESSMENT_CONFIG.Primary.ca_max, 40);
  assert.equal(DIVISION_ASSESSMENT_CONFIG.Primary.exam_max, 60);
  assert.equal(DIVISION_ASSESSMENT_CONFIG.Primary.total_max, 100);

  assert.equal(DIVISION_ASSESSMENT_CONFIG.Secondary.ca_max, 30);
  assert.equal(DIVISION_ASSESSMENT_CONFIG.Secondary.exam_max, 70);
  assert.equal(DIVISION_ASSESSMENT_CONFIG.Secondary.total_max, 100);
});

test('isPrimaryDivision identifies Primary and Basic classes vs Secondary', () => {
  assert.equal(isPrimaryDivision('Primary'), true);
  assert.equal(isPrimaryDivision('Primary 1'), true);
  assert.equal(isPrimaryDivision('Primary School'), true);
  assert.equal(isPrimaryDivision('Basic 5'), true);

  assert.equal(isPrimaryDivision('Senior College'), false);
  assert.equal(isPrimaryDivision('Junior College'), false);
  assert.equal(isPrimaryDivision('Secondary'), false);
  assert.equal(isPrimaryDivision('SS2'), false);
  assert.equal(isPrimaryDivision('JSS1'), false);
});

test('Primary score computation: CA 1 (20) + CA 2 (20) + Exam (60) = 100', () => {
  const result = calculateMultiComponentScore({
    ca1_score: 18.5,
    ca2_score: 19.0,
    exam_score: 55.5,
    division: 'Primary'
  });

  assert.equal(result.ca1_score, 18.5);
  assert.equal(result.ca2_score, 19.0);
  assert.equal(result.ca_score, 37.5);
  assert.equal(result.exam_score, 55.5);
  assert.equal(result.total_score, 93.0);
  assert.equal(result.has_detailed_ca, true);
});

test('Primary standard score computation: CA (max 40) + Exam (max 60) = 100', () => {
  const result = calculateMultiComponentScore({
    ca_score: 36,
    exam_score: 54,
    division: 'Primary School'
  });

  assert.equal(result.ca_score, 36);
  assert.equal(result.exam_score, 54);
  assert.equal(result.total_score, 90);
  assert.equal(result.has_detailed_ca, false);
});

test('Primary score validation rejects scores exceeding limits (20, 20, 60)', () => {
  // CA 1 > 20
  assert.throws(() => {
    calculateMultiComponentScore({
      ca1_score: 21,
      ca2_score: 15,
      exam_score: 50,
      division: 'Primary'
    });
  }, /CA1 score must be a number from 0 to 20/);

  // CA 2 > 20
  assert.throws(() => {
    calculateMultiComponentScore({
      ca1_score: 15,
      ca2_score: 22,
      exam_score: 50,
      division: 'Primary'
    });
  }, /CA2 score must be a number from 0 to 20/);

  // Exam > 60
  assert.throws(() => {
    calculateMultiComponentScore({
      ca1_score: 15,
      ca2_score: 15,
      exam_score: 65,
      division: 'Primary'
    });
  }, /Exam score must be a number from 0 to 60/);

  // Standard CA > 40
  assert.throws(() => {
    calculateMultiComponentScore({
      ca_score: 42,
      exam_score: 50,
      division: 'Primary'
    });
  }, /CA score must be a number from 0 to 40/);
});

test('Secondary score computation: CA (30) + Exam (70) = 100', () => {
  const standard = calculateMultiComponentScore({
    ca_score: 28,
    exam_score: 64,
    division: 'Senior College'
  });
  assert.equal(standard.ca_score, 28);
  assert.equal(standard.exam_score, 64);
  assert.equal(standard.total_score, 92);

  const detailed = calculateMultiComponentScore({
    ca1_score: 14,
    ca2_score: 14,
    exam_score: 62,
    division: 'Junior College'
  });
  assert.equal(detailed.ca1_score, 14);
  assert.equal(detailed.ca2_score, 14);
  assert.equal(detailed.ca_score, 28);
  assert.equal(detailed.exam_score, 62);
  assert.equal(detailed.total_score, 90);
});

test('Secondary score validation rejects scores exceeding limits (15, 15, 70, or CA 30)', () => {
  // Exam > 70
  assert.throws(() => {
    calculateMultiComponentScore({
      ca_score: 25,
      exam_score: 75,
      division: 'Senior College'
    });
  }, /Exam score must be a number from 0 to 70/);

  // CA > 30
  assert.throws(() => {
    calculateMultiComponentScore({
      ca_score: 35,
      exam_score: 60,
      division: 'Senior College'
    });
  }, /CA score must be a number from 0 to 30/);
});

test('Grade calculation reflects Primary Mastery vs Secondary WAEC rubrics', () => {
  const priGrade = calculateGradeAndRemark(85, 'Primary');
  assert.equal(priGrade.grade, 'A+');
  assert.equal(priGrade.scale_code, 'PRIMARY_MASTERY');

  const secGrade = calculateGradeAndRemark(85, 'Senior College');
  assert.equal(secGrade.grade, 'A1');
  assert.equal(secGrade.scale_code, 'WAEC');
});
