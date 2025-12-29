import { Router } from 'express';
import walletService from '../services/wallet.service.js';
import billingService from '../services/billing.service.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const topupSchema = {
    body: {
        amount: { type: 'number', required: true, min: 5 }
    }
};

/**
 * GET /api/wallet
 * Get wallet balance and info
 */
router.get('/', authenticate, async (req, res, next) => {
    try {
        const wallet = await walletService.getWallet(req.user.userId);
        res.json(wallet);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/wallet/topup
 * Create Stripe checkout session for topping up wallet
 */
router.post('/topup', authenticate, validate(topupSchema), async (req, res, next) => {
    try {
        const { amount } = req.body;
        const checkout = await billingService.createTopupCheckout(req.user.userId, { amount });
        res.json(checkout);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/wallet/transactions
 * Get transaction history
 */
router.get('/transactions', authenticate, async (req, res, next) => {
    try {
        const { page = 1, limit = 20, type } = req.query;
        const result = await walletService.getTransactions(req.user.userId, {
            page: parseInt(page),
            limit: parseInt(limit),
            type
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/wallet/payment-methods
 * List saved payment methods
 */
router.get('/payment-methods', authenticate, async (req, res, next) => {
    try {
        const methods = await billingService.listPaymentMethods(req.user.userId);
        res.json({ paymentMethods: methods });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/wallet/setup-payment
 * Create setup intent for saving payment method
 */
router.post('/setup-payment', authenticate, async (req, res, next) => {
    try {
        const result = await billingService.createSetupIntent(req.user.userId);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

export default router;
