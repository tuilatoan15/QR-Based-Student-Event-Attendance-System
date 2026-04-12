const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/userModel');

async function prefixStudentCodes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    const students = await User.find({ 
      role: 'student', 
      student_code: { $ne: null, $not: /^SV/ } 
    });

    console.log(`Found ${students.length} students needing prefix.`);

    let count = 0;
    for (const student of students) {
      student.student_code = 'SV' + student.student_code;
      await student.save();
      count++;
    }

    console.log(`Successfully updated ${count} students.`);
    process.exit(0);
  } catch (err) {
    console.error('FAILED:', err);
    process.exit(1);
  }
}

prefixStudentCodes();
