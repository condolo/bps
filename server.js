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
  res.header('Access-Control-Allow-Headers', 'Content-Type');
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

// ─── AUTH ─────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, pin } = req.body;
    const user = await col('users').findOne(
      { email: { $regex: new RegExp(`^${(email||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`, 'i') }, pin: String(pin) },
      noId
    );
    if (!user) return res.status(401).json({ error: 'Invalid email or PIN.' });
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── STUDENTS ─────────────────────────────────────────────────────────────────
app.get('/api/students', async (_, res) => {
  try {
    res.json(await col('students').find({}, noId).toArray());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/students', async (req, res) => {
  try {
    const s = req.body;
    await col('students').updateOne({ id: s.id }, { $setOnInsert: s }, { upsert: true });
    res.json(s);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/students/bulk', async (req, res) => {
  try {
    const incoming = (req.body.students || []);
    if (!incoming.length) return res.json({ count: 0, students: [] });
    const existing = new Set(
      (await col('students').find({}, { projection: { _id: 0, name: 1 } }).toArray()).map(s => s.name.toLowerCase())
    );
    const newOnes = incoming.filter(s => !existing.has(s.name.toLowerCase()));
    if (newOnes.length) await col('students').insertMany(newOnes);
    res.json({ count: newOnes.length, students: newOnes });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    await col('students').deleteOne({ id: req.params.id });
    await col('logs').deleteMany({ studentId: req.params.id });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── USERS ────────────────────────────────────────────────────────────────────
app.get('/api/users', async (_, res) => {
  try {
    res.json(await col('users').find({}, noId).toArray());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users', async (req, res) => {
  try {
    const u = req.body;
    const exists = await col('users').findOne(
      { email: { $regex: new RegExp(`^${u.email.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`, 'i') } }
    );
    if (exists) return res.status(400).json({ error: 'Email already registered.' });
    await col('users').insertOne({ ...u });
    res.json(u);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await col('users').deleteOne({ id: req.params.id });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── LOGS ─────────────────────────────────────────────────────────────────────
app.get('/api/logs', async (_, res) => {
  try {
    res.json(await col('logs').find({}, noId).toArray());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/logs', async (req, res) => {
  try {
    const { log, notifs = [] } = req.body;
    await col('logs').insertOne({ ...log });
    if (notifs.length) await col('notifications').insertMany(notifs.map(n => ({ ...n })));
    res.json({ log, notifs });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
app.get('/api/notifications', async (_, res) => {
  try {
    const notifs = await col('notifications').find({}, noId).sort({ timestamp: -1 }).toArray();
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
app.get('/api/appeals', async (_, res) => {
  try {
    res.json(await col('appeals').find({}, noId).toArray());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/appeals', async (req, res) => {
  try {
    const { appeal, logId } = req.body;
    const doc = { ...appeal, status: 'pending', parentNote: '', resolvedBy: '', resolvedNote: '', resolvedAt: 0 };
    await col('appeals').insertOne({ ...doc });
    await col('logs').updateOne({ id: logId }, { $set: { status: 'appealing' } });
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
      const appeal = await col('appeals').findOne({ id: req.params.id }, noId);
      if (appeal) {
        await col('logs').updateOne(
          { id: appeal.logId },
          { $set: { status: resolution === 'accepted' ? 'overturned' : 'active' } }
        );
      }
    }
    const result = await col('appeals').findOneAndUpdate({ id: req.params.id }, update, { returnDocument: 'after', projection: { _id: 0 } });
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── BRAND ────────────────────────────────────────────────────────────────────
app.get('/api/brand', async (_, res) => {
  try {
    const brand = await col('brand').findOne({}, noId);
    res.json(brand || DEFAULT_BRAND);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/brand', async (req, res) => {
  try {
    await col('brand').replaceOne({}, req.body, { upsert: true });
    res.json(req.body);
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
