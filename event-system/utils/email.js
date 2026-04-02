const nodemailer = require('nodemailer');

/**
 * Send an email using nodemailer
 * @param {Object} options - { email, subject, message }
 */
const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || process.env.MAIL_USER,
      pass: process.env.SMTP_PASS || process.env.MAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'EventPass <noreply@eventpass.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Email could not be sent');
  }
};

module.exports = sendEmail;
