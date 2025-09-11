const router = require('express').Router();
const fs = require('fs').promises;
const path = require('path');
const Journey = require('../models/Journey');
const authMiddleware = require('../middleware/auth');
const { runJourney } = require('../services/automation');
const { generateJourneyFromText } = require('../services/llm');
const { parsePlaywrightCode } = require('../services/parser');
const { generatePlaywrightCode } = require('../services/code-generator');

// Use auth middleware for all journey routes
router.use(authMiddleware);

// POST /journeys/generate-from-text - Generate journey steps from natural language
router.post('/generate-from-text', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text input is required.' });
    }
    const journeyData = await generateJourneyFromText(text);
    res.json(journeyData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate journey from text.' });
  }
});

// POST /journeys/generate-code - Generate Playwright code from steps
router.post('/generate-code', (req, res) => {
  try {
    const { steps } = req.body;
    if (!steps || !Array.isArray(steps)) {
      return res.status(400).json({ error: 'Steps array is required.' });
    }
    const code = generatePlaywrightCode(steps);
    res.json({ code });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate code.' });
  }
});

// POST /journeys - Create a new journey
router.post('/', async (req, res) => {
  try {
    const { name, domain, steps } = req.body;
    const journey = await Journey.create({
      name,
      domain,
      steps,
      user: req.user.id
    });
    res.status(201).json(journey);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /journeys - Retrieve all journeys for the logged-in user
router.get('/', async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user.id };
    const journeys = await Journey.find(query);
    res.json(journeys);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /journeys/:id - Retrieve a single journey
router.get('/:id', async (req, res) => {
  try {
    const journey = await Journey.findOne({ _id: req.params.id, user: req.user.id })
      .populate('lastRun.testResult');
    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }
    res.json(journey);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /journeys/:id - Update a journey
router.put('/:id', async (req, res) => {
  try {
    const { name, code, steps, domain } = req.body;
    const journeyToUpdate = await Journey.findOne({ _id: req.params.id, user: req.user.id });

    if (!journeyToUpdate) {
      return res.status(404).json({ error: 'Journey not found' });
    }

    const updateData = { name: name || journeyToUpdate.name };

    if (steps) {
      updateData.steps = steps;
      updateData.domain = domain;
      updateData.code = code;
    } else if (code) {
      const tempDir = path.join(__dirname, '..', '..', 'temp_journeys');
      await fs.mkdir(tempDir, { recursive: true });
      const tempFile = path.join(tempDir, `update-${Date.now()}.js`);
      await fs.writeFile(tempFile, code);

      const { steps: newSteps, domain: newDomain } = await parsePlaywrightCode(tempFile);

      updateData.steps = newSteps;
      updateData.domain = newDomain;
      updateData.code = code;

      await fs.unlink(tempFile);
    }

    const updatedJourney = await Journey.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updatedJourney);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /journeys/:id - Delete a journey
router.delete('/:id', async (req, res) => {
  try {
    const journey = await Journey.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /journeys/:id/run - Manually trigger a journey run
router.post('/:id/run', async (req, res) => {
  try {
    const journey = await Journey.findOne({ _id: req.params.id, user: req.user.id });
    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }
    // No await here, run in the background
    runJourney(journey);
    res.status(202).json({ message: 'Journey execution started' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
