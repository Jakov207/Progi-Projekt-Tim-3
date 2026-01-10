const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

// Verify JWT token and attach user to request
const verifyToken = (req, res, next) => {
    try {
        // Get token from cookie or Authorization header
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        logger.error('Token verification failed:', error);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        }
        
        return res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
    }
};

// Role-based access control middleware
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            logger.warn(`Unauthorized access attempt by user ${req.user.id} with role ${req.user.role}`);
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
        }

        next();
    };
};

// Check if user is a student
const isStudent = requireRole('student', 'administrator');

// Check if user is a tutor
const isTutor = requireRole('tutor', 'administrator');

// Check if user is an administrator
const isAdmin = requireRole('administrator');

// Optional authentication (don't fail if no token)
const optionalAuth = (req, res, next) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
        
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        }
    } catch (error) {
        // Silently fail for optional auth
        logger.debug('Optional auth failed:', error.message);
    }
    next();
};

module.exports = {
    verifyToken,
    requireRole,
    isStudent,
    isTutor,
    isAdmin,
    optionalAuth
};
