const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/userModel');

async function updateOrganizerAvatars() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('MONGO_URI is not defined in .env');
      return;
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');

    const defaultAvatarUrl = 'https://res.cloudinary.com/dhw5zmh91/image/upload/v1/zqabiday4fmm0exkauot';

    const result = await User.updateMany(
      { role: 'organizer', avatar: null },
      { $set: { avatar: defaultAvatarUrl } }
    );

    console.log(`Updated ${result.modifiedCount} organizer(s) with the new default avatar.`);
    
    // Also update anyone who doesn't have an avatar at all?
    // User.updateMany({ avatar: null }, { $set: { avatar: defaultAvatarUrl } });

  } catch (error) {
    console.error('Error updating avatars:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB Atlas');
  }
}

updateOrganizerAvatars();
