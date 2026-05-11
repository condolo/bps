// One-time migration: data.json → MongoDB
// Run: node migrate-to-mongo.js

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) { console.error('MONGODB_URI env var is required'); process.exit(1); }
const DB_NAME = 'bps';
const DATA_PATH = path.join(__dirname, 'data.json');

async function migrate() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);

  for (const col of ['students', 'users', 'logs', 'notifications', 'appeals']) {
    await db.collection(col).drop().catch(() => {});
    if (data[col] && data[col].length) {
      await db.collection(col).insertMany(data[col]);
      console.log(`  ${col}: ${data[col].length} docs inserted`);
    } else {
      console.log(`  ${col}: empty`);
    }
  }

  await db.collection('brand').drop().catch(() => {});
  if (data.brand) {
    await db.collection('brand').insertOne(data.brand);
    console.log('  brand: inserted');
  }

  await client.close();
  console.log('\nMigration complete.');
}

migrate().catch(err => { console.error(err); process.exit(1); });
