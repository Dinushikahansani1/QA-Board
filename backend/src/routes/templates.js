const express = require('express');
const router = express.Router();
const journeyTemplates = require('../constants/journeyTemplates');
const authMiddleware = require('../middleware/auth');

// Use auth middleware for all template routes
router.use(authMiddleware);

/**
 * @swagger
 * /api/templates:
 *   get:
 *     summary: Retrieve a list of journey templates
 *     description: Retrieve a list of predefined journey templates that can be used to create new journeys.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of journey templates.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: The name of the template.
 *                   description:
 *                     type: string
 *                     description: A brief description of the template.
 *                   steps:
 *                     type: array
 *                     description: The steps of the journey.
 *                     items:
 *                       type: object
 */
router.get('/', (req, res) => {
  res.json(journeyTemplates);
});

module.exports = router;
