import db from '../config/db.js';
import bcrypt from 'bcryptjs';

console.log('🦅 Configuring Comprehensive Faculty Roster & Payroll Structures for Eagle Power Schools...');

const facultyData = [
  {
    id: 75,
    staff_no: 'EPS/ST/001',
    name: 'Adaeze Uzoefuna',
    role: 'Principal / Head Administrator',
    email: 'adaeze3011@gmail.com',
    phone: '+234 803 359 1058',
    qualification: 'M.Ed Educational Management',
    assigned_class: 'All',
    base: 150000, housing: 30000, transport: 20000, teaching: 20000, tax: 12000, pension: 8000,
    bank: { name: 'Access Bank', code: '044', acct: '0110106725' }
  },
  {
    id: 76,
    staff_no: 'EPS/ST/002',
    name: 'Echezona Nzekwe',
    role: 'Academic Coordinator',
    email: 'echezona.n@eaglepowerschools.com.ng',
    phone: '+234 803 112 3344',
    qualification: 'B.Sc (Ed) Mathematics',
    assigned_class: 'College Wing',
    base: 110000, housing: 25000, transport: 15000, teaching: 15000, tax: 9000, pension: 6000,
    bank: { name: 'United Bank For Africa', code: '033', acct: '0110108148' }
  },
  {
    id: 77,
    staff_no: 'EPS/ST/003',
    name: 'Adaobi Peter',
    role: 'Senior Science Teacher & Examiner',
    email: 'adaobi.peter@eaglepowerschools.com.ng',
    phone: '+234 806 778 8990',
    qualification: 'B.Sc Physics, PGDE',
    assigned_class: 'SS2 & SS3',
    base: 90000, housing: 20000, transport: 12000, teaching: 12000, tax: 7000, pension: 5000,
    bank: { name: 'Fidelity Bank', code: '070', acct: '0110109571' }
  },
  {
    id: 78,
    staff_no: 'EPS/ST/004',
    name: 'Chukwuma Okafor',
    role: 'Bursar & Accounts Officer',
    email: 'accounts@eaglepowerschools.com.ng',
    phone: '+234 802 334 5566',
    qualification: 'HND Accounting, ICAN (In-view)',
    assigned_class: 'Bursary',
    base: 110000, housing: 25000, transport: 15000, teaching: 15000, tax: 9000, pension: 6000,
    bank: { name: 'Guaranty Trust Bank', code: '058', acct: '0110110994' }
  },
  {
    id: 79,
    staff_no: 'EPS/ST/005',
    name: 'Emeka Nwankwo',
    role: 'ICT & Systems Engineer',
    email: 'tech@eaglepowerschools.com.ng',
    phone: '+234 805 990 1122',
    qualification: 'B.Sc Computer Science',
    assigned_class: 'ICT Centre',
    base: 80000, housing: 16000, transport: 12000, teaching: 10000, tax: 6000, pension: 4500,
    bank: { name: 'Zenith Bank', code: '057', acct: '0110112417' }
  },
  {
    id: 80,
    staff_no: 'EPS/ST/006',
    name: 'Ngozi Okoye',
    role: 'Senior Diction & English Coach',
    email: 'ngozi.okoye@eaglepowerschools.com.ng',
    phone: '+234 807 445 6677',
    qualification: 'B.A English & Literary Studies',
    assigned_class: 'Primary & JSS',
    base: 90000, housing: 20000, transport: 12000, teaching: 12000, tax: 7000, pension: 5000,
    bank: { name: 'First Bank of Nigeria', code: '011', acct: '0110113840' }
  },
  {
    id: 81,
    staff_no: 'EPS/ST/007',
    name: 'Mrs. Folake Adeyemi',
    role: 'English Language Teacher',
    email: 'folake.adeyemi@eaglepowerschools.com.ng',
    phone: '08134449988',
    qualification: 'B.A English, PGDE',
    assigned_class: 'Junior College (JSS 2)',
    base: 78000, housing: 16000, transport: 10000, teaching: 10000, tax: 5800, pension: 4200,
    bank: { name: 'Access Bank', code: '044', acct: '0110115263' }
  },
  {
    id: 82,
    staff_no: 'EPS/ST/008',
    name: 'Mr. Ifeanyi Obiora',
    role: 'Mathematics & Further Math Master',
    email: 'ifeanyi.obiora@eaglepowerschools.com.ng',
    phone: '08035551122',
    qualification: 'B.Sc (Ed) Mathematics',
    assigned_class: 'Senior College (SS 1 - SS 3)',
    base: 85000, housing: 18000, transport: 12000, teaching: 12000, tax: 6500, pension: 4800,
    bank: { name: 'United Bank For Africa', code: '033', acct: '0110116686' }
  },
  {
    id: 83,
    staff_no: 'EPS/ST/009',
    name: 'Mrs. Chinyere Eze',
    role: 'Biology & Basic Science Mistress',
    email: 'chinyere.eze@eaglepowerschools.com.ng',
    phone: '08023348899',
    qualification: 'B.Sc (Ed) Biology',
    assigned_class: 'SS 1 & SS 2',
    base: 82000, housing: 17000, transport: 11000, teaching: 11000, tax: 6200, pension: 4500,
    bank: { name: 'Guaranty Trust Bank', code: '058', acct: '0110117001' }
  },
  {
    id: 84,
    staff_no: 'EPS/ST/010',
    name: 'Mr. Obinna Madu',
    role: 'Chemistry & Science Laboratory Master',
    email: 'obinna.madu@eaglepowerschools.com.ng',
    phone: '08162234455',
    qualification: 'B.Sc Pure Chemistry, PGDE',
    assigned_class: 'SS 2 & SS 3',
    base: 85000, housing: 18000, transport: 12000, teaching: 12000, tax: 6500, pension: 4800,
    bank: { name: 'Zenith Bank', code: '057', acct: '0110117002' }
  },
  {
    id: 85,
    staff_no: 'EPS/ST/011',
    name: 'Mrs. Amaka Okoli',
    role: 'Head of Early Years & Nursery 1 Lead',
    email: 'amaka.okoli@eaglepowerschools.com.ng',
    phone: '08051122334',
    qualification: 'B.Ed Early Childhood Education',
    assigned_class: 'Nursery 1',
    base: 85000, housing: 18000, transport: 12000, teaching: 12000, tax: 6500, pension: 4800,
    bank: { name: 'First Bank of Nigeria', code: '011', acct: '0110117003' }
  },
  {
    id: 86,
    staff_no: 'EPS/ST/012',
    name: 'Miss Blessing Nwosu',
    role: 'Nursery 2 Class Teacher & Phonics Specialist',
    email: 'blessing.nwosu@eaglepowerschools.com.ng',
    phone: '08149988776',
    qualification: 'NCE Primary Education',
    assigned_class: 'Nursery 2',
    base: 68000, housing: 14000, transport: 9000, teaching: 9000, tax: 4800, pension: 3600,
    bank: { name: 'Fidelity Bank', code: '070', acct: '0110117004' }
  },
  {
    id: 87,
    staff_no: 'EPS/ST/013',
    name: 'Mrs. Kelechi Anya',
    role: 'Nursery 3 / Transition Class Teacher',
    email: 'kelechi.anya@eaglepowerschools.com.ng',
    phone: '08037788991',
    qualification: 'NCE / B.Ed Primary Education',
    assigned_class: 'Nursery 3',
    base: 70000, housing: 14000, transport: 9000, teaching: 9000, tax: 5000, pension: 3800,
    bank: { name: 'Access Bank', code: '044', acct: '0110117005' }
  },
  {
    id: 88,
    staff_no: 'EPS/ST/014',
    name: 'Mr. Sunday Alabi',
    role: 'Primary 1 Lead Class Teacher',
    email: 'sunday.alabi@eaglepowerschools.com.ng',
    phone: '08123344556',
    qualification: 'B.Ed Teacher Education',
    assigned_class: 'Primary 1',
    base: 72000, housing: 15000, transport: 10000, teaching: 10000, tax: 5200, pension: 4000,
    bank: { name: 'United Bank For Africa', code: '033', acct: '0110117006' }
  },
  {
    id: 89,
    staff_no: 'EPS/ST/015',
    name: 'Mrs. Nkechi Ubah',
    role: 'Primary 2 Lead Class Teacher',
    email: 'nkechi.ubah@eaglepowerschools.com.ng',
    phone: '08064455667',
    qualification: 'B.Sc (Ed) Educational Foundations',
    assigned_class: 'Primary 2',
    base: 72000, housing: 15000, transport: 10000, teaching: 10000, tax: 5200, pension: 4000,
    bank: { name: 'Guaranty Trust Bank', code: '058', acct: '0110117007' }
  },
  {
    id: 90,
    staff_no: 'EPS/ST/016',
    name: 'Mr. Chukwudi Nnamdi',
    role: 'Primary 3 Lead Class Teacher',
    email: 'chukwudi.nnamdi@eaglepowerschools.com.ng',
    phone: '08189900112',
    qualification: 'B.Ed Elementary Education',
    assigned_class: 'Primary 3',
    base: 74000, housing: 15000, transport: 10000, teaching: 10000, tax: 5400, pension: 4100,
    bank: { name: 'Zenith Bank', code: '057', acct: '0110117008' }
  },
  {
    id: 91,
    staff_no: 'EPS/ST/017',
    name: 'Mrs. Joy Eke',
    role: 'Primary 4 Lead Class Teacher',
    email: 'joy.eke@eaglepowerschools.com.ng',
    phone: '08027788119',
    qualification: 'NCE / B.A (Ed) English',
    assigned_class: 'Primary 4',
    base: 74000, housing: 15000, transport: 10000, teaching: 10000, tax: 5400, pension: 4100,
    bank: { name: 'First Bank of Nigeria', code: '011', acct: '0110117009' }
  },
  {
    id: 92,
    staff_no: 'EPS/ST/018',
    name: 'Mr. Daniel Bassey',
    role: 'Primary 5 Lead Class Teacher',
    email: 'daniel.bassey@eaglepowerschools.com.ng',
    phone: '08076655443',
    qualification: 'B.Sc (Ed) Curriculum Studies',
    assigned_class: 'Primary 5',
    base: 76000, housing: 15000, transport: 10000, teaching: 10000, tax: 5600, pension: 4200,
    bank: { name: 'Fidelity Bank', code: '070', acct: '0110117010' }
  },
  {
    id: 93,
    staff_no: 'EPS/ST/019',
    name: 'Mrs. Grace Nwachukwu',
    role: 'Primary 6 Head & National Exam Coach',
    email: 'grace.nwachukwu@eaglepowerschools.com.ng',
    phone: '08039988112',
    qualification: 'M.Ed Primary School Administration',
    assigned_class: 'Primary 6',
    base: 88000, housing: 18000, transport: 12000, teaching: 12000, tax: 6800, pension: 4900,
    bank: { name: 'Access Bank', code: '044', acct: '0110117011' }
  },
  {
    id: 94,
    staff_no: 'EPS/ST/020',
    name: 'Mr. Tochukwu Igwe',
    role: 'Economics & Financial Accounting Master',
    email: 'tochukwu.igwe@eaglepowerschools.com.ng',
    phone: '08154433221',
    qualification: 'B.Sc Economics, PGDE',
    assigned_class: 'Senior College (SS 1 - SS 3)',
    base: 80000, housing: 16000, transport: 11000, teaching: 11000, tax: 6000, pension: 4500,
    bank: { name: 'United Bank For Africa', code: '033', acct: '0110117012' }
  },
  {
    id: 95,
    staff_no: 'EPS/ST/021',
    name: 'Mrs. Ifunanya Umeh',
    role: 'French & Modern Foreign Languages Mistress',
    email: 'ifunanya.umeh@eaglepowerschools.com.ng',
    phone: '08091122445',
    qualification: 'B.A French & International Studies',
    assigned_class: 'JSS & SS College',
    base: 78000, housing: 16000, transport: 10000, teaching: 10000, tax: 5800, pension: 4200,
    bank: { name: 'Guaranty Trust Bank', code: '058', acct: '0110117013' }
  },
  {
    id: 96,
    staff_no: 'EPS/ST/022',
    name: 'Mr. Godwin Opara',
    role: 'Government, Civic & Social Studies Master',
    email: 'godwin.opara@eaglepowerschools.com.ng',
    phone: '08082233445',
    qualification: 'B.Sc Political Science, PGDE',
    assigned_class: 'JSS 1 - SS 3',
    base: 78000, housing: 16000, transport: 10000, teaching: 10000, tax: 5800, pension: 4200,
    bank: { name: 'Zenith Bank', code: '057', acct: '0110117014' }
  },
  {
    id: 97,
    staff_no: 'EPS/ST/023',
    name: 'Mrs. Patricia Okonkwo',
    role: 'Home Economics & Creative Arts Mistress',
    email: 'patricia.okonkwo@eaglepowerschools.com.ng',
    phone: '08036677889',
    qualification: 'B.Sc Home Science & Hospitality',
    assigned_class: 'JSS 1 - JSS 3',
    base: 75000, housing: 15000, transport: 10000, teaching: 10000, tax: 5500, pension: 4000,
    bank: { name: 'First Bank of Nigeria', code: '011', acct: '0110117015' }
  },
  {
    id: 98,
    staff_no: 'EPS/ST/024',
    name: 'Mr. Uchechukwu Agbo',
    role: 'Technical Drawing & Cultural Arts Master',
    email: 'uchechukwu.agbo@eaglepowerschools.com.ng',
    phone: '08173344556',
    qualification: 'B.Sc Industrial Technical Education',
    assigned_class: 'JSS & Senior Science',
    base: 75000, housing: 15000, transport: 10000, teaching: 10000, tax: 5500, pension: 4000,
    bank: { name: 'Fidelity Bank', code: '070', acct: '0110117016' }
  },
  {
    id: 99,
    staff_no: 'EPS/ST/025',
    name: 'Mr. Collins Eze',
    role: 'Physical & Health Education Sports Master',
    email: 'collins.eze@eaglepowerschools.com.ng',
    phone: '08028899001',
    qualification: 'B.Sc Human Kinetics & Sports Science',
    assigned_class: 'Campus Athletics & Gym',
    base: 74000, housing: 15000, transport: 10000, teaching: 10000, tax: 5400, pension: 4100,
    bank: { name: 'Access Bank', code: '044', acct: '0110117017' }
  },
  {
    id: 100,
    staff_no: 'EPS/ST/026',
    name: 'Mrs. Veronica Ike',
    role: 'Registered School Nurse & Health Matron',
    email: 'nurse@eaglepowerschools.com.ng',
    phone: '08031144558',
    qualification: 'RN, RM (Nursing & Midwifery Council)',
    assigned_class: 'Campus Health Bay',
    base: 70000, housing: 14000, transport: 9000, teaching: 8000, tax: 5000, pension: 3800,
    bank: { name: 'United Bank For Africa', code: '033', acct: '0110117018' }
  },
  {
    id: 101,
    staff_no: 'EPS/ST/027',
    name: 'Mr. Paulinus Okeke',
    role: 'Chief Campus Security & Safety Officer',
    email: 'security@eaglepowerschools.com.ng',
    phone: '08053322119',
    qualification: 'Diploma in Criminology & Security Ops',
    assigned_class: 'Campus Perimeter & Gates',
    base: 62000, housing: 12000, transport: 8000, teaching: 6000, tax: 4200, pension: 3200,
    bank: { name: 'Guaranty Trust Bank', code: '058', acct: '0110117019' }
  }
];

