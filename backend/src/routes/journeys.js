const router = require('express').Router();
const Journey = require('../models/Journey');
const authMiddleware = require('../middleware/auth');
const { runJourney } = require('../services/automation');

// Use auth middleware for all journey routes
router.use(authMiddleware);

// POST /journeys - Create a new journey
router.post('/', async (req, res) => {
  try {
    const { name, steps } = req.body;
    const journey = await Journey.create({
      name,
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
    const journeys = await Journey.find({ user: req.user.id });
    res.json(journeys);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /journeys/:id - Retrieve a single journey
router.get('/:id', async (req, res) => {
  try {
    const journey = await Journey.findOne({ _id: req.params.id, user: req.user.id });
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
    const { name, steps } = req.body;
    const journey = await Journey.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { name, steps },
      { new: true }
    );
    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }
    res.json(journey);
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
