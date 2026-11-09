/**
 * EaglePower EduCore Grading Scales & Academic Progression Engine
 * Supports division-specific assessment rubrics and 3-term cumulative annual promotion
 */

export const DIVISION_GRADING_SCALES = {
  // 1. Senior College (SSS1 - SSS3): Official WAEC / WASSCE 9-Point Scale
  'Senior College': {
    name: 'WAEC / WASSCE 9-Point Scale',
    code: 'WAEC',
    grades: [
      { min: 75, max: 100, grade: 'A1', remark: 'Distinction / Excellent', gpa: 4.0, isPass: true },
      { min: 70, max: 74, grade: 'B2', remark: 'Very Good', gpa: 3.5, isPass: true },
      { min: 65, max: 69, grade: 'B3', remark: 'Good', gpa: 3.0, isPass: true },
      { min: 60, max: 64, grade: 'C4', remark: 'Credit', gpa: 2.5, isPass: true },
      { min: 55, max: 59, grade: 'C5', remark: 'Credit', gpa: 2.0, isPass: true },
      { min: 50, max: 54, grade: 'C6', remark: 'Credit', gpa: 1.5, isPass: true },
      { min: 45, max: 49, grade: 'D7', remark: 'Pass', gpa: 1.0, isPass: true },
      { min: 40, max: 44, grade: 'E8', remark: 'Weak Pass', gpa: 0.5, isPass: true },
      { min: 0, max: 39, grade: 'F9', remark: 'Fail', gpa: 0.0, isPass: false }
    ]
  },

  // 2. Junior College (JSS1 - JSS3): Universal Basic Education / BECE Scale
  'Junior College': {
    name: 'Universal Basic Education (UBE / BECE) Scale',
    code: 'BECE',
    grades: [
      { min: 75, max: 100, grade: 'A', remark: 'Distinction', gpa: 4.0, isPass: true },
      { min: 65, max: 74, grade: 'B', remark: 'Upper Credit', gpa: 3.0, isPass: true },
      { min: 50, max: 64, grade: 'C', remark: 'Lower Credit', gpa: 2.0, isPass: true },
      { min: 40, max: 49, grade: 'P', remark: 'Pass', gpa: 1.0, isPass: true },
      { min: 0, max: 39, grade: 'F', remark: 'Fail', gpa: 0.0, isPass: false }
    ]
  },

  // 3. Primary School (Basic 1 - 6): British / Nigerian Primary Assessment
  'Primary': {
    name: 'Primary Mastery Scale',
    code: 'PRIMARY_MASTERY',
    grades: [
      { min: 80, max: 100, grade: 'A+', remark: 'Exceptional Mastery', gpa: 4.0, isPass: true },
      { min: 70, max: 79, grade: 'A', remark: 'Excellent', gpa: 3.5, isPass: true },
      { min: 60, max: 69, grade: 'B', remark: 'Very Good', gpa: 3.0, isPass: true },
      { min: 50, max: 59, grade: 'C', remark: 'Good', gpa: 2.0, isPass: true },
      { min: 40, max: 49, grade: 'D', remark: 'Satisfactory', gpa: 1.0, isPass: true },
      { min: 0, max: 39, grade: 'E', remark: 'Needs Academic Support', gpa: 0.0, isPass: false }
    ]
  },

  // 4. Early Childhood / Nursery (Reception, Nursery 1, 2, Creche): EYFS Rubric
  'Nursery': {
    name: 'Early Years Foundation Stage (EYFS) Mastery Rubric',
    code: 'EYFS',
    grades: [
      { min: 80, max: 100, grade: 'EE', remark: 'Exceeding Expectations', gpa: 4.0, isPass: true },
      { min: 60, max: 79, grade: 'ME', remark: 'Meeting Expectations', gpa: 3.0, isPass: true },
      { min: 40, max: 59, grade: 'AE', remark: 'Approaching Expectations', gpa: 2.0, isPass: true },
      { min: 0, max: 39, grade: 'ES', remark: 'Emerging Skills', gpa: 1.0, isPass: false }
    ]
  }
};

// Aliases for seamless division matching
DIVISION_GRADING_SCALES['Primary School'] = DIVISION_GRADING_SCALES['Primary'];
DIVISION_GRADING_SCALES['Nursery School'] = DIVISION_GRADING_SCALES['Nursery'];

/**
 * Resolve scale definition by division string
 */
