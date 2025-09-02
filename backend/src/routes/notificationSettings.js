const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const NotificationSetting = require('../models/NotificationSetting');
const Journey = require('../models/Journey');

// @route   GET /api/notification-settings/:journeyId
// @desc    Get notification settings for a journey
// @access  Private
router.get('/:journeyId', auth, async (req, res) => {
  try {
    const journey = await Journey.findById(req.params.journeyId);
    if (!journey) {
      return res.status(404).json({ msg: 'Journey not found' });
    }

    // Ensure the user owns the journey
    if (journey.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    let settings = await NotificationSetting.findOne({ journey: req.params.journeyId, user: req.user.id });

    if (!settings) {
      // If no settings exist, return default values
      settings = {
        failureThreshold: 1,
        emails: [],
        slackWebhookUrl: '',
      };
    }

    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/notification-settings/:journeyId
// @desc    Create or update notification settings for a journey
// @access  Private
router.put('/:journeyId', auth, async (req, res) => {
  const { failureThreshold, emails, slackWebhookUrl } = req.body;

  try {
    const journey = await Journey.findById(req.params.journeyId);
    if (!journey) {
      return res.status(404).json({ msg: 'Journey not found' });
    }

    if (journey.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    const settingsFields = {};
    if (failureThreshold) settingsFields.failureThreshold = failureThreshold;
    if (emails) settingsFields.emails = emails;
    if (slackWebhookUrl) settingsFields.slackWebhookUrl = slackWebhookUrl;
    settingsFields.user = req.user.id;
    settingsFields.journey = req.params.journeyId;

    let settings = await NotificationSetting.findOneAndUpdate(
      { journey: req.params.journeyId, user: req.user.id },
      { $set: settingsFields },
      { new: true, upsert: true }
    );

    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
