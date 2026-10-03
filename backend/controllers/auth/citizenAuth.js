const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/db');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { logActivity } = require('../../utils/logger');

const genToken = (p) => jwt.sign(p, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.register = async (req, res) => {
  try {
    const { username, email, password, first_name, middle_name, last_name, gender, dob,
      father_name, mother_name, religion, category, occupation, marital_status, blood_group,
      mobile, alternate_mobile, emergency_contact, emergency_contact_number,
      house_number, street, area, village, taluk_id, district_id, state_id, pin_code,
      aadhaar_number, pan_number, voter_id, driving_license, passport_number, ration_card,
      security_question, security_answer } = req.body;

    // 1. Mandatory field checks
    if (!first_name || !first_name.trim()) return errorResponse(res, 'First name is required.', 400);
    if (!last_name || !last_name.trim()) return errorResponse(res, 'Last name (surname) is required.', 400);
    if (!email || !email.trim()) return errorResponse(res, 'Email address is required.', 400);
    if (!mobile || !mobile.trim()) return errorResponse(res, 'Mobile number is required.', 400);
    if (!aadhaar_number || !aadhaar_number.trim()) return errorResponse(res, 'Aadhaar number is required.', 400);
    if (!username || !username.trim()) return errorResponse(res, 'Username is required.', 400);
    if (!password || password.length < 8) return errorResponse(res, 'Password must be at least 8 characters long.', 400);

    // 2. Format Validations
    const cleanMobile = mobile.trim();
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return errorResponse(res, 'Invalid mobile number. Must be a valid 10-digit Indian mobile number.', 400);
    }

    const cleanAadhaar = aadhaar_number.trim().replace(/\s+/g, '');
    if (!/^\d{12}$/.test(cleanAadhaar)) {
      return errorResponse(res, 'Invalid Aadhaar number. Must be exactly 12 digits.', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return errorResponse(res, 'Invalid email format.', 400);
    }

    // 3. Unique credential checks
    const [existingCreds] = await pool.execute(
      `SELECT username, email, mobile, aadhaar_number, pan_number FROM citizens
       WHERE username=? OR email=? OR mobile=? OR aadhaar_number=? ${pan_number ? 'OR pan_number=?' : ''}`,
      pan_number ? [username.trim(), email.trim(), cleanMobile, cleanAadhaar, pan_number.trim()] : [username.trim(), email.trim(), cleanMobile, cleanAadhaar]
    );

    if (existingCreds.length > 0) {
      const match = existingCreds[0];
      if (match.username.toLowerCase() === username.trim().toLowerCase()) {
        return errorResponse(res, 'Username is already taken. Please choose a different username.', 409);
      }
      if (match.email.toLowerCase() === email.trim().toLowerCase()) {
        return errorResponse(res, 'Email address is already registered. Please use another email or login.', 409);
      }
      if (match.mobile === cleanMobile) {
        return errorResponse(res, 'Mobile number is already registered with an existing citizen account.', 409);
      }
      if (match.aadhaar_number === cleanAadhaar) {
        return errorResponse(res, 'Aadhaar number is already registered in the citizen portal.', 409);
      }
      if (pan_number && match.pan_number && match.pan_number.toLowerCase() === pan_number.trim().toLowerCase()) {
        return errorResponse(res, 'PAN number is already registered with another account.', 409);
      }
      return errorResponse(res, 'A citizen account with these unique credentials already exists.', 409);
    }

    // 4. Smart Name & Demographic Duplicate Detection:
    // Different citizens can share the same first name (e.g. Rahul Sharma vs Rahul Verma),
    // but identical full name (same first name AND same last name) with matching DOB or parent name is blocked.
    const cleanFirst = first_name.trim();
    const cleanLast = last_name.trim();

    if (dob || father_name) {
      const [duplicateNameMatch] = await pool.execute(
        `SELECT id FROM citizens
         WHERE LOWER(TRIM(first_name))=LOWER(?) AND LOWER(TRIM(last_name))=LOWER(?)
         AND (dob=? OR (father_name IS NOT NULL AND LOWER(TRIM(father_name))=LOWER(?)))`,
        [cleanFirst, cleanLast, dob || '1900-01-01', (father_name || '').trim()]
      );

      if (duplicateNameMatch.length > 0) {
        return errorResponse(res, 'A citizen with the exact same full name and demographic records is already registered.', 409);
      }
    }

    const hashed = await bcrypt.hash(password, 10);
    const hashedAns = security_answer ? await bcrypt.hash(security_answer.toLowerCase().trim(), 10) : null;
    const photo = req.file ? req.file.filename : null;
    const age = dob ? new Date().getFullYear() - new Date(dob).getFullYear() : null;

    const [r] = await pool.execute(
      `INSERT INTO citizens (username,email,password,first_name,middle_name,last_name,gender,dob,age,
       father_name,mother_name,religion,category,occupation,marital_status,blood_group,photo,
       mobile,alternate_mobile,emergency_contact,emergency_contact_number,
       house_number,street,area,village,taluk_id,district_id,state_id,pin_code,
       aadhaar_number,pan_number,voter_id,driving_license,passport_number,ration_card,
       security_question,security_answer) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [username.trim(),email.trim().toLowerCase(),hashed,cleanFirst,middle_name?middle_name.trim():null,cleanLast,gender||'male',dob,age,
       father_name?father_name.trim():null,mother_name?mother_name.trim():null,religion||null,category||'general',
       occupation||null,marital_status||'single',blood_group||null,photo,
       cleanMobile,alternate_mobile?alternate_mobile.trim():null,emergency_contact||null,emergency_contact_number||null,
       house_number||null,street||null,area||null,village||null,
       taluk_id||null,district_id||null,state_id||null,pin_code||null,
       cleanAadhaar,pan_number?pan_number.trim().toUpperCase():null,voter_id?voter_id.trim():null,driving_license?driving_license.trim():null,
       passport_number?passport_number.trim():null,ration_card?ration_card.trim():null,security_question||null,hashedAns]
    );
    await logActivity('citizen', r.insertId, 'Citizen registered', req.ip);
    return successResponse(res, { id: r.insertId }, 'Registration successful! You can now log in.', 201);
  } catch (err) { return errorResponse(res, err.message); }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.execute('SELECT * FROM citizens WHERE username=? AND is_active=1', [username]);
    if (!rows.length) return errorResponse(res, 'Invalid credentials.', 401);
    const citizen = rows[0];
    if (!await bcrypt.compare(password, citizen.password)) return errorResponse(res, 'Invalid credentials.', 401);
    await pool.execute('UPDATE citizens SET last_login=NOW() WHERE id=?', [citizen.id]);
    await logActivity('citizen', citizen.id, 'Login', req.ip);
    const token = genToken({ id: citizen.id, role: 'citizen', username: citizen.username });
    const { password: _, security_answer: __, ...data } = citizen;
    return successResponse(res, { token, citizen: data }, 'Login successful');
  } catch (err) { return errorResponse(res, err.message); }
};

exports.getProfile = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.*,s.name as state_name,d.name as district_name,t.name as taluk_name
       FROM citizens c LEFT JOIN states s ON c.state_id=s.id
       LEFT JOIN districts d ON c.district_id=d.id LEFT JOIN taluks t ON c.taluk_id=t.id
       WHERE c.id=?`, [req.user.id]);
    if (!rows.length) return errorResponse(res, 'Not found', 404);
    const { password, security_answer, ...profile } = rows[0];
    return successResponse(res, profile);
  } catch (err) { return errorResponse(res, err.message); }
};

exports.updateProfile = async (req, res) => {
  try {
    const { first_name, middle_name, last_name, mobile, alternate_mobile,
      emergency_contact, emergency_contact_number, house_number, street, area,
      village, taluk_id, district_id, state_id, pin_code, occupation, marital_status, blood_group } = req.body;
    const photo = req.file ? req.file.filename : null;
    // FIX: photo filename was previously spliced directly into the SQL string
    // (`, photo='${photo}'`) instead of being bound as a parameter. multer's
    // generated filenames aren't user-controlled today, but this pattern is a
    // SQL injection risk waiting to happen the moment that assumption changes.
    // Bind it as a normal parameter and use COALESCE so an update without a new
    // photo doesn't wipe the existing one.
    await pool.execute(
      `UPDATE citizens SET first_name=?,middle_name=?,last_name=?,mobile=?,alternate_mobile=?,
       emergency_contact=?,emergency_contact_number=?,house_number=?,street=?,area=?,village=?,
       taluk_id=?,district_id=?,state_id=?,pin_code=?,occupation=?,marital_status=?,blood_group=?,
       photo=COALESCE(?,photo) WHERE id=?`,
      [first_name,middle_name||null,last_name,mobile,alternate_mobile||null,
       emergency_contact||null,emergency_contact_number||null,house_number||null,street||null,
       area||null,village||null,taluk_id||null,district_id||null,state_id||null,pin_code||null,
       occupation||null,marital_status||'single',blood_group||null,photo,req.user.id]
    );
    return successResponse(res, null, 'Profile updated');
  } catch (err) { return errorResponse(res, err.message); }
};

exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const [rows] = await pool.execute('SELECT password FROM citizens WHERE id=?', [req.user.id]);
    if (!await bcrypt.compare(current_password, rows[0].password)) return errorResponse(res, 'Current password incorrect', 400);
    await pool.execute('UPDATE citizens SET password=? WHERE id=?', [await bcrypt.hash(new_password, 10), req.user.id]);
    return successResponse(res, null, 'Password changed');
  } catch (err) { return errorResponse(res, err.message); }
};
