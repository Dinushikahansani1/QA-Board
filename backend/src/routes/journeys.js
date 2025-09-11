const router = require('express').Router();
const fs = require('fs').promises;
const path = require('path');
const Journey = require('../models/Journey');
const authMiddleware = require('../middleware/auth');
const { runJourney } = require('../services/automation');
const { generateJourneyFromText } = require('../services/llm');
const { generatePlaywrightCode } = require('../services/code-generator');
const { parsePlaywrightCode } = require('../services/parser');

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

// POST /journeys - Create a new journey
router.post('/', async (req, res) => {
  try {
    const { name, domain, steps } = req.body;
    const code = generatePlaywrightCode(steps);
    const journey = await Journey.create({
      name,
      domain,
      steps,
      code,
      user: req.user.id
    });

    const journeysDir = path.join(__dirname, '..', 'journeys');
    await fs.mkdir(journeysDir, { recursive: true });
    const journeyFile = path.join(journeysDir, `${journey._id}.js`);
    await fs.writeFile(journeyFile, code);

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
    const { name, domain, steps, code } = req.body;
    const journeyToUpdate = await Journey.findOne({ _id: req.params.id, user: req.user.id });

    if (!journeyToUpdate) {
      return res.status(404).json({ error: 'Journey not found' });
    }

    const updateData = { name: name || journeyToUpdate.name };
    let newCode = code;

    if (steps) {
      // If steps are provided, generate new code
      newCode = generatePlaywrightCode(steps);
      updateData.steps = steps;
      updateData.domain = domain;
      updateData.code = newCode;
    } else if (code) {
      // If only code is provided, parse it
      const tempDir = path.join(__dirname, '..', '..', 'temp_journeys');
      await fs.mkdir(tempDir, { recursive: true });
      const tempFile = path.join(tempDir, `update-${Date.now()}.js`);
      await fs.writeFile(tempFile, code);
      const { steps: newSteps, domain: newDomain } = await parsePlaywrightCode(tempFile);
      await fs.unlink(tempFile);

      updateData.steps = newSteps;
      updateData.domain = newDomain;
      updateData.code = code;
    }

    const updatedJourney = await Journey.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    // Update the journey file
    const journeysDir = path.join(__dirname, '..', 'journeys');
    const journeyFile = path.join(journeysDir, `${updatedJourney._id}.js`);
    await fs.writeFile(journeyFile, newCode || updatedJourney.code);

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
