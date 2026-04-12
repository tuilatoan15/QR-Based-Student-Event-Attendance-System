const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/userModel');

const rawData = `
101 6351071021 Đỗ Văn Thành Được CQ.63.CN.CNTT 8.69 3.63 Xuất sắc Xuất sắc 10,660,000
102 6351071002 Trần Phương Anh CQ.63.CN.CNTT 8.51 3.61 Xuất sắc Xuất sắc 10,660,000
103 6351071016 Nguyễn Thành Đạt CQ.63.CN.CNTT 8.44 3.58 Xuất sắc Giỏi 9,430,000
104 6351071006 Đinh Quốc Bảo CQ.63.CN.CNTT 8.36 3.58 Xuất sắc Giỏi 9,430,000
105 6351071054 Nguyễn Viết Ái Nhi CQ.63.CN.CNTT 8.23 3.54 Xuất sắc Giỏi 9,430,000
106 6351071055 Phạm Thị Ngọc Oanh CQ.63.CN.CNTT 8.62 3.51 Xuất sắc Giỏi 9,430,000
107 6351071073 Trần Quang Trường CQ.63.CN.CNTT 8.41 3.51 Tốt Giỏi 9,430,000
108 6354010010 Trần Nguyễn Nguyệt Cầm CQ.63.KS.KTQLDTXD 8.65 3.67 Xuất sắc Xuất sắc 10,660,000
109 6354010033 Nguyễn Văn Hoài CQ.63.KS.KTQLDTXD 8.63 3.64 Xuất sắc Xuất sắc 10,660,000
110 6354010083 Nguyễn Thị Á Phương CQ.63.KS.KTQLDTXD 8.58 3.62 Xuất sắc Xuất sắc 10,660,000
111 6354010026 Trần Thị Mỹ Hà CQ.63.KS.KTQLDTXD 8.55 3.6 Xuất sắc Xuất sắc 10,660,000
112 6354010085 Đỗ Quốc Quân CQ.63.KS.KTQLDTXD 9.13 3.8 Tốt Giỏi 9,430,000
113 6354010050 Nguyễn Thị Thanh Liền CQ.63.KS.KTQLDTXD 8.87 3.78 Tốt Giỏi 9,430,000
114 6351060040 Nguyễn Văn Tiến CQ.63.KS.TBDGT 8.79 3.63 Xuất sắc Xuất sắc 10,660,000
115 6351060037 Đỗ Minh Thuận CQ.63.KS.TBDGT 8.1 3.37 Tốt Giỏi 9,430,000
116 6351060032 Nguyễn Đỗ Bá Phát CQ.63.CN.KTĐ 7.85 3.32 Tốt Giỏi 9,430,000
117 6351060002 Nguyễn Thành An CQ.63.KS.TBDGT 7.74 3.26 Xuất sắc Giỏi 9,430,000
118 6351060022 Phạm Nam Hoàng Lâm CQ.63.KS.TBDGT 7.88 3.24 Tốt Giỏi 9,430,000
119 6351020045 Nguyễn Thị Cẩm Nhung CQ.63.KS.ĐTTH&CN 8.69 3.76 Xuất sắc Xuất sắc 10,660,000
120 6351020039 Nguyễn Ngọc Mỹ CQ.63.KS.ĐTTH&CN 8.65 3.63 Xuất sắc Xuất sắc 10,660,000
121 6351020068 Nguyễn Võ Nhật Thiên CQ.63.CN.KTĐTVT 8.74 3.73 Tốt Giỏi 9,430,000
122 6351020048 Tăng Gia Phát CQ.63.CN.KTĐTVT 8.66 3.59 Tốt Giỏi 9,430,000
123 6351020041 Nguyễn Kim Ngân CQ.63.KS.ĐTTH&CN 8.04 3.41 Tốt Giỏi 9,430,000
124 6351020046 Nguyễn Văn Ninh CQ.63.CN.KTĐTVT 7.89 3.32 Tốt Giỏi 9,430,000
125 6351020010 Hứa Anh Dũng CQ.63.CN.KTĐTVT 8.11 3.31 Tốt Giỏi 9,430,000
126 6351020075 Nguyễn Thão Trang CQ.63.KS.ĐTTH&CN 7.79 3.27 Xuất sắc Giỏi 9,430,000
127 6354051004 Nguyễn Đức Chuyên CQ.63.CN.QLXD 9.35 3.89 Xuất sắc Xuất sắc 10,660,000
128 6354051037 Lê Phạm Hoàng Sơn CQ.63.KS.QLDA 8.85 3.74 Xuất sắc Xuất sắc 10,660,000
129 6354051001 Lê Nguyễn Thảo Anh CQ.63.KS.QLDA 8.8 3.73 Xuất sắc Xuất sắc 10,660,000
130 6354051025 Nguyễn Minh Nhựt CQ.63.KS.QLDA 9.03 3.78 Tốt Giỏi 9,430,000
131 6354051044 Phạm Thanh Thảo CQ.63.CN.QLXD 8.87 3.75 Tốt Giỏi 9,430,000
132 6351030003 Lê Đức Anh CQ.63.KS.TĐH 9.11 3.78 Xuất sắc Xuất sắc 10,660,000
133 6351030005 Nguyễn Đức Ánh CQ.63.KS.TĐH 9.16 3.77 Xuất sắc Xuất sắc 10,660,000
134 6351030063 Trương Thanh Sơn CQ.63.KS.TĐH 8.89 3.77 Xuất sắc Xuất sắc 10,660,000
135 6351030049 Trần Trung Nhân CQ.63.CN.TĐH 8.83 3.69 Xuất sắc Xuất sắc 10,660,000
136 6351030071 Nguyễn Trường Thịnh CQ.63.KS.TĐH 8.72 3.68 Xuất sắc Xuất sắc 10,660,000
137 6351030047 Trần Hoàng Nghĩa CQ.63.KS.TĐH 8.85 3.76 Tốt Giỏi 9,430,000
138 6351030034 Trần Quý Hưng CQ.63.KS.TĐH 9.01 3.72 Tốt Giỏi 9,430,000
139 6351030074 Phan Võ Thanh Toàn CQ.63.KS.TĐH 8.77 3.69 Tốt Giỏi 9,430,000
140 6351030051 Võ Thành Phát CQ.63.KS.TĐH 8.73 3.67 Tốt Giỏi 9,430,000
141 6351040032 Trần Hiếu Khang CQ.63.KS. KTOTO 8.34 3.51 Tốt Giỏi 9,430,000
142 6351040005 Lê Minh Chung CQ.63.KS. KTOTO 8.42 3.5 Xuất sắc Giỏi 9,430,000
143 6351040045 Trần Bảo Ngọc CQ.63.KS. KTOTO 8.11 3.49 Tốt Giỏi 9,430,000
144 6351040039 Nguyễn Huỳnh Châu Lam CQ.63.KS. KTOTO 8.24 3.43 Tốt Giỏi 9,430,000
145 6351040013 Trần Thị Hải Hà CQ.CN.63.KTOTO 7.97 3.41 Tốt Giỏi 9,430,000
146 6351040007 Lê Minh Duy CQ.63.KS. KTOTO 8.16 3.4 Tốt Giỏi 9,430,000
147 6351040004 Đoàn Minh Chiến CQ.63.KS. KTOTO 8 3.39 Tốt Giỏi 9,430,000
148 6351040082 Thái Tuấn CQ.63.KS. KTOTO 8.09 3.37 Xuất sắc Giỏi 9,430,000
149 6351010024 Bùi Thành Đạt CQ.63.KS.CĐB 9.05 3.79 Xuất sắc Xuất sắc 10,660,000
150 6351010023 Nguyễn Thành Đạt CQ.63.KS.CĐB 8.76 3.69 Xuất sắc Xuất sắc 10,660,000
190 6351100099 Nguyễn Tấn Nhật CQ.63.KS.XDDD.2 8.25 3.37 Xuất sắc Giỏi 9,430,000
251 6451071088 Trần Đình Võ CQ.64.CNTT 9.49 3.93 Xuất sắc Xuất sắc 10,660,000
343 645105L022 Nguyễn Thị Hương Giang CQ.64.LOGISTICS 9.56 3.97 Xuất sắc Xuất sắc 10,660,000
412 6551071078 Võ Hồng Thiên CQ.65.CNTT 9 3.72 Xuất sắc Xuất sắc 10,660,000
526 6551100087 Nguyễn Thị Ngọc My CQ.65.NKTXD.2 9.53 3.94 Xuất sắc Xuất sắc 10,660,000
576 6551030074 Nguyễn Trung Trực CQ.65.TĐHĐK 8.55 3.72 Tốt Giỏi 9,430,000
`;

async function seedStudents() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    const password_hash = await bcrypt.hash('000000', 10);
    const lines = rawData.trim().split('\n');
    let count = 0;

    for (const line of lines) {
      const match = line.match(/^\d+\s+(\S+)\s+(.+?)\s+([A-Z0-9.]+)\s+/);
      if (match) {
        const student_code = match[1];
        const full_name = match[2];
        const email = `${student_code}@student.university.edu`;

        const exists = await User.findOne({ email });
        if (!exists) {
          await User.create({
            full_name,
            email,
            password_hash,
            student_code,
            role: 'student',
            is_active: true
          });
          count++;
        }
      }
    }

    console.log(`Successfully added ${count} additional students.`);
    process.exit(0);
  } catch (err) {
    console.error('FAILED:', err);
    process.exit(1);
  }
}

seedStudents();
