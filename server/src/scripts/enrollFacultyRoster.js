import db from '../config/db.js';
import bcrypt from '../../node_modules/bcryptjs/index.js';

console.log('🚀 Starting Comprehensive Eagle Power Schools Faculty Roster Synchronization...\n');

// 1. Ensure missing subjects exist
const newSubjects = [
  { name: 'Geography', code: 'GEO', division: 'Senior College', category: 'Elective' },
  { name: 'Marketing', code: 'MKT', division: 'Senior College', category: 'Elective' },
  { name: 'Pre-Vocational Studies (PVS)', code: 'PVS', division: 'Junior College', category: 'Core' },
  { name: 'Visual Art', code: 'VART', division: 'All', category: 'Elective' },
  { name: 'Digital Technology', code: 'DTECH', division: 'Junior College', category: 'Core' },
  { name: 'Asụsụ Igbo', code: 'AIGB', division: 'All', category: 'Core' },
  { name: 'Intermediate Science', code: 'ISC', division: 'Junior College', category: 'Core' },
  { name: 'Chemistry', code: 'CHM', division: 'Senior College', category: 'Core' }
];

for (const sub of newSubjects) {
  const existing = db.prepare('SELECT id FROM subjects WHERE code = ? OR name = ?').get(sub.code, sub.name);
  if (!existing) {
    db.prepare('INSERT INTO subjects (name, code, division, category) VALUES (?, ?, ?, ?)').run(
      sub.name, sub.code, sub.division, sub.category
    );
    console.log(`  ➕ Added Subject: ${sub.name} (${sub.code})`);
  }
}

// 2. Ensure JSS1 and Pre-Nursery classes exist
const jss1 = db.prepare('SELECT id FROM classes WHERE name = ?').get('JSS1');
if (!jss1) {
  db.prepare(`INSERT INTO classes (name, division, termly_tuition) VALUES ('JSS1', 'Junior College', 55000)`).run();
  console.log(`  ➕ Added Class: JSS1`);
}

const preNursery = db.prepare('SELECT id FROM classes WHERE name = ?').get('Pre-Nursery');
if (!preNursery) {
  db.prepare(`INSERT INTO classes (name, division, termly_tuition) VALUES ('Pre-Nursery', 'Nursery', 45000)`).run();
  console.log(`  ➕ Added Class: Pre-Nursery`);
}

