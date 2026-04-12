const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

// Configure dotenv to load variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/userModel');
const Event = require('../models/eventModel');
const { Registration, REGISTRATION_STATUS } = require('../models/registrationModel');
const Attendance = require('../models/attendanceModel');
const { Report, REPORT_STATUS } = require('../models/reportModel');

const SALT_ROUNDS = 10;

const crypto = require('crypto');

// Helper to generate a dummy QR token
const generateQRToken = () => {
  return crypto.randomUUID();
};

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    console.log('Connected!');

    // Clear existing data
    console.log('Clearing collections...');
    // Clear models individually to handle potential import issues
    if (User) await User.deleteMany({});
    if (Event) await Event.deleteMany({});
    if (Registration) await Registration.deleteMany({});
    if (Attendance) await Attendance.deleteMany({});
    if (Report) await Report.deleteMany({});
    await db.collection('organizer_infos').deleteMany({});

    console.log('Data cleared.');

    const password_hash = await bcrypt.hash('000000', SALT_ROUNDS);

    // 1. Create ADMIN
    const admin = await User.create({
      full_name: 'Admin Hệ Thống',
      email: 'admin@university.edu',
      password_hash,
      role: 'admin',
      is_active: true
    });

    console.log('Created Admin');

    // 2. Create APPROVED Organizers
    const org1 = await User.create({
      full_name: 'Nguyễn Văn B',
      email: 'clbcntt@university.edu',
      password_hash,
      role: 'organizer',
      is_active: true,
      organizer_profile: {
        organization_name: 'CLB Công nghệ thông tin',
        position: 'Chủ nhiệm CLB',
        phone: '0987654321',
        bio: 'Câu lạc bộ học thuật khoa CNTT - Đại học Công Nghệ'
      }
    });

    const org2 = await User.create({
      full_name: 'Lê Thế H',
      email: 'clbtinhnguyen@university.edu',
      password_hash,
      role: 'organizer',
      is_active: true,
      organizer_profile: {
        organization_name: 'CLB Tình Nguyện Sinh Viên',
        position: 'Phó chủ nhiệm',
        phone: '0912345678',
        bio: 'Tổ chức các hoạt động thiện nguyện, mùa hè xanh'
      }
    });

    console.log('Created Organizers');

    // Seed organizer_infos for approved orgs
    await db.collection('organizer_infos').insertMany([
      {
        user_id: org1._id,
        full_name: org1.full_name,
        email: org1.email,
        organization_name: org1.organizer_profile.organization_name,
        position: org1.organizer_profile.position,
        phone: org1.organizer_profile.phone,
        approval_status: 'approved',
        created_at: new Date()
      },
      {
        user_id: org2._id,
        full_name: org2.full_name,
        email: org2.email,
        organization_name: org2.organizer_profile.organization_name,
        position: org2.organizer_profile.position,
        phone: org2.organizer_profile.phone,
        approval_status: 'approved',
        created_at: new Date()
      }
    ]);

    // 3. Create PENDING Organizer
    const orgPending = await User.create({
      full_name: 'Trần Văn K',
      email: 'khoacntt@university.edu',
      password_hash,
      role: 'organizer',
      is_active: true,
      organizer_profile: {
        organization_name: 'Khoa Công nghệ thông tin - K24',
        position: 'Lớp trưởng',
        phone: '0900112233'
      }
    });
    await db.collection('organizer_infos').insertOne({
      user_id: orgPending._id,
      full_name: orgPending.full_name,
      email: orgPending.email,
      organization_name: orgPending.organizer_profile.organization_name,
      approval_status: 'pending',
      created_at: new Date()
    });

    // 4. Create REJECTED Organizer (History only)
    await db.collection('organizer_infos').insertOne({
      user_id: new mongoose.Types.ObjectId(),
      full_name: 'Hồ Văn X',
      email: 'org_rejected@university.edu',
      organization_name: 'CLB Game University',
      approval_status: 'rejected',
      reject_reason: 'Hoạt động không phù hợp với tiêu chí nhà trường',
      created_at: new Date()
    });

    console.log('Processed Organizer Approval statuses');

    // 5. Create STUDENTS
    const student1 = await User.create({
      full_name: 'Trần Văn A',
      email: 'student1@university.edu',
      password_hash,
      role: 'student',
      student_code: 'SV001',
      avatar: 'https://res.cloudinary.com/dhw5zmh91/image/upload/v1/zqabiday4fmm0exkauot'
    });

    const student2 = await User.create({
      full_name: 'Lê Thị B',
      email: 'student2@university.edu',
      password_hash,
      role: 'student',
      student_code: 'SV002'
    });

    const student3 = await User.create({
      full_name: 'Phạm Văn C',
      email: 'student3@university.edu',
      password_hash,
      role: 'student',
      student_code: 'SV003'
    });

    console.log('Created Students');

    // 6. Create EVENTS
    const now = new Date();
    const eventPast = await Event.create({
      title: 'Hội thảo Hướng nghiệp IT 2024',
      description: 'Gặp gỡ doanh nghiệp và định hướng nghề nghiệp.',
      location: 'Hội trường A',
      start_time: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), 
      end_time: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      max_participants: 100,
      created_by: org1._id,
      images: ['https://images.unsplash.com/photo-1540575467063-178a50c2df87']
    });

    const eventCurrent = await Event.create({
      title: 'Cuộc thi Lập trình Marathon',
      description: 'Sân chơi lập trình thực tế cho sinh viên.',
      location: 'Phòng Lap 101',
      start_time: new Date(now.getTime() + 1 * 60 * 60 * 1001), 
      end_time: new Date(now.getTime() + 5 * 60 * 60 * 1000),
      max_participants: 50,
      created_by: org1._id,
      images: ['https://images.unsplash.com/photo-1517245386807-bb43f82c33c4']
    });

    const eventFuture = await Event.create({
      title: 'Giải bóng đá sinh viên 2024',
      description: 'Giải bóng đá thường vụ hàng năm.',
      location: 'Sân vận động trường',
      start_time: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), 
      end_time: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      max_participants: 500,
      created_by: org2._id,
      images: ['https://images.unsplash.com/photo-1508098682722-e99c43a406b2']
    });

    console.log('Created Events');

    // 7. Create REGISTRATIONS & ATTENDANCE
    const reg1 = await Registration.create({
      user_id: student1._id,
      event_id: eventPast._id,
      qr_token: generateQRToken(student1._id, eventPast._id),
      status: REGISTRATION_STATUS.REGISTERED,
      registered_at: new Date(eventPast.start_time.getTime() - 24 * 60 * 60 * 1000)
    });

    await Attendance.create({
      registration_id: reg1._id,
      event_id: eventPast._id,
      student_id: student1._id,
      checkin_time: new Date(eventPast.start_time.getTime() + 15 * 60 * 1000),
      checked_in_by: org1._id
    });

    await Registration.create({
      user_id: student2._id,
      event_id: eventPast._id,
      qr_token: generateQRToken(student2._id, eventPast._id),
      status: REGISTRATION_STATUS.CANCELLED,
      registered_at: new Date(eventPast.start_time.getTime() - 2 * 24 * 60 * 60 * 1000)
    });

    await Registration.create({ user_id: student1._id, event_id: eventCurrent._id, qr_token: generateQRToken(student1._id, eventCurrent._id), status: REGISTRATION_STATUS.REGISTERED });
    await Registration.create({ user_id: student2._id, event_id: eventCurrent._id, qr_token: generateQRToken(student2._id, eventCurrent._id), status: REGISTRATION_STATUS.REGISTERED });
    await Registration.create({ user_id: student3._id, event_id: eventCurrent._id, qr_token: generateQRToken(student3._id, eventCurrent._id), status: REGISTRATION_STATUS.REGISTERED });

    console.log('Registrations seed complete.');

    // 8. Create REPORTS
    await Report.create({
      user_id: student1._id,
      type: 'Bug',
      title: 'Lỗi QR không quét được',
      content: 'Em quét mã QR tại hội trường A nhưng app báo lỗi không hợp lệ.',
      status: REPORT_STATUS.PENDING
    });

    await Report.create({
      user_id: student2._id,
      type: 'Feature',
      title: 'Thêm tính năng xuất PDF',
      content: 'Em mong muốn hệ thống có thêm tính năng xuất danh sách tham gia sang PDF.',
      status: REPORT_STATUS.RESPONDED,
      admin_reply: 'Chào em, cảm ơn em đã góp ý. Hệ thống đang triển khai tính năng này trong bản cập nhật tới.',
      replied_by: admin._id,
      replied_at: new Date()
    });

    console.log('Reports seed complete.');

    console.log('---------------------------------------------');
    console.log('SEEDING COMPLETE!');
    console.log('Admin: admin@university.edu / 000000');
    console.log('Organizer (Nguyễn Văn B): clbcntt@university.edu / 000000');
    console.log('Student 1: student1@university.edu / 000000');
    console.log('---------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('SEEDING FAILED:', err);
    process.exit(1);
  }
}

seed();
