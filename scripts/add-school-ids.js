// Migration: adds schoolId:'saa' to all existing records that lack it
// Run: node scripts/add-school-ids.js

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) { console.error('MONGODB_URI env var required'); process.exit(1); }

async function run() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db('bps');

  for (const name of ['students', 'users', 'logs', 'notifications', 'appeals']) {
    const result = await db.collection(name).updateMany(
      { schoolId: { $exists: false } },
      { $set: { schoolId: 'saa' } }
    );
    console.log(`  ${name}: ${result.modifiedCount} records updated`);
  }

  // Brand: add schoolId to existing brand doc
  await db.collection('brand').updateMany(
    { schoolId: { $exists: false } },
    { $set: { schoolId: 'saa' } }
  );
  console.log('  brand: updated');

  await client.close();
  console.log('\nMigration complete — all existing records tagged schoolId: saa');
}

run().catch(err => { console.error(err); process.exit(1); });