// 3. Consolidated 28 Faculty Master Register
const facultyData = [
  {
    sn: 1,
    name: 'Echezona Nzekwe',
    position: 'Form Master, SSS2',
    role: 'Teacher & Form Master (SSS2)',
    subjects: 'Asụsụ Igbo',
    classes: 'SSS1–SSS3',
    formResponsibility: 'Form Master, SSS2',
    formClass: 'SS2',
    phone: '08130439923',
    qualification: 'BSc',
    salary: 55000,
    gender: 'Male',
    dob: '1990-10-04',
    staff_no: 'EPS/ST/002',
    dateEmployed: '2024-12-05',
    employmentType: 'Full time',
    address: '48 Works road Awka',
    email: 'skulboi49@gmail.com',
    emergencyContactName: 'Ebele Nzekwe',
    emergencyContactPhone: '08066122308'
  },
  {
    sn: 2,
    name: 'Olisah Nzemeka C.',
    position: 'Senior Physics Master',
    role: 'Senior Physics Master',
    subjects: 'Physics',
    classes: 'SSS1–SSS3',
    formResponsibility: null,
    formClass: null,
    phone: '09038741485',
    qualification: 'Mphil',
    salary: 40000,
    gender: 'Male',
    dob: '1988-05-04',
    staff_no: 'EPS-STF-47',
    dateEmployed: '2019-09-20',
    employmentType: 'Part time',
    address: '25 Club Road Awka',
    email: 'olisahnzemeka@gmail.com',
    emergencyContactName: 'Olisah Chidiogo',
    emergencyContactPhone: '08139091192'
  },
  {
    sn: 3,
    name: 'Ayatalumo Stella-Maris U.',
    position: 'Form Mistress, JSS2',
    role: 'Teacher & Form Mistress (JSS2)',
    subjects: 'Biology and Agricultural Science',
    classes: 'SSS1–SSS3',
    formResponsibility: 'Form Mistress, JSS2',
    formClass: 'JSS2',
    phone: '09011128556',
    qualification: 'Bsc',
    salary: 50000,
    gender: 'Female',
    dob: '2000-05-31',
    staff_no: 'EPS-STF-48',
    dateEmployed: '2025-03-06',
    employmentType: 'Full time',
    address: '2 Annunciation Road Awka',
    email: 'uchenna3150@gmail.com',
    emergencyContactName: 'Chinwuba Chidimma',
    emergencyContactPhone: '08163017851'
  },
  {
    sn: 4,
    name: 'Onwuka Onyekachi Francis',
    position: 'Form Master, SSS1',
    role: 'Teacher & Form Master (SSS1)',
    subjects: 'Social and Citizenship Education; Physical and Health Education',
    classes: 'JSS1–JSS3',
    formResponsibility: 'Form Master, SSS1',
    formClass: 'SS1',
    phone: '08169033221',
    qualification: 'Msc',
    salary: 50000,
    gender: 'Male',
    dob: '1982-10-22',
    staff_no: 'EPS-STF-49',
    dateEmployed: '2026-10-04',
    employmentType: 'Full time',
    address: '2 Agbovu Street, Ngene-Amawbia',
    email: 'aglowonwuka@gmail.com',
    emergencyContactName: 'Josephine Onwuka',
    emergencyContactPhone: '08039764651'
  },
  {
    sn: 5,
    name: 'Okeke Dorothy Adaora',
    position: 'Educator',
    role: 'Senior Geography & Citizenship Educator',
    subjects: 'Citizenship Education and Geography',
    classes: 'SSS1–SSS3',
    formResponsibility: null,
    formClass: null,
    phone: '08168662120',
    qualification: 'B.A',
    salary: 40000,
    gender: 'Female',
    dob: '1960-09-14',
    staff_no: 'EPS-STF-50',
    dateEmployed: '2024-05-11',
    employmentType: 'Part time',
    address: '7 Obi Obueze Street Amikwo Awka',
    email: 'okekedorothy825@gmail.com',
    emergencyContactName: 'Blessing',
    emergencyContactPhone: '08168662120'
  },
  {
    sn: 6,
    name: 'Obiora Jeremiah',
    position: 'Educator',
    role: 'Digital Technology & Christian Religious Studies Teacher',
    subjects: 'Digital Technology; CRS',
    classes: 'Digital Technology: JSS1–JSS3; CRS: SSS1–SSS3',
    formResponsibility: null,
    formClass: null,
    phone: '08066044865',
    qualification: 'Bsc',
    salary: 35000,
    gender: 'Male',
    dob: '1985-04-13',
    staff_no: 'EPS-STF-51',
    dateEmployed: '2025-12-09',
    employmentType: 'Part time',
    address: '25 Nwibo Street off Works Road',
    email: 'exalted4real@yahoo.com',
    emergencyContactName: 'Chioma Charity',
    emergencyContactPhone: '07060704892'
  },
  {
    sn: 7,
    name: 'Okeke Chiso Solomon',
    position: 'Educator',
    role: 'Creative & Visual Arts Master',
    subjects: 'Cultural and Creative Arts; Visual Art',
    classes: 'JSS1–JSS3; SSS1–SSS3',
    formResponsibility: null,
    formClass: null,
    phone: '08168514559',
    qualification: 'B.A Ed',
    salary: 40000,
    gender: 'Male',
    dob: '1991-01-10',
    staff_no: 'EPS-STF-52',
    dateEmployed: '2024-09-14',
    employmentType: 'Part time',
    address: '15 Annunciation Street Off Obunagu Road Amikwo Awka',
    email: 'chis4children@gmail.com',
    emergencyContactName: 'Chiso Peace',
    emergencyContactPhone: '07038154149'
  },
  {
    sn: 8,
    name: 'Mrs. Abana Wisdom',
    position: 'Educator',
    role: 'Literature & English Language Educator',
    subjects: 'Literature; English Language',
    classes: 'Literature: SSS3; English: JSS2–JSS3',
    formResponsibility: null,
    formClass: null,
    phone: null,
    qualification: 'BA',
    salary: 35000,
    gender: 'Female',
    dob: '1986-10-06',
    staff_no: 'EPS-STF-53',
    dateEmployed: '2025-10-04',
    employmentType: 'Part time',
    address: '37 works Road amikwo Awka',
    email: 'w0690602@gmail.com',
    emergencyContactName: 'Abana David',
    emergencyContactPhone: '07082038134'
  },
  {
    sn: 9,
    name: 'Ineh Ruth',
    position: 'Class Teacher, Basic 2',
    role: 'Basic 2 Lead Class Teacher',
    subjects: 'All Subjects',
    classes: 'Basic 2',
    formResponsibility: 'Class Teacher, Basic 2',
    formClass: 'Primary 2',
    phone: '09151888827',
    qualification: 'BSc',
    salary: 45000,
    gender: 'Female',
    dob: '2005-04-10',
    staff_no: 'EPS-STF-54',
    dateEmployed: '2026-09-21',
    employmentType: 'Full time',
    address: '12 Chinweze Oku Street off works\' road Amikwo Awka',
    email: 'chiamakaineh2005@gmail.com',
    emergencyContactName: 'Chinonso Ineh',
    emergencyContactPhone: '09016171808'
  },
  {
    sn: 10,
    name: 'Theodore Okwaranwaneri',
    position: 'Senior English Language Master',
    role: 'Senior English Language Master',
    subjects: 'English Language',
    classes: 'SSS1–SSS3',
    formResponsibility: null,
    formClass: null,
    phone: '08035497986',
    qualification: 'M.A English',
    salary: 40000,
    gender: 'Male',
    dob: '1974-02-04',
    staff_no: 'EPS-STF-55',
    dateEmployed: '2025-09-14',
    employmentType: 'Part time',
    address: '2 Chief Ike Okoli Street Amikwo Awka',
    email: 'okwaranwaneri776@gmail.com',
    emergencyContactName: 'Okwaranwaneri Justina',
    emergencyContactPhone: '08034437415'
  },
  {
    sn: 11,
    name: 'Adiruo Chioma Charity',
    position: 'Educator',
    role: 'Business Studies & Marketing Mistress',
    subjects: 'Business Studies; Marketing',
    classes: 'JSS1–JSS3; SSS1–SSS3',
    formResponsibility: null,
    formClass: null,
    phone: '07060704892',
    qualification: 'BSc',
    salary: 35000,
    gender: 'Female',
    dob: '1991-01-09',
    staff_no: 'EPS-STF-56',
    dateEmployed: '2026-09-14',
    employmentType: 'Part time',
    address: '25 Nwibo Street off Works Road',
    email: 'chiomachari@gmail.com',
    emergencyContactName: 'Obuakaeze Obiora Jeremiah',
    emergencyContactPhone: '08066044865'
  },
  {
    sn: 12,
    name: 'Obi Amaka',
    position: 'Educator',
    role: 'CRS & PVS Mistress',
    subjects: 'CRS and PVS',
    classes: 'JSS1–JSS3',
    formResponsibility: null,
    formClass: null,
    phone: '07070150391',
    qualification: 'BSc',
    salary: 50000,
    gender: 'Female',
    dob: '1988-12-26',
    staff_no: 'EPS-STF-57',
    dateEmployed: '2026-04-29',
    employmentType: 'Full time',
    address: '4 Anagor street off Works road Amikwo Awka',
    email: 'obia256@gmail.com',
    emergencyContactName: 'Nwokolo Chinenye',
    emergencyContactPhone: '08030782242'
  },
  {
    sn: 13,
    name: 'Adaeze Uzoefuna',
    position: 'Vice Principal (Academics)',
    role: 'Vice Principal (Academics)',
    subjects: 'Academic Administration',
    classes: 'All Classes',
    formResponsibility: null,
    formClass: null,
    phone: '08033591058',
    qualification: 'BSc',
    salary: 60000,
    gender: 'Female',
    dob: '1987-11-30',
    staff_no: 'EPS/ST/001',
    dateEmployed: '2014-04-10',
    employmentType: 'Full time',
    address: '4 Obunagu Road Amikwo Awka',
    email: 'adaeze3011@gmail.com',
    emergencyContactName: 'Jude Uzoefuna',
    emergencyContactPhone: '09135127239'
  },
  {
    sn: 14,
    name: 'Chilokwu Chioma Glory',
    position: 'Educator',
    role: 'Senior Economics Mistress',
    subjects: 'Economics',
    classes: 'SSS1–SSS3',
    formResponsibility: null,
    formClass: null,
    phone: '08068147094',
    qualification: 'PhD',
    salary: 40000,
    gender: 'Female',
    dob: '1988-04-06',
    staff_no: 'EPS-STF-58',
    dateEmployed: '2021-09-19',
    employmentType: 'Part time',
    address: '2 Igwe FFBC Nwankwo Amikwo Awka',
    email: 'chiomaglory91@gmail.com',
    emergencyContactName: 'Innocent Chilokwu',
    emergencyContactPhone: '08034303310'
  },
  {
    sn: 15,
    name: 'Agbago Adaobi Celestina',
    position: 'Class Teacher, Basic 1',
    role: 'Basic 1 Lead Class Teacher',
    subjects: 'All Subjects',
    classes: 'Basic 1',
    formResponsibility: 'Class Teacher, Basic 1',
    formClass: 'Primary 1',
    phone: '08148415409',
    qualification: 'Bsc',
    salary: 52000,
    gender: 'Female',
    dob: '1999-05-11',
    staff_no: 'EPS-STF-59',
    dateEmployed: '2022-10-04',
    employmentType: 'Full time',
    address: '4 Obunagu Road Amikwo Awka',
    email: 'agbagoada977@gmail.com',
    emergencyContactName: 'Asiegbu Kate',
    emergencyContactPhone: '08139492100'
  },
  {
    sn: 16,
    name: 'Emmanuel Ebube Peculiar',
    position: 'Class Teacher, Nursery 3',
    role: 'Nursery 3 Lead Class Teacher',
    subjects: 'All Subjects',
    classes: 'Nursery 3',
    formResponsibility: 'Class Teacher, Nursery 3',
    formClass: 'Nursery 3',
    phone: '08129761676',
    qualification: 'O-level',
    salary: 45000,
    gender: 'Female',
    dob: '2001-01-09',
    staff_no: 'EPS-STF-60',
    dateEmployed: '2023-11-09',
    employmentType: 'Full time',
    address: '10 Court Road Awka',
    email: 'eebube455@gmail.com',
    emergencyContactName: 'Okoloma Ifeanyi',
    emergencyContactPhone: '09030658008'
  },
  {
    sn: 17,
    name: 'Etonyeaku Ogechi',
    position: 'Class Teacher, Basic 5',
    role: 'Basic 5 Lead Class Teacher',
    subjects: 'All Subjects',
    classes: 'Basic 5',
    formResponsibility: 'Class Teacher, Basic 5',
    formClass: 'Primary 5',
    phone: '08032782137',
    qualification: 'HND',
    salary: 50000,
    gender: 'Female',
    dob: '1988-09-23',
    staff_no: 'EPS-STF-61',
    dateEmployed: '2026-04-27',
    employmentType: 'Full time',
    address: '6 Sammy Sparkle Road Amikwo Awka',
    email: 'etonyeakuogechi@gmail.com',
    emergencyContactName: 'Etonyeaku Ifeanyi',
    emergencyContactPhone: '09166073849'
  },
  {
    sn: 18,
    name: 'Mrs. Anagbogu Chioma',
    position: 'Class Teacher, Basic 3',
    role: 'Basic 3 Lead Class Teacher',
    subjects: 'All Subjects',
    classes: 'Basic 3',
    formResponsibility: 'Class Teacher, Basic 3',
    formClass: 'Primary 3',
    phone: '09066617255',
    qualification: 'Nursing Diploma',
    salary: 45000,
    gender: 'Female',
    dob: '1997-06-14',
    staff_no: 'EPS-STF-62',
    dateEmployed: '2026-02-02',
    employmentType: 'Full time',
    address: '4 Isiagu street Amikwo Awka',
    email: 'omalinda2000@gmail.com',
    emergencyContactName: 'Anagbogu Chuwkuemeka',
    emergencyContactPhone: '07041264442'
  },
  {
    sn: 19,
    name: 'Nwarisi Nneka',
    position: 'Class Teacher, Nursery 1',
    role: 'Nursery 1 Lead Class Teacher',
    subjects: 'All Subjects',
    classes: 'Nursery 1',
    formResponsibility: 'Class Teacher, Nursery 1',
    formClass: 'Nursery 1',
    phone: '09137743949',
    qualification: 'Bed',
    salary: 52000,
    gender: 'Female',
    dob: '1983-09-14',
    staff_no: 'EPS-STF-63',
    dateEmployed: '2023-11-09',
    employmentType: 'Full time',
    address: '20 Isiagu Amikwo, Awka',
    email: 'nwarisinneka@gmail.com',
    emergencyContactName: 'Onuegbu Hope',
    emergencyContactPhone: '09132024434'
  },
  {
    sn: 20,
    name: 'Godswill Orji',
    position: 'Educator',
    role: 'Senior Commerce & Government Master',
    subjects: 'Commerce and Government',
    classes: 'SSS1–SSS3',
    formResponsibility: null,
    formClass: null,
    phone: '08178293281',
    qualification: 'LLB',
    salary: 45000,
    gender: 'Male',
    dob: '1992-10-22',
    staff_no: 'EPS-STF-64',
    dateEmployed: '2026-09-14',
    employmentType: 'Full time',
    address: '9B Obunagu Road Amikwo Awka',
    email: 'stunnerb39@gmail.com',
    emergencyContactName: 'Anakweze Onyinye',
    emergencyContactPhone: '08144401659'
  },
  {
    sn: 21,
    name: 'Okoye Cordelia Chinyere',
    position: 'Class Teacher, Nursery 2',
    role: 'Nursery 2 Lead Class Teacher',
    subjects: 'All Subjects',
    classes: 'Nursery 2',
    formResponsibility: 'Class Teacher, Nursery 2',
    formClass: 'Nursery 2',
    phone: '08135882776',
    qualification: 'B.Sc',
    salary: 50000,
    gender: 'Female',
    dob: '1986-03-03',
    staff_no: 'EPS-STF-65',
    dateEmployed: '2026-09-17',
    employmentType: 'Full time',
    address: '10 ogbuagu close Awka',
    email: 'chi4change1@gmail.com',
    emergencyContactName: 'Amaka',
    emergencyContactPhone: '08108410632'
  },
  {
    sn: 22,
    name: 'Nwoye Mary',
    position: 'Class Teacher, Basic 6',
    role: 'Basic 6 Lead Class Teacher',
    subjects: 'All Subjects',
    classes: 'Basic 6',
    formResponsibility: 'Class Teacher, Basic 6',
    formClass: 'Primary 6',
    phone: '08063835339',
    qualification: 'BSc',
    salary: 55000,
    gender: 'Female',
    dob: '1987-10-15',
    staff_no: 'EPS-STF-66',
    dateEmployed: '2012-12-09',
    employmentType: 'Full time',
    address: 'Engr. Hycenth Nwoye\'s compound Etiti Osili Enugwu Ukwu',
    email: 'ndidia54@gmail.com',
    emergencyContactName: 'Engr. Hycenth Nwoye',
    emergencyContactPhone: '08063457911'
  },
  {
    sn: 23,
    name: 'Okeke Patricia I.',
    position: 'Form Teacher, JSS3',
    role: 'Intermediate Science Mistress & Form Teacher (JSS3)',
    subjects: 'Intermediate Science',
    classes: 'JSS1–JSS3',
    formResponsibility: 'Form Teacher, JSS3',
    formClass: 'JSS3',
    phone: '09130660660',
    qualification: 'NCE',
    salary: 50000,
    gender: 'Female',
    dob: '1970-07-07',
    staff_no: 'EPS-STF-67',
    dateEmployed: '2025-09-19',
    employmentType: 'Full time',
    address: 'Amikwo Awka',
    email: 'emmanuelchisom195@gmail.com',
    emergencyContactName: 'Chisom Onumba',
    emergencyContactPhone: '08025076642'
  },
  {
    sn: 24,
    name: 'Ezeana Elizabeth Ekwutosi',
    position: 'Lead Educator, Pre-Nursery',
    role: 'Pre-Nursery / Daycare Lead Educator',
    subjects: 'All Subjects',
    classes: 'Pre-Nursery/Daycare',
    formResponsibility: 'Lead Educator, Pre-Nursery',
    formClass: 'Pre-Nursery',
    phone: '08166878419',
    qualification: 'NCE',
    salary: 50000,
    gender: 'Female',
    dob: '1976-11-06',
    staff_no: 'EPS-STF-68',
    dateEmployed: '2026-09-14',
    employmentType: 'Full time',
    address: 'Sammy Sparkle Amikwo, off Dike Street, Awka',
    email: 'ezeana.elizabeth@eaglepowerschools.com.ng',
    emergencyContactName: 'Bright Ebuka Jerome',
    emergencyContactPhone: '09157008752'
  },
  {
    sn: 25,
    name: 'Deborah David',
    position: 'Senior Mathematics Mistress',
    role: 'Senior Mathematics Mistress',
    subjects: 'Mathematics',
    classes: 'JSS1–JSS3; SSS3',
    formResponsibility: null,
    formClass: null,
    phone: '09164397786',
    qualification: 'BSc',
    salary: 50000,
    gender: 'Female',
    dob: '1990-08-29',
    staff_no: 'EPS-STF-69',
    dateEmployed: '2024-01-14',
    employmentType: 'Full time',
    address: 'Amikwo Awka',
    email: 'deborahsamuel144@gmail.com',
    emergencyContactName: 'Solomon David',
    emergencyContactPhone: '08084037203'
  },
  {
    sn: 26,
    name: 'Aniekwe Kosisochukwu',
    position: 'Early Years Co-Educator',
    role: 'Nursery 3 Co-Educator & Early Years Teacher',
    subjects: 'All Subjects',
    classes: 'Nursery 3',
    formResponsibility: null,
    formClass: null,
    phone: '08165044496',
    qualification: 'HND',
    salary: 50000,
    gender: 'Female',
    dob: '1996-11-22',
    staff_no: 'EPS-STF-70',
    dateEmployed: '2026-07-10',
    employmentType: 'Full time',
    address: '5 Ubaka lane Amikwo Awka',
    email: 'aniekwe6@gmail.com',
    emergencyContactName: 'Echezona Innocent',
    emergencyContactPhone: '08062465221'
  },
  {
    sn: 27,
    name: 'Moadana Victor',
    position: 'Senior Chemistry & Tech Educator',
    role: 'Chemistry & Digital Technology Master',
    subjects: 'Chemistry and Digital Technology',
    classes: 'SSS1–SSS3',
    formResponsibility: null,
    formClass: null,
    phone: '08064494719',
    qualification: 'B.Sc',
    salary: 40000,
    gender: 'Male',
    dob: '1986-05-18',
    staff_no: 'EPS-STF-71',
    dateEmployed: '2025-09-14',
    employmentType: 'Part time',
    address: '13 Ikedinaya Umukwa Awka',
    email: 'viks24ch@yahoo.com',
    emergencyContactName: 'C.A.M Tabansi',
    emergencyContactPhone: '08069534825'
  },
  {
    sn: 28,
    name: 'Ibebugwu Juliet',
    position: 'Class Teacher, Basic 4',
    role: 'Basic 4 Lead Class Teacher',
    subjects: 'All Subjects',
    classes: 'Basic 4',
    formResponsibility: 'Class Teacher, Basic 4',
    formClass: 'Primary 4',
    phone: '08109480588',
    qualification: 'NCE',
    salary: 50000,
    gender: 'Female',
    dob: '1991-07-14',
    staff_no: 'EPS-STF-72',
    dateEmployed: '2026-09-15',
    employmentType: 'Full time',
    address: 'Plot 86 Gibson Nwosu Avenue Amikwo Village Awka',
    email: 'julietuchechukwu20@gmail.com',
    emergencyContactName: 'Ibebugwu Chinedu',
    emergencyContactPhone: '08036425308'
  }
];

