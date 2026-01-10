const rateLimit = require('express-rate-limit');
const redis = require('../config/redis');

// Create a Redis store for rate limiting (custom implementation)
class RedisStore {
    constructor(options = {}) {
        this.prefix = options.prefix || 'rl:';
        this.client = redis;
    }

    async increment(key) {
        const prefixedKey = this.prefix + key;
        const current = await this.client.incr(prefixedKey);
        
        if (current === 1) {
            await this.client.expire(prefixedKey, 900); // 15 minutes
        }
        
        return {
            totalHits: current,
            resetTime: new Date(Date.now() + 900000) // 15 minutes from now
        };
    }

    async decrement(key) {
        const prefixedKey = this.prefix + key;
        await this.client.decr(prefixedKey);
    }

    async resetKey(key) {
        const prefixedKey = this.prefix + key;
        await this.client.del(prefixedKey);
    }
}

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({ prefix: 'rl:api:' })
});

// Login rate limiter (stricter)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 5,
    message: 'Too many login attempts, please try again after 15 minutes.',
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({ prefix: 'rl:login:' })
});

// Registration rate limiter
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many registration attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({ prefix: 'rl:register:' })
});

// Password reset rate limiter
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many password reset requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({ prefix: 'rl:reset:' })
});

module.exports = {
    apiLimiter,
    loginLimiter,
    registerLimiter,
    passwordResetLimiter
};
