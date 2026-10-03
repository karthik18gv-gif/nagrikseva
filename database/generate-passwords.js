/**
 * NagrikSeva Password Hash Generator
 * Run AFTER npm install in the backend folder:
 *   cd backend && node ../database/generate-passwords.js
 * Then paste the printed hashes into database/seed.sql
 */
const bcrypt = require('bcryptjs');
const accounts = [
  { label: 'Admin (admin / Admin@123)',           password: 'Admin@123' },
  { label: 'Officers (officer1,2 / Officer@123)', password: 'Officer@123' },
  { label: 'Employees (employee1,2 / Employee@123)', password: 'Employee@123' },
];
(async () => {
  console.log('\n====== NAGRIKSEVA PASSWORD HASHES ======\n');
  for (const acc of accounts) {
    const hash = await bcrypt.hash(acc.password, 10);
    console.log(acc.label);
    console.log('Hash:', hash, '\n');
  }
  console.log('Paste these into database/seed.sql replacing REPLACE_WITH_*_HASH');
})();
