import winston from 'winston';
import config from '../config/index.js';

const logger = winston.createLogger({
    level: config.nodeEnv === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

export const errorHandler = (err, req, res, next) => {
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            message: err.message,
            details: err.details
        });
    }

    // Stripe errors
    if (err.type && err.type.startsWith('Stripe')) {
        return res.status(400).json({
            error: 'Payment Error',
            message: err.message
        });
    }

    // Telnyx errors
    if (err.response?.status) {
        return res.status(err.response.status).json({
            error: 'Telephony Error',
            message: err.message
        });
    }

    // Default server error
    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: config.nodeEnv === 'production'
            ? 'An unexpected error occurred'
            : err.message
    });
};

export { logger };