const updateStaff = db.prepare(`
  UPDATE staff 
  SET staff_no = ?, name = ?, role = ?, email = ?, phone = ?, qualification = ?, assigned_class = ?, is_active = 1
  WHERE id = ?
`);

const insertSalary = db.prepare(`
  INSERT INTO staff_salary_structures (
    staff_id, base_salary, housing_allowance, transport_allowance, teaching_allowance,
    tax_deduction, pension_deduction, other_deductions, net_salary
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(staff_id) DO UPDATE SET
    base_salary = excluded.base_salary,
    housing_allowance = excluded.housing_allowance,
    transport_allowance = excluded.transport_allowance,
    teaching_allowance = excluded.teaching_allowance,
    tax_deduction = excluded.tax_deduction,
    pension_deduction = excluded.pension_deduction,
    other_deductions = excluded.other_deductions,
    net_salary = excluded.net_salary,
    updated_at = CURRENT_TIMESTAMP
`);

const insertBank = db.prepare(`
  INSERT INTO staff_bank_accounts (
    staff_id, bank_name, bank_code, account_number, account_name, paystack_recipient_code, is_verified, verified_at
  ) VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
  ON CONFLICT(staff_id) DO UPDATE SET
    bank_name = excluded.bank_name,
    bank_code = excluded.bank_code,
    account_number = excluded.account_number,
    account_name = excluded.account_name,
    paystack_recipient_code = excluded.paystack_recipient_code,
    is_verified = 1,
    verified_at = CURRENT_TIMESTAMP
`);

