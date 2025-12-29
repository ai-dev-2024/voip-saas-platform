import Stripe from 'stripe';
import db from '../config/database.js';
import config from '../config/index.js';
import walletService from './wallet.service.js';

const stripe = new Stripe(config.stripeSecretKey);

class BillingService {
    /**
     * Get or create Stripe customer for user
     */
    async getOrCreateStripeCustomer(userId) {
        // Check if customer exists
        let stripeCustomer = await db('stripe_customers')
            .where({ user_id: userId })
            .first();

        if (stripeCustomer) {
            return stripeCustomer.stripe_customer_id;
        }

        // Get user details
        const user = await db('users').where({ id: userId }).first();
        if (!user) {
            const error = new Error('User not found');
            error.status = 404;
            throw error;
        }

        // Create Stripe customer
        const customer = await stripe.customers.create({
            email: user.email,
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || undefined,
            metadata: {
                userId: user.id
            }
        });

        // Save customer ID
        await db('stripe_customers').insert({
            user_id: userId,
            stripe_customer_id: customer.id
        });

        return customer.id;
    }

    /**
     * Create checkout session for wallet top-up
     */
    async createTopupCheckout(userId, { amount }) {
        if (amount < 5) {
            const error = new Error('Minimum top-up amount is $5');
            error.status = 400;
            throw error;
        }

        const customerId = await this.getOrCreateStripeCustomer(userId);

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Wallet Top-up',
                            description: `Add $${amount.toFixed(2)} to your VoIP wallet`
                        },
                        unit_amount: Math.round(amount * 100) // Stripe uses cents
                    },
                    quantity: 1
                }
            ],
            metadata: {
                userId,
                type: 'topup',
                amount: amount.toString()
            },
            success_url: `${config.frontendUrl}/wallet?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${config.frontendUrl}/wallet?canceled=true`
        });

        return {
            sessionId: session.id,
            url: session.url
        };
    }

    /**
     * Handle successful payment webhook
     */
    async handlePaymentSuccess(session) {
        const { userId, type, amount } = session.metadata;

        if (type === 'topup') {
            // Add funds to wallet
            await walletService.addFunds(userId, parseFloat(amount), {
                stripePaymentId: session.payment_intent,
                description: `Stripe payment - $${amount}`
            });
        }
    }

    /**
     * Get payment history from Stripe
     */
    async getPaymentHistory(userId, { limit = 10 }) {
        const customerId = await this.getOrCreateStripeCustomer(userId);

        const paymentIntents = await stripe.paymentIntents.list({
            customer: customerId,
            limit
        });

        return paymentIntents.data.map(pi => ({
            id: pi.id,
            amount: pi.amount / 100,
            currency: pi.currency.toUpperCase(),
            status: pi.status,
            createdAt: new Date(pi.created * 1000)
        }));
    }

    /**
     * Verify Stripe webhook signature
     */
    constructWebhookEvent(payload, signature) {
        return stripe.webhooks.constructEvent(
            payload,
            signature,
            config.stripeWebhookSecret
        );
    }

    /**
     * Create payment method setup intent
     */
    async createSetupIntent(userId) {
        const customerId = await this.getOrCreateStripeCustomer(userId);

        const setupIntent = await stripe.setupIntents.create({
            customer: customerId,
            payment_method_types: ['card']
        });

        return {
            clientSecret: setupIntent.client_secret
        };
    }

    /**
     * List saved payment methods
     */
    async listPaymentMethods(userId) {
        const customerId = await this.getOrCreateStripeCustomer(userId);

        const paymentMethods = await stripe.paymentMethods.list({
            customer: customerId,
            type: 'card'
        });

        return paymentMethods.data.map(pm => ({
            id: pm.id,
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year
        }));
    }
}

export default new BillingService();
