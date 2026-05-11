const express    = require('express');
const path       = require('path');
const { MongoClient } = require('mongodb');

const app  = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) { console.error('MONGODB_URI env var is required'); process.exit(1); }
const DB_NAME   = 'bps';

app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-School-Id');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ─── DB ───────────────────────────────────────────────────────────────────────
const DEFAULT_BRAND = {
  schoolName: "St. Austin's Academy",
  motto: "Dare to Be",
  logoUrl: "",
  primaryColor: "#4a1a7a",
  secondaryColor: "#6b21a8",
  accentColor: "#e9d5ff",
  buttonColor: "#6b21a8",
  highlightColor: "#f3e8ff",
  borderColor: "#c4b5fd",
  address: "Nairobi, Kenya",
  phone: "", email: "", website: "",
  facebook: "", twitter: "", instagram: "", whatsapp: "",
};

let mdb; // MongoDB database handle
const col = name => mdb.collection(name);
const noId = { projection: { _id: 0 } };

// Inject schoolId from header on every request
app.use((req, res, next) => {
  req.schoolId = (req.headers['x-school-id'] || 'saa').toLowerCase();
  next();
});

// ─── AUTH ─────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, pin } = req.body;
    // Login searches across all schools — schoolId is embedded in the user record
    const user = await col('users').findOne(
      { email: { $regex: new RegExp(`^${(email||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`, 'i') }, pin: String(pin) },
      noId
    );
    if (!user) return res.status(401).json({ error: 'Invalid email or PIN.' });
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── STUDENTS ─────────────────────────────────────────────────────────────────
app.get('/api/students', async (req, res) => {
  try {
    res.json(await col('students').find({ schoolId: req.schoolId }, noId).toArray());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/students', async (req, res) => {
  try {
    const s = { ...req.body, schoolId: req.schoolId };
    await col('students').updateOne({ id: s.id, schoolId: req.schoolId }, { $setOnInsert: s }, { upsert: true });
    res.json(s);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/students/bulk', async (req, res) => {
  try {
    const incoming = (req.body.students || []);
    if (!incoming.length) return res.json({ count: 0, students: [] });
    const existing = new Set(
      (await col('students').find({ schoolId: req.schoolId }, { projection: { _id: 0, name: 1 } }).toArray()).map(s => s.name.toLowerCase())
    );
    const newOnes = incoming.filter(s => !existing.has(s.name.toLowerCase())).map(s => ({ ...s, schoolId: req.schoolId }));
    if (newOnes.length) await col('students').insertMany(newOnes);
    res.json({ count: newOnes.length, students: newOnes });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    await col('students').deleteOne({ id: req.params.id, schoolId: req.schoolId });
    await col('logs').deleteMany({ studentId: req.params.id, schoolId: req.schoolId });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── USERS ────────────────────────────────────────────────────────────────────
app.get('/api/users', async (req, res) => {
  try {
    res.json(await col('users').find({ schoolId: req.schoolId }, noId).toArray());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users', async (req, res) => {
  try {
    const u = { ...req.body, schoolId: req.schoolId };
    const exists = await col('users').findOne(
      { email: { $regex: new RegExp(`^${u.email.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`, 'i') }, schoolId: req.schoolId }
    );
    if (exists) return res.status(400).json({ error: 'Email already registered.' });
    await col('users').insertOne({ ...u });
    res.json(u);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/users/:id', async (req, res) => {
  try {
    const update = { ...req.body };
    delete update.schoolId;
    if (update.pin === '') delete update.pin;
    const result = await col('users').findOneAndUpdate(
      { id: req.params.id, schoolId: req.schoolId },
      { $set: update },
      { returnDocument: 'after', projection: { _id: 0 } }
    );
    if (!result) return res.status(404).json({ error: 'User not found' });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users/bulk', async (req, res) => {
  try {
    const incoming = (req.body.users || []);
    if (!incoming.length) return res.json({ count: 0, users: [] });
    const existing = new Set(
      (await col('users').find({ schoolId: req.schoolId }, { projection: { _id: 0, email: 1 } }).toArray()).map(u => u.email.toLowerCase())
    );
    const newOnes = incoming.filter(u => !existing.has(u.email.toLowerCase())).map(u => ({ ...u, schoolId: req.schoolId }));
    if (newOnes.length) await col('users').insertMany(newOnes);
    res.json({ count: newOnes.length, users: newOnes });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await col('users').deleteOne({ id: req.params.id, schoolId: req.schoolId });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── LOGS ─────────────────────────────────────────────────────────────────────
app.get('/api/logs', async (req, res) => {
  try {
    res.json(await col('logs').find({ schoolId: req.schoolId }, noId).toArray());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/logs', async (req, res) => {
  try {
    const { log, notifs = [] } = req.body;
    await col('logs').insertOne({ ...log, schoolId: req.schoolId });
    if (notifs.length) await col('notifications').insertMany(notifs.map(n => ({ ...n, schoolId: req.schoolId })));
    res.json({ log, notifs });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
app.get('/api/notifications', async (req, res) => {
  try {
    const notifs = await col('notifications').find({ schoolId: req.schoolId }, noId).sort({ timestamp: -1 }).toArray();
    res.json(notifs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    const result = await col('notifications').findOneAndUpdate(
      { id: req.params.id },
      { $addToSet: { readBy: req.body.uid } },
      { returnDocument: 'after', projection: { _id: 0 } }
    );
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json({ readBy: result.readBy });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── APPEALS ──────────────────────────────────────────────────────────────────
app.get('/api/appeals', async (req, res) => {
  try {
    res.json(await col('appeals').find({ schoolId: req.schoolId }, noId).toArray());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/appeals', async (req, res) => {
  try {
    const { appeal, logId } = req.body;
    const doc = { ...appeal, schoolId: req.schoolId, status: 'pending', parentNote: '', resolvedBy: '', resolvedNote: '', resolvedAt: 0 };
    await col('appeals').insertOne({ ...doc });
    await col('logs').updateOne({ id: logId, schoolId: req.schoolId }, { $set: { status: 'appealing' } });
    res.json(appeal);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/appeals/:id', async (req, res) => {
  try {
    const { resolution, by, note, parentNote } = req.body;
    let update;
    if (parentNote !== undefined) {
      update = { $set: { parentNote } };
    } else if (resolution) {
      update = { $set: { status: resolution, resolvedBy: by || '', resolvedNote: note || '', resolvedAt: Date.now() } };
      const appeal = await col('appeals').findOne({ id: req.params.id, schoolId: req.schoolId }, noId);
      if (appeal) {
        await col('logs').updateOne(
          { id: appeal.logId, schoolId: req.schoolId },
          { $set: { status: resolution === 'accepted' ? 'overturned' : 'active' } }
        );
      }
    }
    const result = await col('appeals').findOneAndUpdate(
      { id: req.params.id, schoolId: req.schoolId }, update,
      { returnDocument: 'after', projection: { _id: 0 } }
    );
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── BRAND ────────────────────────────────────────────────────────────────────
app.get('/api/brand', async (req, res) => {
  try {
    const brand = await col('brand').findOne({ schoolId: req.schoolId }, noId);
    res.json(brand || DEFAULT_BRAND);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/brand', async (req, res) => {
  try {
    const brand = { ...req.body, schoolId: req.schoolId };
    await col('brand').replaceOne({ schoolId: req.schoolId }, brand, { upsert: true });
    res.json(brand);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── MATRIX ───────────────────────────────────────────────────────────────────
app.get('/api/matrix', async (req, res) => {
  try {
    const doc = await col('settings').findOne({ schoolId: req.schoolId, key: 'matrix' }, noId);
    res.json(doc ? doc.value : null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/matrix', async (req, res) => {
  try {
    const value = req.body;
    await col('settings').replaceOne(
      { schoolId: req.schoolId, key: 'matrix' },
      { schoolId: req.schoolId, key: 'matrix', value },
      { upsert: true }
    );
    res.json(value);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/matrix', async (req, res) => {
  try {
    await col('settings').deleteOne({ schoolId: req.schoolId, key: 'matrix' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── SUPER ADMIN ──────────────────────────────────────────────────────────────
function requireSuper(req, res, next) {
  if (req.schoolId !== 'system') return res.status(403).json({ error: 'Forbidden' });
  next();
}

app.get('/api/super/schools', requireSuper, async (req, res) => {
  try {
    const schools = await col('schools').find({}, noId).sort({ createdAt: 1 }).toArray();
    const withStats = await Promise.all(schools.map(async s => ({
      ...s,
      studentCount: await col('students').countDocuments({ schoolId: s.id }),
      staffCount:   await col('users').countDocuments({ schoolId: s.id, role: { $nin: ['student','parent','superadmin'] } }),
      parentCount:  await col('users').countDocuments({ schoolId: s.id, role: 'parent' }),
      studentUserCount: await col('users').countDocuments({ schoolId: s.id, role: 'student' }),
    })));
    res.json(withStats);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/super/schools', requireSuper, async (req, res) => {
  try {
    const { id, name, motto, primaryColor, secondaryColor, adminName, adminEmail, adminPin } = req.body;
    if (!id || !name || !adminEmail || !adminPin) return res.status(400).json({ error: 'id, name, adminEmail and adminPin are required.' });
    const exists = await col('schools').findOne({ id });
    if (exists) return res.status(400).json({ error: `School ID "${id}" already exists.` });

    const now = new Date().toISOString();
    const pc  = primaryColor  || '#4a1a7a';
    const sc  = secondaryColor || pc;

    const school = { id, name, motto: motto||'', status: 'active', adminEmail, primaryColor: pc, createdAt: now };
    const brand  = {
      schoolId: id, schoolName: name, motto: motto||'',
      logoUrl: '', primaryColor: pc, secondaryColor: sc,
      accentColor: '#e9d5ff', buttonColor: pc, highlightColor: '#f3e8ff',
      borderColor: '#c4b5fd', address: '', phone: '', email: adminEmail,
      website: '', facebook: '', twitter: '', instagram: '', whatsapp: '',
    };
    const adminUser = {
      id: `${id}-admin-1`, name: adminName || name + ' Admin',
      email: adminEmail, role: 'admin', pin: String(adminPin),
      schoolId: id, year: '', studentId: '', childIds: [], createdAt: now,
    };

    await col('schools').insertOne(school);
    await col('brand').insertOne(brand);
    await col('users').insertOne(adminUser);

    res.json({ school, adminUser: { ...adminUser } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/super/schools/:id', requireSuper, async (req, res) => {
  try {
    const { status } = req.body;
    await col('schools').updateOne({ id: req.params.id }, { $set: { status } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/super/stats', requireSuper, async (req, res) => {
  try {
    const [schools, students, users] = await Promise.all([
      col('schools').countDocuments({}),
      col('students').countDocuments({}),
      col('users').countDocuments({ role: { $nin: ['superadmin'] } }),
    ]);
    res.json({ schools, students, users });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── PRODUCTION STATIC ────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
}

// ─── START ────────────────────────────────────────────────────────────────────
async function start() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  mdb = client.db(DB_NAME);

  // Seed brand if missing
  const brand = await col('brand').findOne({});
  if (!brand) await col('brand').insertOne({ ...DEFAULT_BRAND });

  app.listen(PORT, () => console.log(`BPS server → http://localhost:${PORT}`));
  console.log('MongoDB connected →', DB_NAME);
}

start().catch(err => { console.error('Startup failed:', err); process.exit(1); });
