import { Router } from 'express';
import telnyxService from '../services/telnyx.service.js';
import cdrService from '../services/cdr.service.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const callSchema = {
    body: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true }
    }
};

/**
 * GET /api/calls/token
 * Get WebRTC token for softphone
 */
router.get('/token', authenticate, async (req, res, next) => {
    try {
        const token = await telnyxService.generateWebRTCToken(req.user.userId);
        res.json(token);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/calls
 * Initiate an outbound call
 */
router.post('/', authenticate, validate(callSchema), async (req, res, next) => {
    try {
        const { from, to } = req.body;
        const call = await telnyxService.initiateCall(req.user.userId, { from, to });

        // Log call initiation
        await cdrService.upsertCDR({
            callId: call.callId,
            telnyxCallControlId: call.callId,
            userId: req.user.userId,
            direction: 'outbound',
            fromNumber: from,
            toNumber: to,
            status: 'initiated',
            startTime: new Date()
        });

        res.status(201).json(call);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/calls/history
 * Get call history (CDR)
 */
router.get('/history', authenticate, async (req, res, next) => {
    try {
        const { page, limit, direction, status, startDate, endDate } = req.query;
        const result = await cdrService.getUserCDR(req.user.userId, {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            direction,
            status,
            startDate,
            endDate
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/calls/stats
 * Get call statistics
 */
router.get('/stats', authenticate, async (req, res, next) => {
    try {
        const { period } = req.query;
        const stats = await cdrService.getCallStats(req.user.userId, { period });
        res.json(stats);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/calls/:id
 * Get call detail by ID
 */
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const cdr = await cdrService.getCDRByCallId(req.params.id);
        if (!cdr) {
            return res.status(404).json({ error: 'Call not found' });
        }
        res.json(cdr);
    } catch (error) {
        next(error);
    }
});

export default router;
