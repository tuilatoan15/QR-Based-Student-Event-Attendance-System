const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Registration, REGISTRATION_STATUS } = require('../models/registrationModel');
const Attendance = require('../models/attendanceModel');

async function fixAttendanceStatus() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    const attendances = await Attendance.find({});
    console.log(`Found ${attendances.length} attendance records.`);

    let updatedCount = 0;
    for (const att of attendances) {
      const reg = await Registration.findById(att.registration_id);
      if (reg && reg.status !== REGISTRATION_STATUS.ATTENDED) {
        reg.status = REGISTRATION_STATUS.ATTENDED;
        await reg.save();
        updatedCount++;
      }
    }

    console.log(`Successfully updated ${updatedCount} registrations to 'attended' status.`);
    process.exit(0);
  } catch (err) {
    console.error('FAILED:', err);
    process.exit(1);
  }
}

fixAttendanceStatus();
