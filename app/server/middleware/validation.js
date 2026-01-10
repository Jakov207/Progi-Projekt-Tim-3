const { z } = require('zod');
const logger = require('../config/logger');

// Validation middleware factory
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params
            });
            next();
        } catch (error) {
            logger.warn('Validation error:', error.errors);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            });
        }
    };
};

// Common validation schemas
const schemas = {
    // User registration
    register: z.object({
        body: z.object({
            email: z.string().email('Invalid email format'),
            password: z.string()
                .min(8, 'Password must be at least 8 characters')
                .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
                .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
                .regex(/[0-9]/, 'Password must contain at least one number')
                .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
            name: z.string().min(1, 'Name is required').max(100),
            surname: z.string().min(1, 'Surname is required').max(100),
            role: z.enum(['student', 'tutor']).optional()
        })
    }),

    // User login
    login: z.object({
        body: z.object({
            email: z.string().email('Invalid email format'),
            password: z.string().min(1, 'Password is required'),
            rememberMe: z.boolean().optional()
        })
    }),

    // Password reset request
    forgotPassword: z.object({
        body: z.object({
            email: z.string().email('Invalid email format')
        })
    }),

    // Password reset
    resetPassword: z.object({
        body: z.object({
            token: z.string().min(1, 'Token is required'),
            password: z.string()
                .min(8, 'Password must be at least 8 characters')
                .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
                .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
                .regex(/[0-9]/, 'Password must contain at least one number')
                .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
        })
    }),

    // Profile update
    updateProfile: z.object({
        body: z.object({
            name: z.string().min(1).max(100).optional(),
            surname: z.string().min(1).max(100).optional(),
            biography: z.string().max(5000).optional(),
            location: z.string().max(255).optional(),
            phone: z.string().max(20).optional()
        })
    }),

    // Booking creation
    createBooking: z.object({
        body: z.object({
            tutorId: z.number().int().positive(),
            subjectId: z.number().int().positive(),
            bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
            startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
            endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
            format: z.enum(['online', 'in_person']),
            notes: z.string().max(1000).optional()
        })
    }),

    // Review creation
    createReview: z.object({
        body: z.object({
            bookingId: z.number().int().positive(),
            overallRating: z.number().int().min(1).max(5),
            communicationRating: z.number().int().min(1).max(5).optional(),
            expertiseRating: z.number().int().min(1).max(5).optional(),
            preparationRating: z.number().int().min(1).max(5).optional(),
            valueRating: z.number().int().min(1).max(5).optional(),
            comment: z.string().max(2000).optional()
        })
    }),

    // Quiz creation
    createQuiz: z.object({
        body: z.object({
            title: z.string().min(1).max(255),
            description: z.string().max(5000).optional(),
            subjectId: z.number().int().positive(),
            timeLimitMinutes: z.number().int().positive().optional(),
            passingScore: z.number().int().min(0).max(100).optional(),
            questionIds: z.array(z.number().int().positive()).min(1)
        })
    }),

    // Pagination
    pagination: z.object({
        query: z.object({
            page: z.string().regex(/^\d+$/).transform(Number).optional(),
            limit: z.string().regex(/^\d+$/).transform(Number).optional(),
            sort: z.string().optional(),
            order: z.enum(['asc', 'desc']).optional()
        })
    })
};

module.exports = {
    validate,
    schemas
};
