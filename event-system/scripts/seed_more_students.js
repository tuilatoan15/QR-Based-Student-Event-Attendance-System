const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/userModel');

const rawData = `
1 6251040111 Thái Văn Quang CQ.62.KS.KTOTO.2 9.06 3.85 Xuất sắc Xuất sắc 10,660,000
2 6251040090 Trần Xuân Nhã CQ.62.KS.KTOTO.2 9.16 3.84 Xuất sắc Xuất sắc 10,660,000
3 6251040026 Hoàng Văn Thường CQ.62.KS. KTOTO.1 8.91 3.75 Xuất sắc Xuất sắc 10,660,000
4 6251040013 Nguyễn Văn Ngọc Lĩnh CQ.62.KS. KTOTO.1 8.88 3.75 Xuất sắc Xuất sắc 10,660,000
5 6251040048 Nguyễn Thành Đạt CQ.62.KS. KTOTO.1 8.9 3.74 Xuất sắc Xuất sắc 10,660,000
6 6251040091 Trần Quốc Nhật CQ.62.KS.KTOTO.2 8.85 3.69 Xuất sắc Xuất sắc 10,660,000
7 6251040020 Bùi Nhật Phi CQ.62.KS. KTOTO.1 8.78 3.69 Xuất sắc Xuất sắc 10,660,000
8 6251040103 Võ Lê Thiên Phúc CQ.62.KS.KTOTO.2 8.69 3.65 Tốt Giỏi 9,430,000
9 6251040100 Nguyễn Phước Thiên Phú CQ.62.KS.KTOTO.2 8.53 3.63 Tốt Giỏi 9,430,000
10 6251040093 Đinh Trần Minh Nhật CQ.62.KS.KTOTO.2 8.43 3.55 Tốt Giỏi 9,430,000
11 6251040074 Lê Chí Khanh CQ.62.KS.KTOTO.2 8.4 3.52 Tốt Giỏi 9,430,000
12 6251010100 Trần Anh Duy CQ.62.KS.CĐB.1 8.57 3.59 Tốt Giỏi 9,430,000
13 6251010029 Võ Thanh Quốc Khánh CQ.62.KS.CĐB.1 8.5 3.52 Tốt Giỏi 9,430,000
14 6251010099 Nguyễn Khang Duy CQ.62.KS.CĐB.1 8.32 3.49 Tốt Giỏi 9,430,000
15 6251010052 Trương Hoàng Phúc CQ.62.KS.CĐB.1 7.77 3.15 Tốt Khá 8,200,000
16 6251010237 Trần Gia Vượng CQ.62.KS.CĐB.2 7.66 3.13 Tốt Khá 8,200,000
17 6251010101 Lê Nguyễn Bảo Duy CQ.62.KS.CĐB.1 7.67 3.12 Tốt Khá 8,200,000
18 6251010115 Nguyễn Thanh Hải CQ.62.KS.CĐB.1 7.25 2.93 Xuất sắc Khá 8,200,000
19 6251010010 Phan Nhật Duy CQ.62.KS.CĐB.1 7.26 2.84 Tốt Khá 8,200,000
20 6251010134 Nguyễn Thị Thanh Huyền CQ.62.KS.CĐB.2 7.26 2.81 Xuất sắc Khá 8,200,000
21 6251010049 Phạm Hồng Phong CQ.62.KS.DBO.1 8.45 3.45 Xuất sắc Giỏi 9,430,000
22 6251010088 Trần Trang Anh CQ.62.KS.DBO.1 7.68 3.03 Tốt Khá 8,200,000
23 6251010020 Phạm Ngọc Hòa CQ.62.KS.DBO.1 7.38 2.94 Xuất sắc Khá 8,200,000
24 6251010064 Dương Tấn Phước Thiện CQ.62.KS.DBO.1 7.15 2.93 Xuất sắc Khá 8,200,000
25 6251010145 Đặng Gia Kiệt CQ.62.KS.DBO.2 7.01 2.72 Xuất sắc Khá 8,200,000
26 6251010110 Đặng Khoa Đăng CQ.62.KS.DBO.1 6.76 2.61 Tốt Khá 8,200,000
27 625101K011 Lê Hồng Đức CQ.62.KS.KIENTRUC 8.41 3.53 Xuất sắc Giỏi 9,430,000
28 625101K032 Nguyễn Công Hậu CQ.62.KS.KIENTRUC 8.18 3.46 Xuất sắc Giỏi 9,430,000
29 625101K015 Võ Hoàng Minh Kevin CQ.62.KS.KIENTRUC 7.89 3.35 Tốt Giỏi 9,430,000
30 625101K018 Nguyễn Hữu Lộc CQ.62.KS.KIENTRUC 7.95 3.3 Tốt Giỏi 9,430,000
31 625101K029 Đặng Quốc Dũng CQ.62.KS.KIENTRUC 7.79 3.27 Tốt Giỏi 9,430,000
32 625101K052 Đặng Minh Thành CQ.62.KS.KIENTRUC 7.66 3.27 Tốt Giỏi 9,430,000
33 625104C014 Nguyễn Văn Khiêm CQ.62.KS.KTCĐT 8.36 3.56 Xuất sắc Giỏi 9,430,000
34 625104C075 Phạm Văn Tin CQ.62.KS.KTCĐT 8.38 3.43 Xuất sắc Giỏi 9,430,000
35 625104C072 Trần Hoàng Thiện CQ.62.KS.KTCĐT 8.12 3.41 Xuất sắc Giỏi 9,430,000
36 625104C082 Huỳnh Đức Nhân CQ.62.KS.KTCĐT 7.83 3.28 Tốt Giỏi 9,430,000
37 625104C035 Nguyễn Quang Anh Vinh CQ.62.KS.KTCĐT 7.95 3.26 Xuất sắc Giỏi 9,430,000
38 625104C080 Phạm Ngọc Viên CQ.62.KS.KTCĐT 7.9 3.26 Tốt Giỏi 9,430,000
39 625104C034 Vũ Đức Việt CQ.62.KS.KTCĐT 7.89 3.26 Xuất sắc Giỏi 9,430,000
40 6251081019 Trần Thúy Hằng CQ.62.KS.KTMT 8.28 3.45 Tốt Giỏi 9,430,000
41 6251081020 Nguyễn Trung Hiếu CQ.62.KS.KTMT 8.45 3.43 Xuất sắc Giỏi 9,430,000
42 6254010008 Phạm Quốc Đạt CQ.62.KS.KTQLDTXD 9.01 3.81 Xuất sắc Xuất sắc 10,660,000
43 6254010089 Nguyễn Ngô Như Quỳnh CQ.62.KS.KTQLDTXD 8.96 3.8 Xuất sắc Xuất sắc 10,660,000
44 6254010036 Nguyễn Thị Ngọc Trâm CQ.62.KS.KTQLDTXD 8.95 3.8 Xuất sắc Xuất sắc 10,660,000
45 6254010011 Nguyễn Thị Hòa CQ.62.KS.KTQLDTXD 8.79 3.8 Xuất sắc Xuất sắc 10,660,000
46 6254010006 Nguyễn Thị Duyên CQ.62.KS.KTQLDTXD 8.85 3.76 Xuất sắc Xuất sắc 10,660,000
47 6254010025 Hoàng Như Quỳnh CQ.62.KS.KTQLDTXD 8.68 3.76 Xuất sắc Xuất sắc 10,660,000
48 6254010053 Nguyễn Thị Thu Hiền CQ.62.KS.KTQLDTXD 8.69 3.71 Xuất sắc Xuất sắc 10,660,000
49 6254010052 Lâm Kim Hạnh CQ.62.KS.KTQLDTXD 8.69 3.69 Xuất sắc Xuất sắc 10,660,000
50 6251020015 Võ Duy Tâm CQ.62.KS.KTVT 9.05 3.75 Xuất sắc Xuất sắc 10,660,000
51 6251020038 Lê Khánh Duy CQ.62.KS.KTVT 8.15 3.35 Tốt Giỏi 9,430,000
52 6251020067 Lê Đình Ẩn CQ.62.KS.KTVT 8.25 3.32 Xuất sắc Giỏi 9,430,000
53 6251020044 Vũ Văn Đức CQ.62.KS.KTVT 8 3.29 Tốt Giỏi 9,430,000
54 6251041002 Nguyễn Thành Công CQ.62.KS.MXD 8.53 3.65 Xuất sắc Xuất sắc 10,660,000
55 6251041057 Nguyễn Phúc Phát CQ.62.KS.MXD 8.11 3.41 Xuất sắc Giỏi 9,430,000
56 6251041041 Võ Nam Huy CQ.62.KS.MXD 7.97 3.28 Tốt Giỏi 9,430,000
57 6251041028 Nguyễn Văn Chức CQ.62.KS.MĐL 8.7 3.74 Xuất sắc Xuất sắc 10,660,000
58 6251041052 Nguyễn Hoàng Nam CQ.62.KS.MĐL 8.28 3.5 Tốt Giỏi 9,430,000
59 6251041060 Dương Minh Phước CQ.62.KS.MĐL 7.91 3.33 Xuất sắc Giỏi 9,430,000
60 6254051033 Phạm Kiều Phương Lam CQ.62.KS.QLDA 8.58 3.74 Xuất sắc Xuất sắc 10,660,000
61 6254051016 Trần Thị Bích CQ.62.KS.QLDA 8.55 3.68 Tốt Giỏi 9,430,000
62 6254051037 Trần Xuân Nhật CQ.62.KS.QLDA 8.58 3.64 Tốt Giỏi 9,430,000
63 6254051054 Nguyễn Duy Trường CQ.62.KS.QLDA 8.12 3.44 Tốt Giỏi 9,430,000
64 6251060010 La Thị Bích Ngân CQ.62.KS.TBDGT 8.73 3.58 Xuất sắc Giỏi 9,430,000
65 6251060060 Võ Nguyễn Xuân Trường CQ.62.KS.TBDGT 8.73 3.58 Xuất sắc Giỏi 9,430,000
66 6251060057 Man Đức Trí CQ.62.KS.TBDGT 8.67 3.58 Xuất sắc Giỏi 9,430,000
67 6251060061 Trần Nguyễn Tuấn CQ.62.KS.TBDGT 8.65 3.58 Xuất sắc Giỏi 9,430,000
68 6251060015 Nguyễn Minh Trúc CQ.62.KS.TBDGT 8.42 3.54 Tốt Giỏi 9,430,000
69 6251030065 Ngô Trần Minh Phú CQ.62.KS.TĐH 8.81 3.71 Xuất sắc Xuất sắc 10,660,000
70 6251030062 Văn Trọng Nghĩa CQ.62.KS.TĐH 8.96 3.84 Tốt Giỏi 9,430,000
71 6251030046 Đoàn Quang Huy CQ.62.KS.TĐH 8.65 3.65 Tốt Giỏi 9,430,000
72 6251030084 Võ Minh Thắng CQ.62.KS.TĐH 8.84 3.62 Tốt Giỏi 9,430,000
73 6251030085 Trần Võ Thể CQ.62.KS.TĐH 8.63 3.57 Xuất sắc Giỏi 9,430,000
74 6251030024 Đinh Quốc Tuấn CQ.62.KS.TĐH 8.57 3.57 Xuất sắc Giỏi 9,430,000
75 6251030033 Lê Xuân Bảo CQ.62.KS.TĐH 8.45 3.53 Tốt Giỏi 9,430,000
76 6251030106 Nguyễn Trí Vũ CQ.62.KS.TĐH 8.32 3.52 Tốt Giỏi 9,430,000
77 6251030052 Thái Đôn Khoa CQ.62.KS.TĐH 8.5 3.51 Xuất sắc Giỏi 9,430,000
78 6251030057 Hồ Đại Lộc CQ.62.KS.TĐH 8.59 3.5 Tốt Giỏi 9,430,000
79 6251100170 Phạm Văn Trường CQ.62.KS.XDDD.2 8.75 3.59 Tốt Giỏi 9,430,000
80 6251100164 Đỗ Nguyễn Ánh Trâm CQ.62.KS.XDDD.2 8.72 3.59 Xuất sắc Giỏi 9,430,000
81 6251100063 Ngô Kỳ Anh CQ.62.KS.XDDD.1 8.65 3.59 Xuất sắc Giỏi 9,430,000
82 6251100042 Nguyễn Văn Sự CQ.62.KS.XDDD.1 8.56 3.56 Xuất sắc Giỏi 9,430,000
83 6251100044 Nguyễn Trọng Tấn CQ.62.KS.XDDD.1 8.47 3.4 Tốt Giỏi 9,430,000
84 6251100117 Nguyễn Minh Khoa CQ.62.KS.XDDD.2 8.11 3.31 Tốt Giỏi 9,430,000
85 6251100064 Trần Quốc Anh CQ.62.KS.XDDD.1 8.08 3.26 Xuất sắc Giỏi 9,430,000
86 6251100141 Lê Viết Quý CQ.62.KS.XDDD.2 7.99 3.25 Tốt Giỏi 9,430,000
87 6251100017 Hoàng Ngọc Hải CQ.62.KS.XDDD.1 7.76 3.23 Tốt Giỏi 9,430,000
88 6251100133 Bùi Đức Nhất CQ.62.KS.XDDD.2 7.96 3.17 Tốt Khá 8,200,000
89 6251100119 Trần Hoài Liêm CQ.62.KS.XDDD.2 7.73 3.14 Khá Khá 8,200,000
90 6251100029 Đặng Xuân Lực CQ.62.KS.XDDD.1 7.39 3.12 Tốt Khá 8,200,000
91 6251100167 Ngô Thanh Triều CQ.62.KS.XDDD.2 7.65 3.11 Tốt Khá 8,200,000
92 6251100090 Lê Minh Hiền CQ.62.KS.XDDD.1 7.76 3.1 Tốt Khá 8,200,000
93 6251100012 Nguyễn Quang Đạt CQ.62.KS.XDDD.1 7.65 3.1 Tốt Khá 8,200,000
94 6251100163 Nguyễn Lê Thu Trang CQ.62.KS.XDDD.2 7.75 3.07 Tốt Khá 8,200,000
95 6251100020 Lê Minh Huân CQ.62.KS.XDDD.1 7.58 3.07 Tốt Khá 8,200,000
96 6251020018 Nguyễn Thị Thu Thủy CQ.62.KS.ĐTTH&CN 8.76 3.8 Xuất sắc Xuất sắc 10,660,000
97 6251020089 Lê Thị Mỹ Thương CQ.62.KS.ĐTTH&CN 8.54 3.62 Xuất sắc Xuất sắc 10,660,000
98 6251020037 Hà Nhật Chương CQ.62.KS.ĐTTH&CN 8.38 3.49 Xuất sắc Giỏi 9,430,000
99 6251020029 Mai Nguyễn Trường Vi CQ.62.KS.ĐTTH&CN 8.14 3.38 Xuất sắc Giỏi 9,430,000
100 6351071025 Lê Minh Hoàng CQ.63.CN.CNTT 8.87 3.78 Xuất sắc Xuất sắc 10,660,000
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
      // Regex to parse: STT StudentCode Name Class GPA10 GPA4 Ranking...
      const match = line.match(/^\d+\s+(\S+)\s+(.+?)\s+([A-Z0-9.]+)\s+/);
      if (match) {
        const student_code = match[1];
        const full_name = match[2];
        const email = `${student_code}@student.university.edu`;

        // Check if exists
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

    console.log(`Successfully added ${count} new students.`);
    process.exit(0);
  } catch (err) {
    console.error('FAILED:', err);
    process.exit(1);
  }
}

seedStudents();
