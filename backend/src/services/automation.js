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
          // This action is more for manual creation, recorded journeys will have better waits.
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
