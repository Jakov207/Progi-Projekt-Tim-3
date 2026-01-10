const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'STEM Tutor Platform API',
            version: '1.0.0',
            description: 'API documentation for the STEM Tutor Platform - connecting students with private tutors in mathematics, physics, and computer science.',
            contact: {
                name: 'STEM Tutor Support',
                email: 'support@fertutor.xyz',
                url: 'https://fertutor.xyz'
            },
            license: {
                name: 'Creative Commons Attribution-NonCommercial-ShareAlike 4.0',
                url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/'
            }
        },
        servers: [
            {
                url: process.env.BACKEND_URL || 'http://localhost:8080',
                description: 'Development server'
            },
            {
                url: 'https://fertutor.xyz',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token'
                },
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'token',
                    description: 'JWT token in cookie'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        email: { type: 'string', format: 'email' },
                        name: { type: 'string' },
                        surname: { type: 'string' },
                        role: { type: 'string', enum: ['student', 'tutor', 'administrator'] },
                        emailVerified: { type: 'boolean' },
                        profilePicture: { type: 'string', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                TutorProfile: {
                    type: 'object',
                    properties: {
                        userId: { type: 'integer' },
                        biography: { type: 'string' },
                        hourlyRate30min: { type: 'number', format: 'float' },
                        hourlyRate60min: { type: 'number', format: 'float' },
                        location: { type: 'string' },
                        averageRating: { type: 'number', format: 'float' },
                        totalSessions: { type: 'integer' },
                        verificationStatus: { type: 'string', enum: ['pending', 'verified', 'rejected'] }
                    }
                },
                Booking: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        studentId: { type: 'integer' },
                        tutorId: { type: 'integer' },
                        subjectId: { type: 'integer' },
                        bookingDate: { type: 'string', format: 'date' },
                        startTime: { type: 'string', format: 'time' },
                        endTime: { type: 'string', format: 'time' },
                        format: { type: 'string', enum: ['online', 'in_person'] },
                        status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'completed'] },
                        price: { type: 'number', format: 'float' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string' },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: { type: 'string' },
                                    message: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                UnauthorizedError: {
                    description: 'Authentication required',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' }
                        }
                    }
                },
                ForbiddenError: {
                    description: 'Insufficient permissions',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' }
                        }
                    }
                },
                ValidationError: {
                    description: 'Validation error',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' }
                        }
                    }
                },
                NotFoundError: {
                    description: 'Resource not found',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' }
                        }
                    }
                }
            }
        },
        tags: [
            { name: 'Authentication', description: 'User authentication and authorization' },
            { name: 'Users', description: 'User management' },
            { name: 'Tutors', description: 'Tutor profiles and management' },
            { name: 'Bookings', description: 'Session booking and scheduling' },
            { name: 'Payments', description: 'Payment processing' },
            { name: 'Reviews', description: 'Reviews and ratings' },
            { name: 'Quizzes', description: 'Quiz and question bank management' },
            { name: 'Notifications', description: 'Notification management' },
            { name: 'Admin', description: 'Administrative functions' }
        ]
    },
    apis: ['./routes/*.js', './server.js'], // Path to API routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
