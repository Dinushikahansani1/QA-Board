// Test script to verify Playwright automation without a database connection.
const { runJourney } = require('./src/services/automation');
const mongoose = require('mongoose');

// Manually mock the Mongoose models before they are used inside runJourney
const TestResult = require('./src/models/TestResult');
const Journey = require('./src/models/Journey');

let testStatus = 'failure'; // Default to failure

TestResult.create = async (data) => {
  console.log('Mock TestResult.create called with:', data);
  // If we get here, it means the Playwright part was successful
  if (data.status === 'success') {
      testStatus = 'success';
  }
  return Promise.resolve(data);
};

Journey.findByIdAndUpdate = async (id, data) => {
  console.log('Mock Journey.findByIdAndUpdate called with:', id, data);
  return Promise.resolve({});
};

async function testAutomationNoDb() {
  console.log('Starting automation test (with mocked DB)...');

  try {
    const journeyId = new mongoose.Types.ObjectId();
    const dummyJourney = {
      _id: journeyId,
      name: 'Test Example.com',
      steps: [
        { action: 'goto', params: { url: 'http://example.com' } },
        { action: 'waitForSelector', params: { selector: 'h1' } },
      ],
      user: new mongoose.Types.ObjectId(),
    };

    console.log(`Running dummy journey: ${dummyJourney.name}`);
    await runJourney(dummyJourney);
    console.log('Journey execution finished.');

    if (testStatus === 'success') {
        console.log('Test PASSED (with mocked DB)!');
    } else {
        console.error('Test FAILED (with mocked DB)! See logs for details.');
    }

  } catch (error) {
    console.error('An error occurred during the test:', error);
  }
}

testAutomationNoDb();
