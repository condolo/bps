// Seeds Mascit Lab Academy demo school (schoolId: 'demo')
// Run: node scripts/seed-demo.js

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) { console.error('MONGODB_URI env var required'); process.exit(1); }

const SCHOOL = 'demo';
const now = new Date().toISOString();
const HOUSES = ['yellow', 'red', 'green', 'blue'];
const rh = () => HOUSES[Math.floor(Math.random() * 4)];

const BRAND = {
  schoolId: SCHOOL,
  schoolName: "Mascit Lab Academy",
  motto: "Learn. Grow. Lead.",
  logoUrl: "",
  primaryColor: "#0f766e",
  secondaryColor: "#0d9488",
  accentColor: "#ccfbf1",
  buttonColor: "#0d9488",
  highlightColor: "#f0fdfa",
  borderColor: "#99f6e4",
  address: "Nairobi, Kenya",
  phone: "", email: "info@mascitlab.ac.ke", website: "",
  facebook: "", twitter: "", instagram: "", whatsapp: "",
};

const STUDENTS = [
  { id:"d-s01", name:"Alex Mugo",        grade:"Y7/1",  createdAt:now },
  { id:"d-s02", name:"Sophie Kimani",     grade:"Y7/1",  createdAt:now },
  { id:"d-s03", name:"Brian Omondi",      grade:"Y7/1",  createdAt:now },
  { id:"d-s04", name:"Fatuma Hassan",     grade:"Y7/2",  createdAt:now },
  { id:"d-s05", name:"Peter Njuguna",     grade:"Y7/2",  createdAt:now },
  { id:"d-s06", name:"Grace Wanjiku",     grade:"Y8/1",  createdAt:now },
  { id:"d-s07", name:"James Otieno",      grade:"Y8/1",  createdAt:now },
  { id:"d-s08", name:"Linda Achieng",     grade:"Y8/1",  createdAt:now },
  { id:"d-s09", name:"Michael Karanja",   grade:"Y8/2",  createdAt:now },
  { id:"d-s10", name:"Faith Mwangi",      grade:"Y8/2",  createdAt:now },
  { id:"d-s11", name:"David Odhiambo",    grade:"Y9/1",  createdAt:now },
  { id:"d-s12", name:"Irene Chebet",      grade:"Y9/1",  createdAt:now },
  { id:"d-s13", name:"Samuel Nduati",     grade:"Y9/2",  createdAt:now },
  { id:"d-s14", name:"Rose Auma",         grade:"Y9/2",  createdAt:now },
  { id:"d-s15", name:"Collins Mutua",     grade:"Y9/3",  createdAt:now },
  { id:"d-s16", name:"Diana Njeri",       grade:"Y10/1", createdAt:now },
  { id:"d-s17", name:"Eric Kamau",        grade:"Y10/1", createdAt:now },
  { id:"d-s18", name:"Anne Wambua",       grade:"Y10/2", createdAt:now },
  { id:"d-s19", name:"George Maina",      grade:"Y10/2", createdAt:now },
  { id:"d-s20", name:"Beatrice Awuor",    grade:"Y10/3", createdAt:now },
].map(s => ({ ...s, schoolId: SCHOOL, houseId: rh(), gender: "" }));

