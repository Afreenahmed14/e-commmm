/**
 * One-off script to create the first Admin account, since there is no
 * public admin-registration endpoint (see routes/authRoutes.js).
 *
 * Usage:
 *   node src/utils/seed.js --name "Jane Admin" --email admin@hourlyrecruit.com --password Str0ngPass123
 *
 * Requires MONGO_URI to be set (loaded from .env via dotenv, same as server.js).
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    parsed[key] = args[i + 1];
  }
  return parsed;
};

const run = async () => {
  const { name, email, password } = parseArgs();

  if (!name || !email || !password) {
    console.error('Usage: node src/utils/seed.js --name "Jane Admin" --email admin@example.com --password Str0ngPass123');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('[Seed] Connected to MongoDB');

  const existing = await Admin.findOne({ email });
  if (existing) {
    console.error(`[Seed] An admin with email ${email} already exists.`);
    process.exit(1);
  }

  const admin = await Admin.create({ name, email, password, isVerified: true });
  console.log(`[Seed] Admin created: ${admin.email} (${admin._id})`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('[Seed] Failed:', err.message);
  process.exit(1);
});
