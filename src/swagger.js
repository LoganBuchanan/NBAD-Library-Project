const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.4',
    info: {
      title: 'Library Management System API',
      version: '1.0.0',
      description: 'A comprehensive library management system with user authentication, book management, and loan tracking.',
      contact: {
        name: 'Library API Support',
        email: 'support@libraryapi.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'https://nbad-library-project.onrender.com',
        description: 'Production server'
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    security: [
      {
        bearerAuth: []
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example: 'Access token required'
                  }
                }
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example: 'Librarian role required'
                  }
                }
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example: 'Record not found'
                  }
                }
              }
            }
          }
        },
        ValidationError: {
          description: 'Invalid input data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example: 'Name, email, and password are required'
                  }
                }
              }
            }
          }
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'cm3o4k8a40000134omlxbqdyi'
            },
            name: {
              type: 'string',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com'
            },
            role: {
              type: 'string',
              enum: ['CUSTOMER', 'LIBRARIAN'],
              example: 'CUSTOMER'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-11-24T12:00:00Z'
            }
          }
        },
        Author: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'cm3o4k8a40001134omlxbqdyi'
            },
            name: {
              type: 'string',
              example: 'J.K. Rowling'
            },
            bio: {
              type: 'string',
              nullable: true,
              example: 'British author best known for the Harry Potter series'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-11-24T12:00:00Z'
            }
          }
        },
        Book: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'cm3o4k8a40002134omlxbqdyi'
            },
            title: {
              type: 'string',
              example: 'The Hobbit'
            },
            isbn: {
              type: 'string',
              example: '9780547928227'
            },
            published_year: {
              type: 'integer',
              example: 1937
            },
            available_copies: {
              type: 'integer',
              example: 5
            },
            authors: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Author'
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-11-24T12:00:00Z'
            }
          }
        },
        Loan: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'cm3o4k8a40003134omlxbqdyi'
            },
            user_id: {
              type: 'string',
              example: 'cm3o4k8a40000134omlxbqdyi'
            },
            book_id: {
              type: 'string',
              example: 'cm3o4k8a40002134omlxbqdyi'
            },
            borrowed_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-11-24T12:00:00Z'
            },
            due_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-12-08T12:00:00Z'
            },
            returned_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: null
            },
            user: {
              $ref: '#/components/schemas/User'
            },
            book: {
              $ref: '#/components/schemas/Book'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'librarian@library.com'
            },
            password: {
              type: 'string',
              example: 'password123'
            }
          }
        },
        SignupRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: {
              type: 'string',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com'
            },
            password: {
              type: 'string',
              minLength: 6,
              example: 'password123'
            },
            role: {
              type: 'string',
              enum: ['CUSTOMER', 'LIBRARIAN'],
              example: 'CUSTOMER'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Login successful'
            },
            user: {
              $ref: '#/components/schemas/User'
            },
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            }
          }
        },
        CreateAuthorRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              example: 'J.R.R. Tolkien'
            },
            bio: {
              type: 'string',
              example: 'British author and philologist'
            }
          }
        },
        CreateBookRequest: {
          type: 'object',
          required: ['title', 'isbn', 'published_year', 'available_copies', 'authorIds'],
          properties: {
            title: {
              type: 'string',
              example: 'The Hobbit'
            },
            isbn: {
              type: 'string',
              example: '9780547928227'
            },
            published_year: {
              type: 'integer',
              example: 1937
            },
            available_copies: {
              type: 'integer',
              example: 5
            },
            authorIds: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['cm3o4k8a40001134omlxbqdyi']
            }
          }
        },
        CreateLoanRequest: {
          type: 'object',
          required: ['book_id'],
          properties: {
            book_id: {
              type: 'string',
              example: 'cm3o4k8a40002134omlxbqdyi'
            },
            user_id: {
              type: 'string',
              description: 'Optional - librarians can specify any user',
              example: 'cm3o4k8a40000134omlxbqdyi'
            },
            due_days: {
              type: 'integer',
              default: 14,
              example: 14
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};