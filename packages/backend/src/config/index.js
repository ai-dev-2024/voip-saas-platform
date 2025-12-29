import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

export default {
    // Server
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',

    // Database
    databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/voip_saas',

    // JWT
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

    // Telnyx
    telnyxApiKey: process.env.TELNYX_API_KEY,
    telnyxPublicKey: process.env.TELNYX_PUBLIC_KEY,
    telnyxSipConnectionId: process.env.TELNYX_SIP_CONNECTION_ID,
    telnyxWebhookSecret: process.env.TELNYX_WEBHOOK_SECRET,

    // Stripe
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,

    // URLs
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',

    // Redis
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
};
