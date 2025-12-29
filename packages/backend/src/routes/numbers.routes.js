import { Router } from 'express';
import telnyxService from '../services/telnyx.service.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const searchSchema = {
    query: {
        countryCode: { type: 'string' },
        areaCode: { type: 'string' },
        contains: { type: 'string' },
        type: { type: 'string', enum: ['local', 'toll_free', 'mobile'] },
        limit: { type: 'string' }
    }
};

const purchaseSchema = {
    body: {
        phoneNumber: { type: 'string', required: true }
    }
};

/**
 * GET /api/numbers/search
 * Search available DID numbers
 */
router.get('/search', authenticate, validate(searchSchema), async (req, res, next) => {
    try {
        const { countryCode, areaCode, contains, type, limit } = req.query;
        const numbers = await telnyxService.searchNumbers({
            countryCode: countryCode || 'US',
            areaCode,
            contains,
            type: type || 'local',
            limit: parseInt(limit) || 20
        });
        res.json({ numbers });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/numbers
 * Get user's DID numbers
 */
router.get('/', authenticate, async (req, res, next) => {
    try {
        const numbers = await telnyxService.getUserNumbers(req.user.userId);
        res.json({ numbers });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/numbers/purchase
 * Purchase a DID number
 */
router.post('/purchase', authenticate, validate(purchaseSchema), async (req, res, next) => {
    try {
        const { phoneNumber } = req.body;
        const result = await telnyxService.purchaseNumber(req.user.userId, phoneNumber);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/numbers/:id
 * Release a DID number
 */
router.delete('/:id', authenticate, async (req, res, next) => {
    try {
        const result = await telnyxService.releaseNumber(req.user.userId, req.params.id);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

export default router;
