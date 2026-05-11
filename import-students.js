// One-time import script: reads Excel, writes to data.json
// Run: node import-students.js

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const EXCEL_PATH = 'C:/Users/Ndolo/Downloads/HIGH SCHOOL STUDENT DATABASE TERM 3 2025-2026.xlsx';
const DATA_PATH = path.join(__dirname, 'data.json');
const HOUSES = ['yellow', 'red', 'green', 'blue'];

function formToGrade(form) {
  const map = {
    '7i':'Y7/1','7ii':'Y7/2',
    '8i':'Y8/1','8ii':'Y8/2',
    '9i':'Y9/1','9ii':'Y9/2','9iii':'Y9/3',
    '10i':'Y10/1','10ii':'Y10/2','10iii':'Y10/3',
    '11i':'Y11/1','11ii':'Y11/2',
    '12i':'Y12/1','12ii':'Y12/2',
  };
  return map[String(form).trim().toLowerCase()] || String(form);
}

function randomHouse() {
  return HOUSES[Math.floor(Math.random() * HOUSES.length)];
}

function slugEmail(name, fallbackSuffix) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/, '')
    + fallbackSuffix;
}

function phonePin(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  return digits.length >= 4 ? digits.slice(-4) : null;
}

function admissionPin(admNo) {
  const digits = String(admNo).replace(/\D/g, '');
  return digits.length >= 4 ? digits.slice(-4) : digits.padStart(4, '0');
}

// Load existing db to preserve staff, brand, logs, etc.
let db = { students: [], users: [], logs: [], notifications: [], appeals: [], brand: {} };
if (fs.existsSync(DATA_PATH)) {
  try { db = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')); } catch (_) {}
}

// Strip old students and student/parent users (keep staff)
const STAFF_ROLES = ['admin','principal','dean_pastoral','dean_academic','discipline','ks3','ks4','ks5','teacher'];
db.students = [];
db.users = db.users.filter(u => STAFF_ROLES.includes(u.role));

// Read Excel
const wb = XLSX.readFile(EXCEL_PATH);
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }).slice(1); // skip header

const now = new Date().toISOString();
let idSeq = 1000;
const nextId = () => String(++idSeq);

// Track parent emails to avoid duplicate accounts
const parentByEmail = new Map();
const parentByName = new Map();

for (const row of rows) {
  const [sno, admNo, surname, firstName, middleName, gender, relationship, contactName, contactPhone, contactEmail, , , form] = row;

  if (!surname && !firstName) continue; // skip empty rows

  const studentName = [firstName, middleName, surname].filter(Boolean).join(' ').trim();
  const studentId = nextId();

  // Student record
  db.students.push({
    id: studentId,
    name: studentName,
    houseId: randomHouse(),
    grade: formToGrade(form),
    admissionNumber: String(admNo || ''),
    gender: gender || '',
    createdAt: now,
  });

  // Student user account
  const studentEmail = slugEmail(`${firstName || ''}.${surname || ''}`, '@staustin.ac.ke');
  const studentPin = admissionPin(admNo);
  db.users.push({
    id: nextId(),
    name: studentName,
    email: studentEmail,
    role: 'student',
    pin: studentPin,
    studentId: studentId,
    createdAt: now,
  });

  // Parent user account
  if (contactName) {
    const parentEmail = contactEmail
      ? String(contactEmail).trim().toLowerCase()
      : slugEmail(contactName, '@staustin.ac.ke');

    const mapKey = parentEmail;
    if (parentByEmail.has(mapKey)) {
      // Already created — add this child
      const existing = parentByEmail.get(mapKey);
      if (!existing.childIds.includes(studentId)) existing.childIds.push(studentId);
    } else {
      const parentPin = phonePin(contactPhone) || admissionPin(admNo);
      const parentUser = {
        id: nextId(),
        name: contactName.trim(),
        email: parentEmail,
        role: 'parent',
        pin: parentPin,
        childIds: [studentId],
        relationship: relationship || 'Parent',
        createdAt: now,
      };
      db.users.push(parentUser);
      parentByEmail.set(mapKey, parentUser);
    }
  }
}

fs.writeFileSync(DATA_PATH, JSON.stringify(db, null, 2));

const studentCount = db.students.length;
const parentCount = db.users.filter(u => u.role === 'parent').length;
const studentUserCount = db.users.filter(u => u.role === 'student').length;
const staffCount = db.users.filter(u => STAFF_ROLES.includes(u.role)).length;

console.log('Import complete.');
console.log(`  Students:      ${studentCount}`);
console.log(`  Student users: ${studentUserCount}`);
console.log(`  Parent users:  ${parentCount}`);
console.log(`  Staff users:   ${staffCount} (preserved)`);
console.log(`  Total users:   ${db.users.length}`);
console.log(`\ndata.json written to: ${DATA_PATH}`);
