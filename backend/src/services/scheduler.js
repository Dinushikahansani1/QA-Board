const cron = require('node-cron');
const Journey = require('../models/Journey');
const { runJourney } = require('./automation');

// Schedule to run every 5 minutes
const task = cron.schedule('*/5 * * * *', async () => {
  console.log('Running scheduled journey checks...');
  try {
    const journeys = await Journey.find();
    console.log(`Found ${journeys.length} journeys to check.`);
    for (const journey of journeys) {
      // In a real application, you might have more complex logic
      // to decide which journeys to run. For now, we run all of them.
      console.log(`Starting journey: ${journey.name}`);
      runJourney(journey); // run in the background
    }
  } catch (error) {
    console.error('Error during scheduled journey execution:', error);
  }
});

module.exports = task;
