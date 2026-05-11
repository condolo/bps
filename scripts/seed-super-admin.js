// Creates the super admin user and seeds the schools collection
// Run: node scripts/seed-super-admin.js

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) { console.error('MONGODB_URI env var required'); process.exit(1); }

const now = new Date().toISOString();

const SUPER_USER = {
  id: 'super-1',
  name: 'Super Admin',
  email: 'super@bps.app',
  role: 'superadmin',
  pin: '9999',
  schoolId: 'system',
  createdAt: now,
};

const SCHOOLS = [
  {
    id: 'saa',
    name: "St. Austin's Academy",
    motto: 'Dare to Be',
    status: 'active',
    adminEmail: 'admin@staustin.ac.ke',
    primaryColor: '#4a1a7a',
    createdAt: now,
  },
  {
    id: 'demo',
    name: 'Mascit Lab Academy',
    motto: 'Learn. Grow. Lead.',
    status: 'active',
    adminEmail: 'demo.admin@mascitlab.ac.ke',
    primaryColor: '#0f766e',
    createdAt: now,
  },
];

async function run() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db('bps');

  // Upsert super admin user
  await db.collection('users').replaceOne(
    { role: 'superadmin' },
    SUPER_USER,
    { upsert: true }
  );
  console.log('  Super admin user: super@bps.app / PIN 9999');

  // Upsert schools
  for (const school of SCHOOLS) {
    await db.collection('schools').replaceOne({ id: school.id }, school, { upsert: true });
    console.log(`  School: ${school.name} (${school.id})`);
  }

  await client.close();
  console.log('\nSuper admin seeded.');
}

run().catch(err => { console.error(err); process.exit(1); });
