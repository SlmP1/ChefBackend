const express = require('express');
const axios = require('axios');
const router = express.Router();

const Recipe = require('../models/Recipe'); 
const { protect } = require('../middleware/auth');
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
router.post('/generate', protect, async (req, res) => {
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

/**
 * @swagger
 * /recipe/recipes:
 *   get:
 *     summary: Get all saved recipes from database
 *     tags: [Recipes]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of recipes to return
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest]
 *           default: newest
 *         description: Sort by creation date (newest/oldest)
 *     responses:
 *       200:
 *         description: List of saved recipes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Recipe'  # თუ გაქვს swagger schema
 *       500:
 *         description: Server error
 */
router.get('/recipes', protect, async (req, res) => {
  try {
    const { limit = 20, sort = 'newest' } = req.query;

   
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({ error: 'Invalid limit value' });
    }

    
    const sortOption = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const recipes = await Recipe.find()
      .sort(sortOption)              
      .limit(limitNum)               
      .lean();                       

    res.status(200).json(recipes);

  } catch (err) {
    console.error('Error fetching recipes:', err);
    res.status(500).json({
      error: 'Failed to fetch saved recipes',
      details: err.message,
    });
  }
}); 



/**
 * @swagger
 * /recipe/recipes/{externalId}:
 *   delete:
 *     summary: Delete a saved recipe by its externalId
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: externalId
 *         required: true
 *         schema:
 *           type: string
 *         description: The external ID of the recipe to delete
 *     responses:
 *       200:
 *         description: Recipe deleted successfully
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 */
router.delete('/recipes/:externalId', protect, async (req, res) => {
  try {
    const { externalId } = req.params;

    const result = await Recipe.deleteOne({ externalId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    res.status(200).json({
      message: 'Recipe deleted successfully',
      deletedCount: result.deletedCount,
    });

  } catch (err) {
    console.error('Error deleting recipe:', err);
    res.status(500).json({
      error: 'Failed to delete recipe',
      details: err.message,
    });
  }
});

module.exports = router;

