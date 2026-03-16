require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const recipeRouter = require('./routes/recipe');
const ingredientRouter = require('./routes/ingredient');
const authRoutes = require('./routes/auth');
const { protect } = require('./middleware/auth');

const app = express();
app.use(cors({                                                                                                                                                                     
origin: function(origin, callback) {                                                                                                                                                                                                                                                                                                                                              
 callback(null, origin || true);                                                                                                                                                
  },                                                                                                                                                                               
credentials: true                                                                                                                                                              
 })); // allows all origins
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// Unprotected routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/auth', authRoutes);

// Protected routes - require valid JWT for all routes below
app.use(protect);
app.use('/recipe', recipeRouter);
app.use('/recipe', ingredientRouter);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));