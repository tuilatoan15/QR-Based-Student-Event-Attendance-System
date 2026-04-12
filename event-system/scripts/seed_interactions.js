const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/userModel');
const Event = require('../models/eventModel');
const { Registration, REGISTRATION_STATUS } = require('../models/registrationModel');
const Attendance = require('../models/attendanceModel');

const generateQRToken = () => crypto.randomUUID();

async function seedInteractions() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const students = await User.find({ role: 'student' });
    const events = await Event.find({});
    const organizer = await User.findOne({ role: 'organizer' });

    console.log(`Found ${students.length} students and ${events.length} events.`);

    for (const event of events) {
      // Pick 20-40 random students for each event
      const count = Math.floor(Math.random() * 20) + 20;
      const shuffled = students.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, count);

      for (const student of selected) {
        // Check if exists
        const exists = await Registration.findOne({ user_id: student._id, event_id: event._id });
        if (exists) continue;

        const status = Math.random() > 0.3 ? REGISTRATION_STATUS.REGISTERED : REGISTRATION_STATUS.CANCELLED;
        
        const reg = await Registration.create({
          user_id: student._id,
          event_id: event._id,
          qr_token: generateQRToken(),
          status: status,
          registered_at: new Date(event.start_time.getTime() - Math.random() * 5 * 24 * 60 * 60 * 1000)
        });

        // If registered and event is in the past, maybe they attended
        if (status === REGISTRATION_STATUS.REGISTERED && event.start_time < new Date()) {
          if (Math.random() > 0.3) { // 70% attendance rate
            await Attendance.create({
              registration_id: reg._id,
              event_id: event._id,
              student_id: student._id,
              checkin_time: new Date(event.start_time.getTime() + Math.random() * 30 * 60 * 1000),
              checked_in_by: organizer._id
            });
          }
        }
      }
      console.log(`Seeded interactions for event: ${event.title}`);
    }

    console.log('Interactions seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedInteractions();
