// =========================================================
// Certificate & Pension Letter PDF generator
// Produces a real, downloadable PDF for each completed application,
// with a distinct border/color/layout per certificate type — not a
// single generic template reused for everything.
// =========================================================
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const CERT_DIR = path.join(__dirname, '..', 'uploads', 'certificates');
const LETTER_DIR = path.join(__dirname, '..', 'uploads', 'pension-letters');
[CERT_DIR, LETTER_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// Per certificate-type visual identity: accent color, border style, and a
// short ceremonial phrase used in the body text. Falls back to DEFAULT_THEME
// for any certificate code not listed here (e.g. future certificate types
// added later through Admin > Certificate Types).
const THEMES = {
  BIRTH:      { accent: '#1d6fa5', border: 'double',  seal: '👶', title: 'BIRTH CERTIFICATE',        phrase: 'was born on the date recorded below, as per official birth records maintained by this office.' },
  DEATH:      { accent: '#3a3f47', border: 'single',  seal: '🕊️', title: 'DEATH CERTIFICATE',         phrase: 'passed away on the date recorded below, as per official death records maintained by this office.' },
  INCOME:     { accent: '#1c7a4d', border: 'double',  seal: '₹',  title: 'INCOME CERTIFICATE',        phrase: 'has been assessed and their annual family income has been recorded as per the details below.' },
  CASTE:      { accent: '#6b3fa0', border: 'ornate',  seal: '॑',  title: 'CASTE CERTIFICATE',          phrase: 'belongs to the caste/community recorded below, as verified through supporting documents submitted.' },
  RESIDENCE:  { accent: '#0f7d8a', border: 'single',  seal: '🏠', title: 'RESIDENCE CERTIFICATE',      phrase: 'is a permanent resident of the address recorded below, within the state of Karnataka.' },
  DOMICILE:   { accent: '#8a5a1c', border: 'double',  seal: '🏛️', title: 'DOMICILE CERTIFICATE',       phrase: 'is a bona fide domicile of the State of Karnataka, having resided here as per records.' },
  SENIOR:     { accent: '#b5651d', border: 'single',  seal: '👴', title: 'SENIOR CITIZEN CERTIFICATE', phrase: 'is a senior citizen aged 60 years or above and is entitled to applicable government benefits.' },
  DISABILITY: { accent: '#4a4fa0', border: 'ornate',  seal: '♿', title: 'DISABILITY CERTIFICATE',     phrase: 'has been assessed and certified as a person with disability as per medical evaluation records.' },
  DEFAULT:    { accent: '#1a3a6b', border: 'single',  seal: '📄', title: 'CERTIFICATE',                phrase: 'is certified in respect of the matter recorded below, as per government records.' },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

function drawBorder(doc, theme) {
  const { width, height } = doc.page;
  const margin = 24;
  doc.save();
  doc.lineWidth(2).strokeColor(theme.accent).rect(margin, margin, width - margin*2, height - margin*2).stroke();
  if (theme.border === 'double') {
    doc.lineWidth(0.75).rect(margin + 8, margin + 8, width - (margin+8)*2, height - (margin+8)*2).stroke();
  }
  if (theme.border === 'ornate') {
    doc.lineWidth(0.75).dash(3, { space: 3 }).rect(margin + 8, margin + 8, width - (margin+8)*2, height - (margin+8)*2).stroke().undash();
    // corner flourishes
    [[margin+8,margin+8],[width-margin-8,margin+8],[margin+8,height-margin-8],[width-margin-8,height-margin-8]].forEach(([x,y]) => {
      doc.circle(x, y, 4).fillColor(theme.accent).fill();
    });
  }
  doc.restore();
}

function drawHeader(doc, theme, deptName) {
  const { width } = doc.page;
  doc.save();
  doc.fillColor(theme.accent).fontSize(9).font('Helvetica-Bold')
     .text('GOVERNMENT OF KARNATAKA', 0, 50, { align: 'center', width });
  doc.fontSize(8).font('Helvetica').fillColor('#555')
     .text(deptName ? `${deptName} · NagrikSeva Citizen Services Portal` : 'NagrikSeva Citizen Services Portal', { align: 'center', width });
  doc.moveDown(0.6);
  doc.fontSize(22).font('Helvetica-Bold').fillColor(theme.accent)
     .text(`${theme.seal}  ${theme.title}`, { align: 'center', width });
  doc.moveTo(width/2 - 90, doc.y + 6).lineTo(width/2 + 90, doc.y + 6).lineWidth(1.5).strokeColor(theme.accent).stroke();
  doc.restore();
  doc.moveDown(2);
}

function drawDetailsTable(doc, rows, theme) {
  const startX = 90, colGap = 170;
  rows.forEach(([label, value]) => {
    const y = doc.y;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#333').text(label, startX, y, { width: colGap - 10 });
    doc.font('Helvetica').fillColor('#111').text(value || '—', startX + colGap, y, { width: 300 });
    doc.moveDown(0.6);
  });
}

function drawFooter(doc, theme, { application_number, certificate_number, issuedOn }) {
  const { width, height } = doc.page;
  const y = height - 150;
  doc.save();
  doc.fontSize(8).fillColor('#666')
     .text(`Application No: ${application_number}`, 90, y)
     .text(`Certificate No: ${certificate_number}`, 90, y + 14)
     .text(`Issued On: ${fmtDate(issuedOn)}`, 90, y + 28);

  doc.fontSize(9).fillColor('#333').text('_____________________________', width - 260, y, { width: 200, align: 'center' });
  doc.text('Authorized Signatory', width - 260, y + 14, { width: 200, align: 'center' });
  doc.fontSize(7).fillColor('#888').text('(Digitally issued via NagrikSeva Portal)', width - 260, y + 28, { width: 200, align: 'center' });

  doc.fontSize(7).fillColor('#999')
     .text('This is a computer-generated certificate issued through the NagrikSeva e-Governance Portal.', 90, height - 60, { width: width - 180, align: 'center' });
  doc.restore();
}

/**
 * Generates a certificate PDF and saves it to disk.
 * @returns {string} the filename (not full path) to store in applications.certificate_path
 */
function generateCertificatePDF({ application, citizen, certificateCode, departmentName, certificateNumber }) {
  const theme = THEMES[certificateCode] || THEMES.DEFAULT;
  const filename = `${certificateNumber.replace(/\//g, '_')}.pdf`;
  const filepath = path.join(CERT_DIR, filename);

  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  doc.pipe(fs.createWriteStream(filepath));

  drawBorder(doc, theme);
  drawHeader(doc, theme, departmentName);

  const fullName = [citizen.first_name, citizen.middle_name, citizen.last_name].filter(Boolean).join(' ');
  doc.fontSize(11).font('Helvetica').fillColor('#222')
     .text(`This is to certify that Mr./Ms./Mrs. `, 90, doc.y, { continued: true })
     .font('Helvetica-Bold').text(fullName, { continued: true })
     .font('Helvetica').text(` ${theme.phrase}`, { width: 415 });
  doc.moveDown(1.2);

  const addressParts = [citizen.house_number, citizen.street, citizen.area, citizen.village].filter(Boolean).join(', ');
  const rows = [
    ['Father\'s Name', citizen.father_name],
    ['Date of Birth', citizen.dob ? fmtDate(citizen.dob) : '—'],
    ['Gender', citizen.gender ? citizen.gender.charAt(0).toUpperCase()+citizen.gender.slice(1) : '—'],
    ['Category', citizen.category ? citizen.category.toUpperCase() : '—'],
    ['Aadhaar No.', citizen.aadhaar_number],
    ['Address', addressParts || '—'],
    ['Purpose', application.purpose || 'General purpose'],
  ];
  drawDetailsTable(doc, rows, theme);

  drawFooter(doc, theme, {
    application_number: application.application_number,
    certificate_number: certificateNumber,
    issuedOn: new Date(),
  });

  doc.end();
  return filename;
}

/**
 * Generates a pension approval letter PDF for an employee.
 * @returns {string} the filename (not full path) to store in pension_applications.letter_path
 */
function generatePensionLetterPDF({ pension }) {
  const theme = { accent: '#1a3a6b', border: 'double', seal: '💼', title: 'PENSION APPROVAL LETTER', phrase: '' };
  const filename = `${pension.application_number}.pdf`;
  const filepath = path.join(LETTER_DIR, filename);

  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  doc.pipe(fs.createWriteStream(filepath));

  drawBorder(doc, theme);
  drawHeader(doc, theme, 'Pension Department');

  doc.fontSize(11).font('Helvetica').fillColor('#222')
     .text(`This letter confirms that the pension application filed by `, 90, doc.y, { continued: true })
     .font('Helvetica-Bold').text(pension.employee_name, { continued: true })
     .font('Helvetica').text(` has been reviewed and approved. The applicant is entitled to receive a monthly pension as detailed below, credited to the registered bank account.`, { width: 415 });
  doc.moveDown(1.2);

  const rows = [
    ['Employee ID', pension.employee_id_no],
    ['Designation', pension.designation],
    ['Date of Joining', fmtDate(pension.date_of_joining)],
    ['Date of Retirement', fmtDate(pension.date_of_retirement)],
    ['Years of Service', pension.years_of_service ? `${pension.years_of_service} years` : '—'],
    ['Monthly Pension Amount', pension.estimated_pension ? `₹ ${Number(pension.estimated_pension).toLocaleString('en-IN')} / month` : '—'],
    ['Bank Name', pension.bank_name],
    ['Account Number', pension.bank_account],
    ['IFSC Code', pension.bank_ifsc],
  ];
  drawDetailsTable(doc, rows, theme);

  doc.moveDown(1);
  doc.fontSize(9).font('Helvetica-Oblique').fillColor('#555')
     .text('The monthly pension amount above will be credited to the registered bank account on a recurring basis, subject to standard government disbursement schedules.', 90, doc.y, { width: 415 });

  drawFooter(doc, theme, {
    application_number: pension.application_number,
    certificate_number: `PENSION-APPROVED-${pension.id}`,
    issuedOn: new Date(),
  });

  doc.end();
  return filename;
}

module.exports = { generateCertificatePDF, generatePensionLetterPDF };
