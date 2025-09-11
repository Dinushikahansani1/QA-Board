const router = require('express').Router();
const fs = require('fs').promises;
const path = require('path');
const Journey = require('../models/Journey');
const { parsePlaywrightCode } = require('../services/parser');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/journey', async (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) {
    return res.status(400).json({ error: 'Journey name and code are required.' });
  }

  const tempDir = path.join(__dirname, '..', '..', 'temp_journeys');
  await fs.mkdir(tempDir, { recursive: true });
  const tempFile = path.join(tempDir, `import-${Date.now()}.js`);

  try {
    await fs.writeFile(tempFile, code);

    const { steps, domain } = await parsePlaywrightCode(tempFile);

    if (steps.length === 0) {
      return res.status(400).json({ error: 'Could not parse any actionable steps from the code provided.' });
    }

    if (!domain) {
      return res.status(400).json({ error: 'Could not determine the domain from the script. Please make sure your script includes a `page.goto()` call with a valid URL.' });
    }

    const journey = await Journey.create({
      name,
      domain,
      steps,
      code,
      user: req.user.id,
    });

    const journeysDir = path.join(__dirname, '..', 'journeys');
    await fs.mkdir(journeysDir, { recursive: true });
    const journeyFile = path.join(journeysDir, `${journey._id}.js`);
    await fs.writeFile(journeyFile, code);

    res.status(201).json(journey);
  } catch (error) {
    console.error('Error during import process:', error);
    res.status(500).json({ error: 'An error occurred during the import process.' });
  } finally {
    try {
      await fs.unlink(tempFile);
    } catch (err) {
      // Ignore
    }
  }
});

module.exports = router;
