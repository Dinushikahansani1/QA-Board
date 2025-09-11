const { chromium, expect } = require('@playwright/test');
const Journey = require('../models/Journey');
const TestResult = require('../models/TestResult');
const Alert = require('../models/Alert');
const NotificationSetting = require('../models/NotificationSetting');
const webSocketService = require('./websocket');
const notificationService = require('./notification');
const fs = require('fs');
const path = require('path');

// NOTE: Secrets are not yet implemented in this focused feature.
// This will need to be re-introduced when the secrets vault is built.

const screenshotsDir = path.join(__dirname, '..', '..', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function runJourney(journey) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const logs = [];
  let status = 'success';
  let screenshotPath;

  try {
    for (const step of journey.steps) {
      logs.push(`Executing action: ${step.action} with params: ${JSON.stringify(step.params)}`);

      // Helper function to get a locator object safely from either a string or our structured object
      const getLocator = (selector) => {
        if (typeof selector === 'object' && selector.method && Array.isArray(selector.args)) {
          // It's our structured locator from the parser
          if (typeof page[selector.method] === 'function') {
            return page[selector.method](...selector.args);
          } else {
            throw new Error(`Unsupported locator method: ${selector.method}`);
          }
        }
        // It's a simple string selector for manually created steps
        return page.locator(selector);
      };

      switch (step.action) {
        case 'goto':
          await page.goto(step.params.url);
          break;
        case 'click':
          const clickLocator = getLocator(step.params.selector);
          await clickLocator.click();
          break;
        case 'type':
          const typeLocator = getLocator(step.params.selector);
          await typeLocator.fill(step.params.text); // Using fill is more robust for locators
          break;
        case 'waitForSelector':
          await page.waitForSelector(step.params.selector);
          break;
        case 'expect':
          const { target, selector, assertion, value, options, soft } = step.params;
          const expectFn = soft ? expect.soft : expect;
          let expectTarget;

          if (target === 'page') {
            expectTarget = expectFn(page);
          } else {
            const locator = getLocator(selector);
            expectTarget = expectFn(locator);
          }

          // Handle negation by splitting assertion string. e.g., "not.toBeVisible"
          const assertionParts = assertion.split('.');
          if (assertionParts[0] === 'not') {
            expectTarget = expectTarget.not;
            assertionParts.shift();
          }
          const finalAssertion = assertionParts.join('.');


          if (typeof expectTarget[finalAssertion] !== 'function') {
            throw new Error(`Unsupported assertion: ${finalAssertion}`);
          }

          if (value !== undefined && value !== null) {
            await expectTarget[finalAssertion](value, options);
          } else {
            await expectTarget[finalAssertion](options);
          }
          break;
        default:
          throw new Error(`Unsupported action: ${step.action}`);
      }
    }
  } catch (error) {
    status = 'failure';
    logs.push(`Error: ${error.message}`);
    const screenshotFileName = `${journey._id}-${Date.now()}.png`;
    screenshotPath = path.join(screenshotsDir, screenshotFileName);
    await page.screenshot({ path: screenshotPath });
  } finally {
    await browser.close();

    const testResult = await TestResult.create({
      journey: journey._id,
      status,
      logs: logs.join('\n'),
      screenshot: screenshotPath,
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
