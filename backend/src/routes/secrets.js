const express = require('express');
const router = express.Router();
const Secret = require('../models/Secret');
const authMiddleware = require('../middleware/auth');
const { encrypt, decrypt } = require('../services/encryption');

// Use auth middleware for all secret routes
router.use(authMiddleware);

// GET /api/secrets - List all secret keys for the logged-in user
router.get('/', async (req, res) => {
  try {
    const secrets = await Secret.find({ user: req.user.id }).select('name createdAt');
    res.json(secrets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve secrets.' });
  }
});

// POST /api/secrets - Create a new secret
router.post('/', async (req, res) => {
  try {
    const { name, value } = req.body;
    if (!name || !value) {
      return res.status(400).json({ error: 'Name and value are required.' });
    }

    // Encrypt the secret value before storing
    const encryptedValue = encrypt(value);

    const secret = await Secret.create({
      name,
      value: encryptedValue,
      user: req.user.id,
    });

    // Return only non-sensitive fields
    res.status(201).json({ _id: secret._id, name: secret.name, createdAt: secret.createdAt });
  } catch (error) {
    if (error.code === 11000) { // Handle duplicate key error
      return res.status(409).json({ error: 'A secret with this name already exists.' });
    }
    res.status(500).json({ error: 'Failed to create secret.' });
  }
});

// DELETE /api/secrets/:id - Delete a secret
router.delete('/:id', async (req, res) => {
  try {
    const secret = await Secret.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!secret) {
      return res.status(404).json({ error: 'Secret not found.' });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete secret.' });
  }
});

module.exports = router;
