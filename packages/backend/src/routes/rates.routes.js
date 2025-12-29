import { Router } from 'express';
import ratesService from '../services/rates.service.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/rates
 * Search calling rates
 */
router.get('/', optionalAuth, async (req, res, next) => {
    try {
        const { q, page = 1, limit = 50 } = req.query;
        const result = await ratesService.searchRates(q, {
            page: parseInt(page),
            limit: parseInt(limit)
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/rates/:countryCode
 * Get rates for a specific country
 */
router.get('/:countryCode', optionalAuth, async (req, res, next) => {
    try {
        const rates = await ratesService.getRatesByCountry(req.params.countryCode);
        res.json({ rates });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/rates/estimate
 * Estimate call cost
 */
router.post('/estimate', optionalAuth, async (req, res, next) => {
    try {
        const { countryCode, duration = 1, numberType = 'landline' } = req.body;

        if (!countryCode) {
            return res.status(400).json({ error: 'Country code is required' });
        }

        const estimate = await ratesService.estimateCallCost(
            countryCode,
            parseFloat(duration),
            numberType
        );
        res.json(estimate);
    } catch (error) {
        next(error);
    }
});

export default router;
