# 📦 NagrikSeva — Installation Guide (VS Code)

## Prerequisites

| Software | Version |
|---|---|
| Node.js | v18+ |
| MySQL | v8.0+ |
| VS Code | Latest |

Verify:
```bash
node -v
npm -v
mysql --version
```

## 1. Extract & Open

```bash
cd nagrikseva
code .
```

## 2. Create the Database

```bash
mysql -u root -p < database/schema.sql
```

This creates `nagrikseva_db` with all 18 tables.

## 3. Generate Password Hashes (IMPORTANT)

```bash
cd backend
npm install
node ../database/generate-passwords.js
```

Copy the 3 printed hashes and paste them into `database/seed.sql`, replacing:
- `REPLACE_WITH_ADMIN_HASH`
- `REPLACE_WITH_OFFICER_HASH` (appears twice)
- `REPLACE_WITH_EMPLOYEE_HASH` (appears twice)

Save the file.

## 4. Seed the Database

```bash
# from project root
mysql -u root -p < database/seed.sql
```

## 5. Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set your real `DB_PASSWORD`.

## 6. Run Backend

```bash
npm install
npm run dev
```

Expect: `✅ MySQL Connected` and `🚀 NagrikSeva Server running on port 5000`. Test at http://localhost:5000/api/health

## 7. Run Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Visit **http://localhost:5173**

## Test Accounts

| Role | URL | Login |
|---|---|---|
| Citizen | /citizen/register | Register your own |
| Employee | /employee/login | employee1 / Employee@123 (Revenue) |
| Officer | /officer/login | officer1 / Officer@123 (Revenue) |

Every certificate type belongs to a department, and only staff in that same
department can process it. All departments now have staff (password is the
same across each role — Officer@123 for all officers, Employee@123 for all
employees):

| Department | Certificates | Employee login | Officer login |
|---|---|---|---|
| Revenue | Income, Caste, Domicile | employee1 | officer1 |
| Health | Birth, Death | employee3 | officer3 |
| Pension | (pension applications) | employee2 | officer2 |
| Social Welfare | Senior Citizen, Disability | employee4 | officer4 |
| Municipal Corporation | Residence | employee5 | officer5 |

If you already ran the old `seed.sql` before this fix, run
`database/patch_add_missing_staff.sql` once against your existing database
instead of re-seeding everything — it adds the missing staff and fixes
officer2/employee2's broken login without touching anything else.
| Admin | /admin/login | admin / Admin@123 |

## Full Workflow Test

1. Register a citizen → apply for Birth Certificate with a document upload
2. Login as `employee1` → Applications → Review → Verify & Forward
3. Login as `officer1` → Applications → Review → Approve & Generate Certificate
4. Login as the citizen → My Applications → status is Completed with Download button
5. Login as `admin` → see full dashboard analytics

## Troubleshooting

- **DB Connection Failed** → check MySQL is running and `.env` credentials
- **Invalid credentials for admin/officer/employee** → you skipped Step 3, regenerate hashes and re-seed
- **Frontend API errors** → make sure backend is running on port 5000 first
- **Port in use** → change `PORT` in backend `.env` and update `frontend/vite.config.js` proxy target
