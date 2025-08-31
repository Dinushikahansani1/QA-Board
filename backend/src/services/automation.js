const playwright = require('playwright');
const Journey = require('../models/Journey');
const TestResult = require('../models/TestResult');
const fs = require('fs');
const path = require('path');

const screenshotsDir = path.join(__dirname, '..', '..', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function runJourney(journey) {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const logs = [];
  let status = 'success';
  let screenshotPath;

  try {
    for (const step of journey.steps) {
      logs.push(`Executing action: ${step.action} with params: ${JSON.stringify(step.params)}`);
      switch (step.action) {
        case 'goto':
          await page.goto(step.params.url);
          break;
        case 'click':
          await page.click(step.params.selector);
          break;
        case 'type':
          await page.type(step.params.selector, step.params.text);
          break;
        case 'waitForSelector':
          await page.waitForSelector(step.params.selector);
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
  }
}

module.exports = { runJourney };
