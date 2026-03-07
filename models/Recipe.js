const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  id: { type: String },
  name: { type: String, required: true },
  quantity: { type: Number },
  unit: { type: String },
});

const recipeSchema = new mongoose.Schema({
  externalId: { type: String, unique: true, sparse: true }, 
  name: { type: String, required: true },
  description: { type: String },
  servings: { type: Number },
  prepTimeMinutes: { type: Number },
  cookTimeMinutes: { type: Number },
  ingredients: [ingredientSchema],
  steps: [{ type: String }],
  difficulty: { type: String },
  category: { type: String },
  isVegetarian: { type: Boolean },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Recipe', recipeSchema);