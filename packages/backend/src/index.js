import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import config from './config/index.js';
import { initRedis } from './config/redis.js';
import { errorHandler, logger } from './middleware/errorHandler.js';
import { rateLimiters } from './middleware/rateLimiter.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import numbersRoutes from './routes/numbers.routes.js';
import callsRoutes from './routes/calls.routes.js';
import ratesRoutes from './routes/rates.routes.js';
import webhooksRoutes from './routes/webhooks.routes.js';

const app = express();

// Initialize Redis (non-blocking)
initRedis().catch(err => {
    logger.warn('Redis initialization failed, continuing without cache:', err.message);
});

// Security middleware
app.use(helmet({
    contentSecurityPolicy: config.nodeEnv === 'production' ? undefined : false
}));

app.use(cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Cookie parser for refresh tokens
app.use(cookieParser());

// Trust proxy for accurate IP addresses behind load balancer
app.set('trust proxy', 1);

// Body parsing - raw for webhooks (Stripe needs raw body)
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Request logging
app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
            ip: req.ip,
            userAgent: req.get('User-Agent')?.substring(0, 100),
            userId: req.user?.userId
        });
    });

    next();
});

// Health check (no rate limiting)
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

// Apply standard rate limiting to all API routes
app.use('/api/', rateLimiters.api);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/numbers', numbersRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/rates', ratesRoutes);
app.use('/api/webhooks', rateLimiters.webhook, webhooksRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path
    });
});

// Error handler
app.use(errorHandler);

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    // Close server
    server.close(async () => {
        logger.info('HTTP server closed');

        // Close database connections, Redis, etc.
        try {
            const { getRedis } = await import('./config/redis.js');
            const redis = getRedis();
            if (redis) await redis.quit();

            const db = (await import('./config/database.js')).default;
            await db.destroy();

            logger.info('All connections closed');
            process.exit(0);
        } catch (err) {
            logger.error('Error during shutdown:', err);
            process.exit(1);
        }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
};

// Start server
const PORT = config.port;

const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Frontend URL: ${config.frontendUrl}`);
});

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

export default app;
