const express = require('express');
const router = express.Router();
const Ingredient = require('../models/Ingredient');

/**
 * @swagger
 * /recipe/ingredients:
 *   get:
 *     summary: Get all ingredients from the database
 *     tags: [Recipes]
 *     responses:
 *       200:
 *         description: List of all ingredients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *       500:
 *         description: Server error
 */
router.get('/ingredients', async (req, res) => {
  try {
    const ingredients = await Ingredient.find({}, 'name');
    res.json(ingredients);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ingredients', details: err.message });
  }
});

module.exports = router;