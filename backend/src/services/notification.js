const nodemailer = require('nodemailer');
const axios = require('axios');

let transporter = null;

async function getTransporter() {
  if (transporter) {
    return transporter;
  }

  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('Ethereal email account ready.');
    return transporter;
  } catch (error) {
    console.error('Failed to create test email account:', error);
    // Return a mock that will fail, so the app doesn't crash on subsequent calls
    return {
      sendMail: () => Promise.reject('Transporter initialization failed'),
    };
  }
}

async function sendEmail({ to, subject, text, html }) {
  try {
    const emailTransporter = await getTransporter();
    const info = await emailTransporter.sendMail({
      from: '"MyApp Alerts" <alerts@myapp.com>',
      to: to.join(','),
      subject,
      text,
      html,
    });

    console.log('Message sent: %s', info.messageId);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('Preview URL: %s', previewUrl);
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

async function sendSlackNotification({ webhookUrl, text }) {
  if (!webhookUrl) {
    console.log('Slack webhook URL not provided. Skipping notification.');
    return;
  }
  try {
    await axios.post(webhookUrl, { text });
    console.log('Slack notification sent successfully.');
  } catch (error) {
    console.error('Error sending Slack notification:', error.message);
  }
}

module.exports = {
  sendEmail,
  sendSlackNotification,
};
