const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'QR-Based Student Event Attendance API',
      version: '1.0.0',
      description: 'Backend API for event registration and QR-based attendance check-in'
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' }
          }
        },
        RegisterBody: {
          type: 'object',
          required: ['full_name', 'email', 'password'],
          properties: {
            full_name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'student@example.com' },
            password: { type: 'string', format: 'password' },
            student_code: { type: 'string', nullable: true }
          }
        },
        LoginBody: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password' }
          }
        },
        EventBody: {
          type: 'object',
          required: ['title', 'location', 'start_time', 'end_time', 'max_participants'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            location: { type: 'string' },
            start_time: { type: 'string', format: 'date-time' },
            end_time: { type: 'string', format: 'date-time' },
            max_participants: { type: 'integer', minimum: 1 },
            category_id: { type: 'integer', nullable: true }
          }
        },
        CheckinBody: {
          type: 'object',
          required: ['qr_token'],
          properties: {
            qr_token: { type: 'string', description: 'UUID from registration' }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Authentication' },
      { name: 'Events', description: 'Event CRUD' },
      { name: 'Registration', description: 'Event registration' },
      { name: 'Attendance', description: 'QR check-in' },
      { name: 'Users', description: 'User events' }
    ]
  },
  apis: []
};

const spec = swaggerJsdoc(options);

// Manual paths (no JSDoc in controllers)
spec.paths = {
  '/api/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Register',
      requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterBody' } } } },
      responses: {
        201: { description: 'Registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        409: { description: 'Email already registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
      }
    }
  },
  '/api/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Login',
      requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginBody' } } } },
      responses: {
        200: { description: 'Login success', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
      }
    }
  },
  '/api/events': {
    get: {
      tags: ['Events'],
      summary: 'List events',
      responses: { 200: { description: 'List of events', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } }
    },
    post: {
      tags: ['Events'],
      summary: 'Create event',
      security: [{ bearerAuth: [] }],
      requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/EventBody' } } } },
      responses: {
        201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
      }
    }
  },
  '/api/events/{id}': {
    get: {
      tags: ['Events'],
      summary: 'Get event by id',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Event', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
      }
    },
    put: {
      tags: ['Events'],
      summary: 'Update event',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/EventBody' } } } },
      responses: {
        200: { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
      }
    },
    delete: {
      tags: ['Events'],
      summary: 'Delete event (soft)',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
      }
    }
  },
  '/api/events/{id}/register': {
    post: {
      tags: ['Registration'],
      summary: 'Register for event',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: {
        201: { description: 'Registered; returns qr_token and qr_code (image data URL)', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        400: { description: 'Already registered or event full', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        404: { description: 'Event not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
      }
    }
  },
  '/api/events/{id}/registrations': {
    get: {
      tags: ['Events'],
      summary: 'List registrations for event',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'List of registrations', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
      }
    }
  },
  '/api/events/{id}/attendances': {
    get: {
      tags: ['Attendance'],
      summary: 'List attendances for event',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'List of attendances', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
      }
    }
  },
  '/api/users/me/events': {
    get: {
      tags: ['Users'],
      summary: 'Current user registered events',
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: 'List of user events', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
      }
    }
  },
  '/api/attendance/checkin': {
    post: {
      tags: ['Attendance'],
      summary: 'Check-in by QR token',
      security: [{ bearerAuth: [] }],
      requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/CheckinBody' } } } },
      responses: {
        200: { description: 'Check-in successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        400: { description: 'Already checked in or invalid', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        404: { description: 'Invalid QR code', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
      }
    }
  }
};

function setupSwagger(app) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec, { explorer: true }));
}

module.exports = { setupSwagger, spec };
