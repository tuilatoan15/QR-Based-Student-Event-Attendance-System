const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const spec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'QR-Based Student Event Attendance API',
      version: '2.0.0',
      description: 'MongoDB + Mongoose backend for registration and attendance',
    },
    servers: [{ url: 'http://localhost:5000', description: 'Local server' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    paths: {
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a student account',
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login and get a JWT token',
        },
      },
      '/api/events': {
        get: {
          tags: ['Events'],
          summary: 'List active events',
        },
        post: {
          tags: ['Events'],
          summary: 'Create a new event',
          security: [{ bearerAuth: [] }],
        },
      },
      '/api/events/{id}/register': {
        post: {
          tags: ['Registration'],
          summary: 'Register the authenticated user for an event',
          security: [{ bearerAuth: [] }],
        },
      },
      '/api/attendance/check-in': {
        post: {
          tags: ['Attendance'],
          summary: 'Check in an attendee using their QR token',
          security: [{ bearerAuth: [] }],
        },
      },
    },
  },
  apis: [],
});

const setupSwagger = (app) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec));
};

module.exports = {
  setupSwagger,
  spec,
};
