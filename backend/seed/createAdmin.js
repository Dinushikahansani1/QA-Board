require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

(async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/cxqdb';
  await mongoose.connect(uri);

  const email = 'admin@example.com';
  const passwordHash = await bcrypt.hash('changeme', 10);

  const existing = await User.findOne({ email });
  if (!existing) {
    await User.create({ email, passwordHash, role: 'admin' });
    console.log('Created admin:', email, '/ changeme');
  } else {
    console.log('Admin already exists:', email);
  }
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
