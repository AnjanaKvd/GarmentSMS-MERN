const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Garment SMS API',
      version: '1.0.0',
      description: 'Garment Stock Management System API Documentation',
      contact: {
        name: 'API Support'
      },
      servers: [
        {
          url: 'http://localhost:5000',
          description: 'Development server'
        }
      ]
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './routes/*.js',
    './models/*.js'
  ]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
const swaggerRouter = require('express').Router();

swaggerRouter.use('/', swaggerUi.serve);
swaggerRouter.get('/', swaggerUi.setup(swaggerDocs));

module.exports = swaggerRouter; 