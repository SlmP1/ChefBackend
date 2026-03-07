const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Recipe API',
      version: '1.0.0',
      description: 'API for managing recipes and ingredients',
    },
    servers: [{ url: '/' }],
  },
 
  apis: ['./routes/*.js', './models/*.js'], // make sure models/Recipe.js is scanned if you put JSDoc there
  
};



module.exports = swaggerJsdoc(options);