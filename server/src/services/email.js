const nodemailer = require('nodemailer');

const smtpHost = process.env.SMTP_HOST || '127.0.0.1';
const smtpPort = Number(process.env.SMTP_PORT || 1025);
const webUrl = process.env.WEB_URL || 'http://localhost:3000';

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: false
});

async function sendVerificationEmail(user, token) {
  const verificationUrl = `${webUrl}/verify-email?token=${encodeURIComponent(token)}`;

  await transporter.sendMail({
    from: 'Astitva Local <no-reply@astitva.local>',
    to: user.email,
    subject: 'Verify your Astitva email',
    text: [
      `Hello ${user.name},`,
      '',
      'Verify your email address to finish setting up your local Astitva account:',
      verificationUrl,
      '',
      'This link expires in one hour.'
    ].join('\n')
  });
}

module.exports = { sendVerificationEmail };