export function getScaleForDivision(division) {
  if (!division) return DIVISION_GRADING_SCALES['Senior College'];
  const divNormalized = division.trim();
  if (DIVISION_GRADING_SCALES[divNormalized]) {
    return DIVISION_GRADING_SCALES[divNormalized];
  }
  if (divNormalized.toLowerCase().includes('nursery') || divNormalized.toLowerCase().includes('reception') || divNormalized.toLowerCase().includes('creche')) {
    return DIVISION_GRADING_SCALES['Nursery'];
  }
  if (divNormalized.toLowerCase().includes('primary') || divNormalized.toLowerCase().includes('basic')) {
    return DIVISION_GRADING_SCALES['Primary'];
  }
  if (divNormalized.toLowerCase().includes('junior') || divNormalized.toLowerCase().includes('jss')) {
    return DIVISION_GRADING_SCALES['Junior College'];
  }
  return DIVISION_GRADING_SCALES['Senior College'];
}

/**
 * Calculate grade and remark dynamically according to class division
 */
export function calculateGradeAndRemark(totalScore, division = 'Senior College') {
  const score = Math.max(0, Math.min(100, Math.round(Number(totalScore) || 0)));
  const scale = getScaleForDivision(division);

  for (const g of scale.grades) {
    if (score >= g.min && score <= g.max) {
      return {
        grade: g.grade,
        remark: g.remark,
        scale_name: scale.name,
        scale_code: scale.code,
        gpa: g.gpa,
        isPass: g.isPass
      };
    }
  }

  // Fallback to lowest grade
  const lowest = scale.grades[scale.grades.length - 1];
  return {
    grade: lowest.grade,
    remark: lowest.remark,
    scale_name: scale.name,
    scale_code: scale.code,
    gpa: lowest.gpa,
    isPass: lowest.isPass
  };
}

/**
 * Multi-Component Continuous Assessment (CA) and Exam Total Computation
 * Supports:
 * - Detailed breakdown: CA1 (10) + CA2 (10) + Project (10) + Exam (70) = 100
 * - Standard breakdown: CA (30) + Exam (70) = 100
 */
export function calculateMultiComponentScore({
  ca1_score = null,
  ca2_score = null,
  project_score = null,
  ca_score = 0,
  exam_score = 0
}) {
  let finalCa = 0;
  let hasDetailedCa = false;

  const parseScore = (value, label, max, optional = false) => {
    if (optional && (value === null || value === undefined || value === '')) return null;
    const score = Number(value);
    if (!Number.isFinite(score) || score < 0 || score > max) {
      throw new RangeError(`${label} must be a number from 0 to ${max}.`);
    }
    return Math.round(score * 10) / 10;
  };

  const numCa1 = parseScore(ca1_score, 'CA1 score', 10, true);
  const numCa2 = parseScore(ca2_score, 'CA2 score', 10, true);
  const numProject = parseScore(project_score, 'Project score', 10, true);
  const finalExam = parseScore(exam_score ?? 0, 'Exam score', 70);

  if (numCa1 !== null || numCa2 !== null || numProject !== null) {
    hasDetailedCa = true;
    finalCa = (numCa1 || 0) + (numCa2 || 0) + (numProject || 0);
  } else {
    finalCa = parseScore(ca_score ?? 0, 'CA score', 30);
  }

  finalCa = Math.round(finalCa * 10) / 10;
  const totalScore = Math.round((finalCa + finalExam) * 10) / 10;

  return {
    ca1_score: numCa1,
    ca2_score: numCa2,
    project_score: numProject,
    ca_score: finalCa,
    exam_score: finalExam,
    total_score: totalScore,
    has_detailed_ca: hasDetailedCa
  };
}

/**
 * 3-Term Annual Promotion Decision Engine
 * Determines official status based on cumulative annual session average
 */
export function getPromotionDecision(cumulativeAverage, currentTerm = 'Third Term', isFinalTerm = false) {
  const avg = parseFloat(cumulativeAverage) || 0;
  const isFinal = isFinalTerm || currentTerm === 'Third Term' || currentTerm === '3rd Term';

  if (!isFinal) {
    return {
      status: 'PROGRESSING',
      decision_label: 'Progressing into Next Term',
      recommendation: 'Continuous term-by-term assessment ongoing.',
      color: 'blue'
    };
  }

  if (avg >= 50.0) {
    return {
      status: 'PROMOTED',
      decision_label: 'PROMOTED TO NEXT CLASS',
      recommendation: avg >= 75 
        ? 'Outstanding academic excellence. Recommended for honors recognition.' 
        : 'Satisfactory mastery of academic syllabus. Ready for next academic grade.',
      color: 'emerald'
    };
  } else if (avg >= 40.0 && avg < 50.0) {
    return {
      status: 'PROMOTED_ON_TRIAL',
      decision_label: 'PROMOTED ON TRIAL',
      recommendation: 'Borderline academic average. Promoted on trial with mandatory holiday study clinics and close teacher supervision.',
      color: 'amber'
    };
  } else {
    return {
      status: 'REPEAT',
      decision_label: 'REPEAT CLASS / REMEDIAL CLINIC',
      recommendation: 'Academic average below statutory progression threshold. Class repetition and diagnostic coaching required.',
      color: 'rose'
    };
  }
}
