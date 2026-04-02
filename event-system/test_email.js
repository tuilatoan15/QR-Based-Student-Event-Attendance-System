require('dotenv').config();
const sendEmail = require('./utils/email');

async function test() {
  console.log('--- Testing email sending ---');
  console.log('User:', process.env.MAIL_USER);
  
  try {
    await sendEmail({
      email: process.env.MAIL_USER, // gửi cho chính mình để test
      subject: '[Test] Kiểm tra chức năng gửi mail EventPass',
      message: 'Đây là email thử nghiệm chức năng gửi mật khẩu của EventPass. Nếu bạn nhận được email này, chức năng đã hoạt động tốt.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #00CCFF;">EventPass - Kiểm tra hệ thống</h2>
          <p>Chào bạn,</p>
          <p>Đây là <strong>email thử nghiệm</strong> chức năng gửi mật khẩu của hệ thống <strong>EventPass</strong>.</p>
          <p>Nếu bạn nhận được email này, nghĩa là cấu hình SMTP trong file .env đã hoạt động chính xác.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">Email test tự động.</p>
        </div>
      `,
    });
    console.log('SUCCESS: Email sent successfully!');
  } catch (error) {
    console.error('FAILED: Error occurred while sending email:', error.message);
  }
}

test();
