/**
 * scripts/seedAdmin.js
 *
 * One-time idempotent seed: creates (or upgrades) the admin user.
 * Run with: npm run seed
 *
 * Credentials (from admin.md):
 *   email:    admin@syntrix
 *   password: password
 *   name:     Admin
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const ADMIN_EMAIL = 'admin@syntrix';
const ADMIN_PASSWORD = 'password';
const ADMIN_NAME = 'Admin';

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverApi: { version: '1', strict: true, deprecationErrors: true },
    });
    console.log('Connected to MongoDB.');

    const existing = await User.findOne({ email: ADMIN_EMAIL });

    if (existing) {
      // Ensure the existing user has admin role
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        await existing.save();
        console.log(`Updated existing user "${ADMIN_EMAIL}" to role="admin".`);
      } else {
        console.log(`Admin user "${ADMIN_EMAIL}" already exists with role="admin". Nothing to do.`);
      }
    } else {
      // Create a new admin user with a hashed password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

      const admin = new User({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: 'admin',
      });

      await admin.save();
      console.log(`Admin user created: { name: "${ADMIN_NAME}", email: "${ADMIN_EMAIL}", role: "admin" }`);
    }
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB. Seed complete.');
  }
}

seed();
