const { chromium, expect } = require('playwright');
const { exec } = require('child_process');
const Journey = require('../models/Journey');
const Secret = require('../models/Secret');
const { decrypt } = require('./encryption');
const TestResult = require('../models/TestResult');
const Alert = require('../models/Alert');
const NotificationSetting = require('../models/NotificationSetting');
const webSocketService = require('./websocket');
const notificationService = require('./notification');
const fs = require('fs');
const path = require('path');

// const screenshotsDir = path.join(__dirname, '..', '..', 'screenshots');
// if (!fs.existsSync(screenshotsDir)) {
//   fs.mkdirSync(screenshotsDir, { recursive: true });
// }

async function runJourney(journey) {
  const logs = [];
  let status = 'success';

  try {
    if (!journey.code) {
      throw new Error('Journey has no code to run.');
    }

    const userSecrets = await Secret.find({ user: journey.user });
    const secretMap = new Map();
    for (const secret of userSecrets) {
      secretMap.set(secret.name, decrypt(secret.value));
    }

    const substituteSecrets = (text) => {
      if (typeof text !== 'string') return text;
      return text.replace(/{{secrets\.\s*([a-zA-Z0-9_]+)\s*}}/g, (match, secretName) => {
        if (secretMap.has(secretName)) {
          return secretMap.get(secretName);
        }
        logs.push(`Warning: Secret "${secretName}" not found in vault.`);
        return match;
      });
    };

    const processedCode = substituteSecrets(journey.code);

    const tempDir = path.join(__dirname, '..', '..', 'temp_journeys');
    await fs.promises.mkdir(tempDir, { recursive: true });
    const tempFile = path.join(tempDir, `run-${journey._id}-${Date.now()}.js`);
    await fs.promises.writeFile(tempFile, processedCode);

    await new Promise((resolve) => {
      exec(`npx playwright test ${tempFile}`, (error, stdout, stderr) => {
        if (error) {
          logs.push(`Execution error: ${error.message}`);
          status = 'failure';
        }
        if (stderr) {
          logs.push(`stderr: ${stderr}`);
        }
        logs.push(`stdout: ${stdout}`);
        resolve();
      });
    });

    await fs.promises.unlink(tempFile);

  } catch (error) {
    status = 'failure';
    logs.push(`Error: ${error.message}`);
  } finally {

    const testResult = await TestResult.create({
      journey: journey._id,
      status,
      logs: logs.join('\n'),
      // screenshot: screenshotPath, // Commented out since we're not taking screenshots
      screenshot: null, // Explicitly set to null
    });

    await Journey.findByIdAndUpdate(journey._id, {
      lastRun: {
        status,
        runAt: new Date(),
        testResult: testResult._id,
      },
    });

    if (status === 'failure') {
      const settings = await NotificationSetting.findOne({ journey: journey._id });
      const threshold = settings ? settings.failureThreshold : 1;

      const recentFailures = await TestResult.countDocuments({
        journey: journey._id,
        status: 'failure',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Check last 24h for relevant failures
      }).sort({ createdAt: -1 }).limit(threshold);

      if (recentFailures >= threshold) {
        const newAlert = await Alert.create({
          journey: journey._id,
          testResult: testResult._id,
          user: journey.user,
        });

        const populatedAlert = await Alert.findById(newAlert._id).populate({
          path: 'journey',
          select: 'name'
        });

        webSocketService.broadcast({
          type: 'NEW_ALERT',
          payload: populatedAlert,
        });

        if (settings) {
          const alertText = `Alert: Journey "${populatedAlert.journey.name}" failed at ${new Date(populatedAlert.createdAt).toLocaleString()}.`;
          const alertHtml = `<p><strong>Alert:</strong> Journey "<strong>${populatedAlert.journey.name}</strong>" failed at ${new Date(populatedAlert.createdAt).toLocaleString()}.</p><p>View the full report for more details.</p>`;

          if (settings.emails && settings.emails.length > 0) {
            notificationService.sendEmail({
              to: settings.emails,
              subject: `Alert: ${populatedAlert.journey.name} Failed`,
              text: alertText,
              html: alertHtml,
            });
          }

          if (settings.slackWebhookUrl) {
            notificationService.sendSlackNotification({
              webhookUrl: settings.slackWebhookUrl,
              text: alertText,
            });
          }
        }
      }
    }
  }
}

module.exports = { runJourney };