let totalGross = 0;
let totalDeductions = 0;
let totalNet = 0;

db.exec('BEGIN TRANSACTION;');

for (const faculty of facultyData) {
  // 1. Update Staff Record
  updateStaff.run(
    faculty.staff_no,
    faculty.name,
    faculty.role,
    faculty.email,
    faculty.phone,
    faculty.qualification,
    faculty.assigned_class,
    faculty.id
  );

  // 2. Insert/Update Salary Structure
  const gross = faculty.base + faculty.housing + faculty.transport + faculty.teaching;
  const deductions = faculty.tax + faculty.pension;
  const net = gross - deductions;

  totalGross += gross;
  totalDeductions += deductions;
  totalNet += net;

  insertSalary.run(
    faculty.id,
    faculty.base,
    faculty.housing,
    faculty.transport,
    faculty.teaching,
    faculty.tax,
    faculty.pension,
    0,
    net
  );

  // 3. Insert/Update Bank Account
  const recipientCode = `RCP_${faculty.staff_no.replace(/[^A-Za-z0-9]/g, '')}_${Date.now().toString().slice(-4)}`;
  insertBank.run(
    faculty.id,
    faculty.bank.name,
    faculty.bank.code,
    faculty.bank.acct,
    faculty.name.toUpperCase(),
    recipientCode
  );
}

db.exec('COMMIT;');

console.log('✅ Successfully configured 27 staff members, salary structures, and bank accounts!');
console.log('📊 Payroll Summary:');
console.log(`   - Total Active Staff: ${facultyData.length}`);
console.log(`   - Configured Salary Structures: ${facultyData.length}`);
console.log(`   - Total Monthly Gross Payroll: ₦${totalGross.toLocaleString()}`);
console.log(`   - Total Monthly Deductions (Tax & Pension): ₦${totalDeductions.toLocaleString()}`);
console.log(`   - Total Monthly Net Payout: ₦${totalNet.toLocaleString()}`);
