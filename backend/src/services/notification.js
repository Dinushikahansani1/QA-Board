const nodemailer = require('nodemailer');
const axios = require('axios');

// Create a test account for development
let testAccount;
(async () => {
  testAccount = await nodemailer.createTestAccount();
})();

const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: testAccount.user, // generated ethereal user
    pass: testAccount.pass, // generated ethereal password
  },
});

async function sendEmail({ to, subject, text, html }) {
  if (!testAccount) {
    console.error('Test email account not ready yet.');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: '"MyApp Alerts" <alerts@myapp.com>',
      to: to.join(','), // list of receivers
      subject,
      text,
      html,
    });

    console.log('Message sent: %s', info.messageId);
    // Preview only available when sending through an Ethereal account
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
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