const salt = bcrypt.genSaltSync(10);
const defaultPassHash = bcrypt.hashSync('EagleStaff2025!', salt);

console.log('\n👩‍🏫 Synchronizing 28 Staff Members into Master Staff, Payroll & Users Registry:');

for (const t of facultyData) {
  // Normalize clean name and search
  const cleanSearchName = t.name.replace(/^mrs\.?\s+/i, '').replace(/^mr\.?\s+/i, '').trim();
  
  let staffRecord = db.prepare(`
    SELECT * FROM staff 
    WHERE UPPER(staff_no) = UPPER(?) 
       OR UPPER(name) = UPPER(?) 
       OR UPPER(name) LIKE UPPER(?)
  `).get(t.staff_no, t.name, `%${cleanSearchName}%`);

  const assignedText = `${t.subjects} (${t.classes})`;
  const fullEmergency = `${t.emergencyContactName} (${t.emergencyContactPhone})`;

  if (staffRecord) {
    db.prepare(`
      UPDATE staff SET
        staff_no = ?,
        name = ?,
        role = ?,
        email = ?,
        phone = ?,
        qualification = ?,
        assigned_class = ?,
        gender = ?,
        dob = ?,
        date_employed = ?,
        employment_type = ?,
        address = ?,
        emergency_contact_name = ?,
        emergency_contact = ?,
        salary = ?,
        form_responsibility = ?,
        is_active = 1
      WHERE id = ?
    `).run(
      t.staff_no,
      t.name,
      t.role,
      t.email,
      t.phone,
      t.qualification,
      assignedText,
      t.gender,
      t.dob,
      t.dateEmployed,
      t.employmentType,
      t.address,
      t.emergencyContactName,
      t.emergencyContactPhone,
      t.salary,
      t.formResponsibility,
      staffRecord.id
    );
    console.log(`  🔄 Updated Staff [#${t.sn}]: ${t.name} (Staff No: ${t.staff_no}, Phone: ${t.phone || 'N/A'}, Salary: ₦${t.salary.toLocaleString()})`);
  } else {
    const res = db.prepare(`
      INSERT INTO staff (
        staff_no, name, role, email, phone, qualification, assigned_class,
        gender, dob, date_employed, employment_type, address, emergency_contact_name,
        emergency_contact, salary, form_responsibility, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      t.staff_no,
      t.name,
      t.role,
      t.email,
      t.phone,
      t.qualification,
      assignedText,
      t.gender,
      t.dob,
      t.dateEmployed,
      t.employmentType,
      t.address,
      t.emergencyContactName,
      t.emergencyContactPhone,
      t.salary,
      t.formResponsibility
    );
    staffRecord = { id: res.lastInsertRowid, staff_no: t.staff_no, name: t.name };
    console.log(`  ✅ Inserted Staff [#${t.sn}]: ${t.name} (Staff No: ${t.staff_no}, Phone: ${t.phone || 'N/A'}, Salary: ₦${t.salary.toLocaleString()})`);
  }

  // Synchronize or create salary structure in `staff_salary_structures`
  const existingStructure = db.prepare('SELECT id FROM staff_salary_structures WHERE staff_id = ?').get(staffRecord.id);
  if (existingStructure) {
    db.prepare(`
      UPDATE staff_salary_structures SET
        base_salary = ?,
        net_salary = ?,
        housing_allowance = 0,
        transport_allowance = 0,
        teaching_allowance = 0,
        tax_deduction = 0,
        pension_deduction = 0,
        other_deductions = 0,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(t.salary, t.salary, existingStructure.id);
  } else {
    db.prepare(`
      INSERT INTO staff_salary_structures (
        staff_id, base_salary, housing_allowance, transport_allowance,
        teaching_allowance, tax_deduction, pension_deduction, other_deductions, net_salary
      ) VALUES (?, ?, 0, 0, 0, 0, 0, 0, ?)
    `).run(staffRecord.id, t.salary, t.salary);
  }

  // Update class form teacher if applicable
  if (t.formClass) {
    const classRows = db.prepare('SELECT id, name FROM classes WHERE name = ? OR name = ?').all(t.formClass, t.formClass.replace('SS', 'SS '));
    for (const classRow of classRows) {
      db.prepare('UPDATE classes SET class_teacher_id = ? WHERE id = ?').run(staffRecord.id, classRow.id);
      console.log(`     📌 Assigned Form Responsibility: ${t.name} -> ${classRow.name} (Class ID: ${classRow.id})`);
    }
  }

  // Auto-provision or update portal account in `users`
  const cleanUsername = t.name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 15);
  const portalRole = t.role.toLowerCase().includes('principal') ? 'admin' : 'teacher';

  const existingUser = db.prepare('SELECT id, username FROM users WHERE UPPER(reference_id) = UPPER(?) OR LOWER(username) = ? OR LOWER(email) = ?').get(t.staff_no, cleanUsername, t.email?.toLowerCase());
  if (!existingUser) {
    db.prepare(`
      INSERT INTO users (username, email, password_hash, role, reference_id, full_name, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(cleanUsername, t.email, defaultPassHash, portalRole, t.staff_no, t.name);
    console.log(`     🔑 Provisioned Portal User: ${cleanUsername} (Role: ${portalRole}, Pass: EagleStaff2025!)`);
  } else {
    db.prepare(`
      UPDATE users SET email = ?, full_name = ?, role = ?, reference_id = ?, is_active = 1 WHERE id = ?
    `).run(t.email, t.name, portalRole, t.staff_no, existingUser.id);
  }
}

console.log('\n✨ All 28 Faculty Records Synchronized with Complete Registry & Payroll Data Successfully!');
