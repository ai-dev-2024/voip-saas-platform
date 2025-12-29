import { cache } from '../config/redis.js';
import config from '../config/index.js';

/**
 * Redis-based rate limiter with sliding window
 */
export function createRateLimiter(options = {}) {
    const {
        windowMs = 15 * 60 * 1000,  // 15 minutes
        max = 100,                    // Max requests per window
        keyPrefix = 'rl:',
        message = 'Too many requests, please try again later',
        skipSuccessfulRequests = false,
        keyGenerator = (req) => req.ip,
        skip = () => false,
        handler = null
    } = options;

    const windowSeconds = Math.ceil(windowMs / 1000);

    return async (req, res, next) => {
        // Skip if configured to skip this request
        if (skip(req)) {
            return next();
        }

        const key = `${keyPrefix}${keyGenerator(req)}`;

        // Try Redis-based rate limiting
        const count = await cache.incr(key, windowSeconds);

        // Set rate limit headers
        res.set({
            'X-RateLimit-Limit': max,
            'X-RateLimit-Remaining': Math.max(0, max - count),
            'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString()
        });

        if (count > max) {
            res.set('Retry-After', windowSeconds);

            if (handler) {
                return handler(req, res, next);
            }

            return res.status(429).json({
                error: message,
                retryAfter: windowSeconds
            });
        }

        next();
    };
}

/**
 * Pre-configured rate limiters for different endpoints
 */
export const rateLimiters = {
    // Strict limiter for auth endpoints (prevent brute force)
    auth: createRateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10,                   // 10 attempts
        keyPrefix: 'rl:auth:',
        message: 'Too many login attempts. Please try again in 15 minutes.'
    }),

    // Standard API limiter
    api: createRateLimiter({
        windowMs: 15 * 60 * 1000,
        max: 100,
        keyPrefix: 'rl:api:'
    }),

    // Limiter for expensive operations (search, file uploads)
    expensive: createRateLimiter({
        windowMs: 60 * 1000,       // 1 minute
        max: 10,
        keyPrefix: 'rl:expensive:',
        message: 'Rate limit exceeded for this operation'
    }),

    // Webhook limiter (more permissive for Stripe/Telnyx)
    webhook: createRateLimiter({
        windowMs: 60 * 1000,
        max: 500,
        keyPrefix: 'rl:webhook:'
    }),

    // DID purchase limiter (prevent abuse)
    didPurchase: createRateLimiter({
        windowMs: 60 * 60 * 1000,  // 1 hour
        max: 5,                     // 5 purchases per hour
        keyPrefix: 'rl:did:',
        message: 'Purchase limit reached. Please try again later.'
    })
};

export default rateLimiters;
