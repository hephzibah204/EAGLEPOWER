import db from '../config/db.js';

const staffList = db.prepare('SELECT id, name, role FROM staff WHERE is_active = 1').all();

const nigerianBanks = [
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'Zenith Bank', code: '057' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'Access Bank', code: '044' },
  { name: 'United Bank For Africa', code: '033' },
  { name: 'Fidelity Bank', code: '070' }
];

const insertSalary = db.prepare(`
  INSERT INTO staff_salary_structures (
    staff_id, base_salary, housing_allowance, transport_allowance, teaching_allowance,
    tax_deduction, pension_deduction, other_deductions, net_salary
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(staff_id) DO UPDATE SET
    base_salary = excluded.base_salary,
    net_salary = excluded.net_salary
`);

const insertBank = db.prepare(`
  INSERT INTO staff_bank_accounts (
    staff_id, bank_name, bank_code, account_number, account_name, paystack_recipient_code, is_verified
  ) VALUES (?, ?, ?, ?, ?, ?, 1)
  ON CONFLICT(staff_id) DO UPDATE SET
    account_number = excluded.account_number,
    account_name = excluded.account_name
`);

let seeded = 0;
for (const s of staffList) {
  let base = 75000;
  let housing = 15000;
  let transport = 10000;
  let teaching = 10000;
  let tax = 5500;
  let pension = 4000;

  if (s.role.includes('Principal') || s.role.includes('Head')) {
    base = 150000; housing = 30000; transport = 20000; teaching = 20000; tax = 12000; pension = 8000;
  } else if (s.role.includes('Coordinator') || s.role.includes('Bursar')) {
    base = 110000; housing = 25000; transport = 15000; teaching = 15000; tax = 9000; pension = 6000;
  } else if (s.role.includes('Senior') || s.role.includes('Coach')) {
    base = 90000; housing = 20000; transport = 12000; teaching = 12000; tax = 7000; pension = 5000;
  }

  const gross = base + housing + transport + teaching;
  const deductions = tax + pension;
  const net = gross - deductions;

  insertSalary.run(s.id, base, housing, transport, teaching, tax, pension, 0, net);

  const bank = nigerianBanks[s.id % nigerianBanks.length];
  const acctNo = `01${(10000000 + s.id * 1423).toString().slice(-8)}`;
  const recipientCode = `RCP_mock_${s.id}_${Date.now().toString().slice(-4)}`;

  insertBank.run(s.id, bank.name, bank.code, acctNo, s.name.toUpperCase(), recipientCode);
  seeded++;
}

console.log(`Seeded payroll structure and bank accounts for ${seeded} staff members.`);
