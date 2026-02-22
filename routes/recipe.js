const express = require('express');
const axios = require('axios');
const router = express.Router();

/**
 * @swagger
 * /recipe/generate:
 *   post:
 *     summary: Generate a recipe from external webhook
 *     tags: [Recipes]
 *     responses:
 *       200:
 *         description: Generated recipe
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 servings:
 *                   type: number
 *                 prepTimeMinutes:
 *                   type: number
 *                 cookTimeMinutes:
 *                   type: number
 *                 difficulty:
 *                   type: string
 *                 category:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.post('/generate', async (req, res) => {
  try {
    // Call the webhook URL from .env
    const response = await axios.post(process.env.WEBHOOK_URL);

    res.status(200).json(response.data);

  } catch (err) {
    res.status(500).json({
      error: 'Failed to generate recipe',
      details: err.message
    });
  }
});

module.exports = router;