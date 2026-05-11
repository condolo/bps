// Renames Mascit Lab Academy → Demo School in MongoDB
// Updates: schools collection, brand collection, users collection (emails)
// Run: node scripts/rename-demo-school.js

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) { console.error('MONGODB_URI env var required'); process.exit(1); }

const EMAIL_MAP = {
  'demo.admin@mascitlab.ac.ke':      'demo.admin@demo.bps.app',
  'demo.pastoral@mascitlab.ac.ke':   'demo.pastoral@demo.bps.app',
  'demo.ks3@mascitlab.ac.ke':        'demo.ks3@demo.bps.app',
  'demo.teacher@mascitlab.ac.ke':    'demo.teacher@demo.bps.app',
  'demo.discipline@mascitlab.ac.ke': 'demo.discipline@demo.bps.app',
  'demo.student@mascitlab.ac.ke':    'demo.student@demo.bps.app',
  'demo.parent@mascitlab.ac.ke':     'demo.parent@demo.bps.app',
};

async function run() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db('bps');

  // 1. schools collection
  const schoolRes = await db.collection('schools').updateOne(
    { id: 'demo' },
    { $set: { name: 'Demo School', adminEmail: 'demo.admin@demo.bps.app' } }
  );
  console.log(`schools: ${schoolRes.modifiedCount} doc updated`);

  // 2. brand collection
  const brandRes = await db.collection('brand').updateOne(
    { schoolId: 'demo' },
    { $set: { schoolName: 'Demo School', email: 'info@demo.bps.app' } }
  );
  console.log(`brand:   ${brandRes.modifiedCount} doc updated`);

  // 3. users collection — remap each email
  let userCount = 0;
  for (const [oldEmail, newEmail] of Object.entries(EMAIL_MAP)) {
    const r = await db.collection('users').updateMany(
      { schoolId: 'demo', email: oldEmail },
      { $set: { email: newEmail } }
    );
    if (r.modifiedCount) {
      console.log(`users:   ${oldEmail} → ${newEmail}`);
      userCount += r.modifiedCount;
    }
  }
  console.log(`users:   ${userCount} total docs updated`);

  await client.close();
  console.log('\nMigration complete.');
}

run().catch(err => { console.error(err); process.exit(1); });
