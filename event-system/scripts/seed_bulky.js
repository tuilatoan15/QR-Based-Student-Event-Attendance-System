const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/userModel');
const Event = require('../models/eventModel');
const { Registration, REGISTRATION_STATUS } = require('../models/registrationModel');
const Attendance = require('../models/attendanceModel');
const { Report, REPORT_STATUS } = require('../models/reportModel');

const generateQRToken = () => crypto.randomUUID();

async function bulkSeed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    const students = await User.find({ role: 'student' });
    const organizers = await User.find({ role: 'organizer' });
    const admin = await User.findOne({ role: 'admin' });

    if (organizers.length === 0) {
      console.log('No organizers found, run seed_final.js first.');
      process.exit(1);
    }

    const org1 = organizers[0];
    const org2 = organizers[1] || org1;

    console.log('Adding more events...');
    const eventTitles = [
      'Tech Talk: Tương lai AI trong Kỹ thuật',
      'Giải chạy bộ Sinh viên - UT2 Run 2024',
      'Ngày hội Việc làm Quốc tế - Job Fair',
      'Hội thi Văn nghệ - Sắc màu tuổi trẻ',
      'Tập huấn Kỹ năng tranh biện',
      'Hội thảo: An toàn thông tin trên không gian mạng',
      'Ngày hội Hiến máu tình nguyện 2024',
      'Cuộc thi Ý tưởng khởi nghiệp sáng tạo',
      'Giải Esport: Liên Quân Mobile Final',
      'Seminar: Ứng dụng Blockchain trong Logistic'
    ];

    const now = new Date();
    const bulkEvents = [];

    for (let i = 0; i < eventTitles.length; i++) {
      // Random time: some past, some future
      const dayOffset = Math.floor(Math.random() * 30) - 15; // -15 to +15 days
      const start = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);

      const event = await Event.create({
        title: eventTitles[i],
        description: `Mô tả cho sự kiện ${eventTitles[i]}. Hoạt động sôi nổi dành cho toàn thể sinh viên.`,
        location: i % 2 === 0 ? 'Sảnh A - UT2' : 'Phòng Hội Thảo 3',
        start_time: start,
        end_time: end,
        max_participants: 100 + i * 50,
        created_by: i % 2 === 0 ? org1._id : org2._id,
        images: [`https://picsum.photos/800/400?random=${i + 10}`]
      });
      bulkEvents.push(event);
    }

    console.log('Adding more reports...');
    const reportContents = [
      ['Bug', 'Lỗi không tải được ảnh', 'Dạ admin ơi, em upload ảnh đại diện nhưng cứ báo lỗi "Upload failed".'],
      ['Feature', 'Yêu cầu tính năng thông báo qua Mail', 'Em muốn nhận được mail nhắc nhở trước khi sự kiện bắt đầu 1 tiếng ạ.'],
      ['Bug', 'Sai thông tin MSV', 'Thông tin MSV của em hiển thị sai một chữ số cuối ạ.'],
      ['Bug', 'App bị văng khi quét QR', 'Em dùng Android 13, khi bấm quét QR là app bị văng ra ngoài.'],
      ['Feature', 'Dark Mode cho App', 'Thêm chế độ tối cho đỡ mỏi mắt đi ạ admin.'],
      ['Bug', 'Không nhận được mã xác nhận', 'Em thử đổi mật khẩu nhưng không thấy mail gửi về.'],
      ['Question', 'Hỏi về giấy chứng nhận', 'Tham gia bao nhiêu buổi thì được cấp giấy chứng nhận ạ?'],
      ['Feature', 'Kết nối bạn bè', 'Cho em xin tính năng xem những ai cùng lớp tham gia để đi chung ạ.']
    ];

    for (let i = 0; i < 20; i++) {
        const student = students[Math.floor(Math.random() * students.length)];
        const [type, title, content] = reportContents[i % reportContents.length];
        
        await Report.create({
            user_id: student._id,
            type,
            title: `${title} #${i+1}`,
            content,
            status: i % 3 === 0 ? REPORT_STATUS.PENDING : REPORT_STATUS.RESPONDED,
            admin_reply: i % 3 === 0 ? '' : 'Đã ghi nhận và sẽ xử lý trong bản cập nhật tới.',
            replied_by: i % 3 === 0 ? null : admin._id,
            replied_at: i % 3 === 0 ? null : new Date()
        });
    }

    console.log('Adding notifications...');
    for (let i = 0; i < 30; i++) {
        const student = students[Math.floor(Math.random() * students.length)];
        const event = bulkEvents[Math.floor(Math.random() * bulkEvents.length)];
        
        await db.collection('notifications').insertOne({
            user_id: student._id,
            title: i % 2 === 0 ? 'Sự kiện sắp bắt đầu!' : 'Cập nhật trạng thái duyệt',
            message: i % 2 === 0 ? `Sự kiện "${event.title}" sẽ diễn ra vào ngày ${event.start_time.toLocaleDateString()}. Đừng quên nhé!` : 'Admin đã cập nhật hồ sơ của bạn.',
            type: i % 2 === 0 ? 'warning' : 'success',
            is_read: Math.random() > 0.5,
            event_id: event._id,
            created_at: new Date(now.getTime() - Math.random() * 3 * 24 * 60 * 60 * 1000)
        });
    }

    console.log('Adding more registrations & attendance...');
    for (const event of bulkEvents) {
        const count = Math.floor(Math.random() * 20) + 15;
        const shuffled = students.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, count);

        for (const student of selected) {
            const status = Math.random() > 0.15 ? REGISTRATION_STATUS.REGISTERED : REGISTRATION_STATUS.CANCELLED;
            
            const reg = await Registration.create({
                user_id: student._id,
                event_id: event._id,
                qr_token: generateQRToken(),
                status: status,
                registered_at: new Date(event.start_time.getTime() - 2 * 24 * 60 * 60 * 1000)
            });

            if (status === REGISTRATION_STATUS.REGISTERED && event.start_time < now) {
                if (Math.random() > 0.25) {
                    await Attendance.create({
                        registration_id: reg._id,
                        event_id: event._id,
                        student_id: student._id,
                        checkin_time: new Date(event.start_time.getTime() + 10 * 60 * 1000),
                        checked_in_by: Math.random() > 0.5 ? org1._id : org2._id
                    });
                }
            }
        }
    }

    console.log('BULK SEEDING COMPLETE!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

bulkSeed();
