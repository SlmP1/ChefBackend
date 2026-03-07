const express = require('express');
const axios = require('axios');
const router = express.Router();

const Recipe = require('../models/Recipe'); 

/**
 * @swagger
 * /recipe/generate:
 *   post:
 *     summary: Generate recipe via webhook and save to DB
 *     tags: [Recipes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Egg", "Salt", "Butter"]
 *     responses:
 *       200:
 *         description: Generated and saved recipe
 *       400:
 *         description: Missing ingredients
 *       500:
 *         description: Server / webhook error
 */
router.post('/generate', async (req, res) => {
  try {
    const { ingredients } = req.body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({
        error: 'Missing or invalid ingredients array',
      });
    }

    // Forward to webhook (adjust payload shape if webhook expects different format)
    const webhookResponse = await axios.post(process.env.WEBHOOK_URL, {
      ingredients,
    }, {
      timeout: 30000, // 30s timeout — webhook might be slow
    });

    const webhookData = webhookResponse.data;

    // Optional: validate minimal fields
    if (!webhookData.name || !webhookData.ingredients || !webhookData.steps) {
      return res.status(500).json({
        error: 'Invalid response from webhook — missing required fields',
      });
    }

    // Prepare document for MongoDB
    // We map external "id" → externalId to avoid conflict with MongoDB _id
    const newRecipe = new Recipe({
      externalId: webhookData.id,
      name: webhookData.name,
      description: webhookData.description,
      servings: webhookData.servings,
      prepTimeMinutes: webhookData.prepTimeMinutes,
      cookTimeMinutes: webhookData.cookTimeMinutes,
      ingredients: webhookData.ingredients,
      steps: webhookData.steps,
      difficulty: webhookData.difficulty,
      category: webhookData.category,
      isVegetarian: webhookData.isVegetarian,
      // createdAt is auto-set by schema
    });

    // Save to MongoDB
    const savedRecipe = await newRecipe.save();

    // Return the saved document to frontend (includes MongoDB _id)
    res.status(200).json(savedRecipe);

  } catch (err) {
    console.error('Error in /generate:', err);

    let status = 500;
    let message = 'Failed to generate or save recipe';

    if (err.response) {
      // Webhook returned error
      status = err.response.status;
      message = `Webhook error: ${err.response.statusText}`;
    } else if (err.request) {
      message = 'No response from webhook (timeout or unreachable)';
    }

    res.status(status).json({
      error: message,
      details: err.message,
    });
  }
});

module.exports = router;