const USERS = [
  // Staff
  { id:"d-u01", name:"Demo Admin",        email:"demo.admin@mascitlab.ac.ke",      role:"admin",         pin:"0000", year:"",      studentId:"", childIds:[] },
  { id:"d-u02", name:"Ms. Akinyi",        email:"demo.pastoral@mascitlab.ac.ke",   role:"dean_pastoral", pin:"1111", year:"",      studentId:"", childIds:[] },
  { id:"d-u03", name:"Mr. Kamau",         email:"demo.ks3@mascitlab.ac.ke",        role:"ks3",           pin:"2222", year:"",      studentId:"", childIds:[] },
  { id:"d-u04", name:"Mrs. Njoroge",      email:"demo.teacher@mascitlab.ac.ke",    role:"teacher",       pin:"3333", year:"Y8/1",  studentId:"", childIds:[] },
  { id:"d-u05", name:"Mr. Odhiambo",      email:"demo.discipline@mascitlab.ac.ke", role:"discipline",    pin:"4444", year:"",      studentId:"", childIds:[] },
  // Student
  { id:"d-u06", name:"Alex Mugo",         email:"demo.student@mascitlab.ac.ke",    role:"student",       pin:"5555", year:"Y7/1",  studentId:"d-s01", childIds:[] },
  // Parent
  { id:"d-u07", name:"Mrs. Mugo",         email:"demo.parent@mascitlab.ac.ke",     role:"parent",        pin:"6666", year:"",      studentId:"", childIds:["d-s01"] },
].map(u => ({ ...u, schoolId: SCHOOL, createdAt: now }));

const T = Date.now();
const LOGS = [
  { id:"d-l1", schoolId:SCHOOL, studentId:"d-s01", staffId:"d-u04", behaviourId:"ca_m3", type:"merit",   points:3,  note:"",                        timestamp:T-86400000,  status:"active" },
  { id:"d-l2", schoolId:SCHOOL, studentId:"d-s06", staffId:"d-u04", behaviourId:"sr_d3", type:"demerit", points:-1, note:"",                        timestamp:T-172800000, status:"active" },
  { id:"d-l3", schoolId:SCHOOL, studentId:"d-s11", staffId:"d-u02", behaviourId:"ca_m4", type:"merit",   points:2,  note:"Outstanding presentation", timestamp:T-43200000,  status:"active" },
  { id:"d-l4", schoolId:SCHOOL, studentId:"d-s16", staffId:"d-u04", behaviourId:"ca_d3", type:"demerit", points:-2, note:"",                        timestamp:T-21600000,  status:"active" },
];

const NOTIFS = [
  { id:"d-n1", schoolId:SCHOOL, type:"merit",   studentId:"d-s01", studentName:"Alex Mugo",     grade:"Y7/1",  staffName:"Mrs. Njoroge", behaviour:"Excellent class contribution", points:3,  note:"", timestamp:T-86400000,  readBy:[], notifType:"log" },
  { id:"d-n2", schoolId:SCHOOL, type:"demerit", studentId:"d-s06", studentName:"Grace Wanjiku",  grade:"Y8/1",  staffName:"Mrs. Njoroge", behaviour:"Uniform non-compliance (minor)", points:-1, note:"", timestamp:T-172800000, readBy:[], notifType:"log" },
  { id:"d-n3", schoolId:SCHOOL, type:"merit",   studentId:"d-s11", studentName:"David Odhiambo", grade:"Y9/1",  staffName:"Ms. Akinyi",  behaviour:"Outstanding achievement",       points:2,  note:"Outstanding presentation", timestamp:T-43200000, readBy:[], notifType:"log" },
];

async function run() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db('bps');

  // Clear existing demo data
  for (const c of ['students','users','logs','notifications','appeals','brand']) {
    await db.collection(c).deleteMany({ schoolId: SCHOOL });
  }

  await db.collection('brand').insertOne(BRAND);
  await db.collection('students').insertMany(STUDENTS);
  await db.collection('users').insertMany(USERS);
  await db.collection('logs').insertMany(LOGS);
  await db.collection('notifications').insertMany(NOTIFS);

  console.log(`Demo school seeded:`);
  console.log(`  Brand:         Mascit Lab Academy`);
  console.log(`  Students:      ${STUDENTS.length}`);
  console.log(`  Users:         ${USERS.length}`);
  console.log(`  Logs:          ${LOGS.length}`);
  console.log(`  Notifications: ${NOTIFS.length}`);

  await client.close();
}

run().catch(err => { console.error(err); process.exit(1); });
