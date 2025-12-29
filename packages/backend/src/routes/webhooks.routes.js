import { Router } from 'express';
import billingService from '../services/billing.service.js';
import cdrService from '../services/cdr.service.js';
import db from '../config/database.js';
import { logger } from '../middleware/errorHandler.js';

const router = Router();

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhooks
 */
router.post('/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
        const event = billingService.constructWebhookEvent(req.body, sig);

        logger.info('Stripe webhook received:', { type: event.type });

        switch (event.type) {
            case 'checkout.session.completed':
                await billingService.handlePaymentSuccess(event.data.object);
                break;

            case 'payment_intent.succeeded':
                logger.info('Payment succeeded:', event.data.object.id);
                break;

            case 'payment_intent.payment_failed':
                logger.error('Payment failed:', event.data.object.id);
                break;

            default:
                logger.info('Unhandled Stripe event:', event.type);
        }

        res.json({ received: true });
    } catch (error) {
        logger.error('Stripe webhook error:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/webhooks/telnyx
 * Handle Telnyx call webhooks
 */
router.post('/telnyx', async (req, res) => {
    try {
        const event = req.body.data;
        const eventType = event?.event_type;
        const payload = event?.payload;

        logger.info('Telnyx webhook received:', { type: eventType });

        if (!payload) {
            return res.json({ received: true });
        }

        const callControlId = payload.call_control_id;
        const callLegId = payload.call_leg_id;

        switch (eventType) {
            case 'call.initiated':
                // Find user from the DID number
                const fromNumber = payload.from;
                const toNumber = payload.to;
                const direction = payload.direction;

                let userId = null;
                if (direction === 'incoming') {
                    // Find user by the called number
                    const did = await db('did_numbers')
                        .where({ phone_number: toNumber, status: 'active' })
                        .first();
                    userId = did?.user_id;
                }

                await cdrService.upsertCDR({
                    callId: callControlId,
                    telnyxCallControlId: callControlId,
                    userId,
                    direction: direction === 'incoming' ? 'inbound' : 'outbound',
                    fromNumber,
                    toNumber,
                    status: 'initiated',
                    startTime: new Date(payload.start_time || Date.now())
                });
                break;

            case 'call.ringing':
                await cdrService.upsertCDR({
                    callId: callControlId,
                    status: 'ringing'
                });
                break;

            case 'call.answered':
                await cdrService.upsertCDR({
                    callId: callControlId,
                    status: 'answered',
                    answerTime: new Date()
                });
                break;

            case 'call.hangup':
                await cdrService.completeCall(callControlId, {
                    endTime: new Date(),
                    hangupCause: payload.hangup_cause || 'normal_clearing'
                });
                break;

            case 'call.recording.saved':
                await cdrService.upsertCDR({
                    callId: callControlId,
                    recordingUrl: payload.recording_urls?.mp3
                });
                break;

            default:
                logger.info('Unhandled Telnyx event:', eventType);
        }

        res.json({ received: true });
    } catch (error) {
        logger.error('Telnyx webhook error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/webhooks/telnyx/call
 * Alternative Telnyx call webhook endpoint
 */
router.post('/telnyx/call', async (req, res) => {
    // Forward to main handler
    return router.handle(req, res, () => {
        req.url = '/telnyx';
        router.handle(req, res, () => res.json({ received: true }));
    });
});

export default router;
