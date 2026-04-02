const mongoose = require('mongoose');
const User = require('./models/userModel');
require('dotenv').config({ path: './src/.env' });

async function checkAvatars() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await User.find({ avatar: { $exists: true, $ne: null } }).limit(5);
  console.log('--- USERS AVATARS ---');
  users.forEach(u => {
    console.log(`User: ${u.email}, Avatar Length: ${u.avatar?.length}, Start: ${u.avatar?.substring(0, 50)}`);
  });
  await mongoose.disconnect();
}

checkAvatars().catch(console.error);
