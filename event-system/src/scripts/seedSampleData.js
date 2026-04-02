const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const { connectDB } = require('../../config/db');
const User = require('../../models/userModel');
const Event = require('../../models/eventModel');
const { Registration } = require('../../models/registrationModel');
const Attendance = require('../../models/attendanceModel');

dotenv.config();

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

const run = async () => {
  await connectDB();

  await Promise.all([
    Attendance.deleteMany({}),
    Registration.deleteMany({}),
    Event.deleteMany({}),
    User.deleteMany({}),
  ]);

  const password_hash = await bcrypt.hash('Password123', SALT_ROUNDS);

  const [admin, organizer, student] = await User.create([
    {
      full_name: 'System Admin',
      email: 'admin@example.com',
      password_hash,
      role: 'admin',
    },
    {
      full_name: 'Campus Organizer',
      email: 'organizer@example.com',
      password_hash,
      role: 'organizer',
      organizer_profile: {
        organization_name: 'Student Affairs Office',
        position: 'Coordinator',
      },
    },
    {
      full_name: 'Demo Student',
      email: 'student@example.com',
      password_hash,
      role: 'student',
      student_code: 'ST001',
    },
  ]);

  const event = await Event.create({
    title: 'Welcome Orientation',
    description: 'Orientation event for new students',
    location: 'Main Hall',
    start_time: new Date(Date.now() + 86400000),
    end_time: new Date(Date.now() + 90000000),
    max_participants: 200,
    created_by: organizer._id,
  });

  console.log('Sample data created');
  console.log({
    admin: admin.email,
    organizer: organizer.email,
    student: student.email,
    password: 'Password123',
    eventId: event._id.toString(),
  });
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
