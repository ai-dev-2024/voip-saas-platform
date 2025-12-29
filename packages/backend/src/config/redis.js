import { createClient } from 'redis';
import config from './index.js';
import { logger } from '../middleware/errorHandler.js';

let redisClient = null;

/**
 * Initialize Redis client with connection handling
 */
export async function initRedis() {
    if (redisClient) {
        return redisClient;
    }

    redisClient = createClient({
        url: config.redisUrl,
        socket: {
            reconnectStrategy: (retries) => {
                if (retries > 10) {
                    logger.error('Redis: Max reconnection attempts reached');
                    return new Error('Max reconnection attempts reached');
                }
                return Math.min(retries * 100, 3000);
            }
        }
    });

    redisClient.on('error', (err) => {
        logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
        logger.info('Redis: Connected');
    });

    redisClient.on('reconnecting', () => {
        logger.info('Redis: Reconnecting...');
    });

    try {
        await redisClient.connect();
    } catch (err) {
        logger.error('Redis: Failed to connect', err);
        // Don't throw - allow app to work without Redis in development
        if (config.nodeEnv === 'production') {
            throw err;
        }
    }

    return redisClient;
}

/**
 * Get Redis client instance
 */
export function getRedis() {
    return redisClient;
}

/**
 * Cache wrapper with automatic JSON serialization
 */
export const cache = {
    /**
     * Get cached value
     */
    async get(key) {
        if (!redisClient?.isReady) return null;

        try {
            const value = await redisClient.get(key);
            return value ? JSON.parse(value) : null;
        } catch (err) {
            logger.error('Redis get error:', err);
            return null;
        }
    },

    /**
     * Set cache value with optional TTL (in seconds)
     */
    async set(key, value, ttlSeconds = 3600) {
        if (!redisClient?.isReady) return false;

        try {
            await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
            return true;
        } catch (err) {
            logger.error('Redis set error:', err);
            return false;
        }
    },

    /**
     * Delete cached value
     */
    async del(key) {
        if (!redisClient?.isReady) return false;

        try {
            await redisClient.del(key);
            return true;
        } catch (err) {
            logger.error('Redis del error:', err);
            return false;
        }
    },

    /**
     * Delete all keys matching pattern
     */
    async delPattern(pattern) {
        if (!redisClient?.isReady) return false;

        try {
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
            return true;
        } catch (err) {
            logger.error('Redis delPattern error:', err);
            return false;
        }
    },

    /**
     * Check if key exists
     */
    async exists(key) {
        if (!redisClient?.isReady) return false;

        try {
            return await redisClient.exists(key);
        } catch (err) {
            logger.error('Redis exists error:', err);
            return false;
        }
    },

    /**
     * Increment counter
     */
    async incr(key, ttlSeconds = 3600) {
        if (!redisClient?.isReady) return 0;

        try {
            const value = await redisClient.incr(key);
            if (value === 1) {
                await redisClient.expire(key, ttlSeconds);
            }
            return value;
        } catch (err) {
            logger.error('Redis incr error:', err);
            return 0;
        }
    }
};

export default redisClient;
