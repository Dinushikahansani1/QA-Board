const { chromium, expect } = require('playwright');
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
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const logs = [];
  let status = 'success';
  // let screenshotPath;

  try {
    // 1. Fetch and decrypt secrets for the user
    const userSecrets = await Secret.find({ user: journey.user });
    const secretMap = new Map();
    for (const secret of userSecrets) {
      secretMap.set(secret.name, decrypt(secret.value));
    }

    // 2. Create a substitution function
    const substituteSecrets = (text) => {
      if (typeof text !== 'string') return text;
      // Regex updated to handle optional whitespace around the secret name
      return text.replace(/{{secrets\.\s*([a-zA-Z0-9_]+)\s*}}/g, (match, secretName) => {
        if (secretMap.has(secretName)) {
          return secretMap.get(secretName);
        }
        // If secret not found, return the placeholder to make it obvious in logs
        logs.push(`Warning: Secret "${secretName}" not found in vault.`);
        return match;
      });
    };

    for (const step of journey.steps) {
      // 3. Substitute secrets in params before execution
      const processedParams = {};
      for (const key in step.params) {
        processedParams[key] = substituteSecrets(step.params[key]);
      }

      logs.push(`Executing action: ${step.action} with params: ${JSON.stringify(processedParams)}`);

      // Helper function to get a locator object safely from either a string or our structured object
      const getLocator = (selector) => {
        if (typeof selector === 'object' && selector.method && Array.isArray(selector.args)) {
          // It's our structured locator from the parser
          let locator;
          if (typeof page[selector.method] === 'function') {
            locator = page[selector.method](...selector.args);
          } else {
            throw new Error(`Unsupported locator method: ${selector.method}`);
          }

          if (selector.chain && Array.isArray(selector.chain)) {
            for (const chainedCall of selector.chain) {
              if (typeof locator[chainedCall.action] === 'function') {
                locator = locator[chainedCall.action](...chainedCall.args);
              } else {
                throw new Error(`Unsupported chained action: ${chainedCall.action}`);
              }
            }
          }
          return locator;
        }
        // It's a simple string selector for manually created steps
        return page.locator(selector);
      };

      const getAssertion = (locator, not) => {
        return not ? expect(locator).not : expect(locator);
      };

      switch (step.action) {
        case 'goto':
          await page.goto(processedParams.url);
          break;
        case 'click':
          {
            const locator = getLocator(processedParams.selector);
            await locator.click();
          }
          break;
        case 'type':
          {
            const locator = getLocator(processedParams.selector);
            await locator.fill(processedParams.text); // Using fill is more robust for locators
          }
          break;
        case 'waitForSelector':
          // This action is more for manual creation, recorded journeys will have better waits.
          await page.waitForSelector(processedParams.selector);
          break;
        // Assertions
        case 'toHaveText':
          {
            const locator = getLocator(processedParams.selector);
            await getAssertion(locator, processedParams.not).toHaveText(processedParams.text);
          }
          break;
        case 'toContainText':
            {
              const locator = getLocator(processedParams.selector);
              await getAssertion(locator, processedParams.not).toContainText(processedParams.text);
            }
            break;
        case 'toBeVisible':
          {
            const locator = getLocator(processedParams.selector);
            await getAssertion(locator, processedParams.not).toBeVisible();
          }
          break;
        case 'toHaveAttribute':
          {
            const locator = getLocator(processedParams.selector);
            await getAssertion(locator, processedParams.not).toHaveAttribute(processedParams.attribute, processedParams.value);
          }
          break;
        case 'press':
          {
            const locator = getLocator(processedParams.selector);
            await locator.press(processedParams.text);
          }
          break;
        case 'selectOption':
          {
            const locator = getLocator(processedParams.selector);
            await locator.selectOption(processedParams.value);
          }
          break;
        default:
          throw new Error(`Unsupported action: ${step.action}`);
      }
    }
  } catch (error) {
    status = 'failure';
    logs.push(`Error: ${error.message}`);
    // Screenshot functionality commented out for now
    // const screenshotFileName = `${journey._id}-${Date.now()}.png`;
    // screenshotPath = path.join(screenshotsDir, screenshotFileName);
    // await page.screenshot({ path: screenshotPath });
  } finally {
    await browser.close();

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
