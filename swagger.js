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
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token (obtained from /auth/login or /auth/register)',
        },
      },
    },
    // Apply globally - remove if you want per-route control only
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js', './models/*.js'],
};

module.exports = swaggerJsdoc(options);