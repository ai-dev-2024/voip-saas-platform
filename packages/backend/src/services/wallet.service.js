import db from '../config/database.js';

class WalletService {
    /**
     * Get wallet by user ID
     */
    async getWallet(userId) {
        const wallet = await db('wallets')
            .where({ user_id: userId })
            .first();

        if (!wallet) {
            const error = new Error('Wallet not found');
            error.status = 404;
            throw error;
        }

        return {
            id: wallet.id,
            balance: parseFloat(wallet.balance),
            currency: wallet.currency,
            createdAt: wallet.created_at
        };
    }

    /**
     * Add funds to wallet
     */
    async addFunds(userId, amount, { stripePaymentId, description }) {
        const wallet = await db('wallets').where({ user_id: userId }).first();

        if (!wallet) {
            const error = new Error('Wallet not found');
            error.status = 404;
            throw error;
        }

        const result = await db.transaction(async (trx) => {
            // Update wallet balance
            const newBalance = parseFloat(wallet.balance) + amount;
            await trx('wallets')
                .where({ id: wallet.id })
                .update({
                    balance: newBalance,
                    updated_at: db.fn.now()
                });

            // Create transaction record
            const [transaction] = await trx('transactions')
                .insert({
                    wallet_id: wallet.id,
                    type: 'credit',
                    amount: amount,
                    description: description || 'Wallet top-up',
                    stripe_payment_id: stripePaymentId,
                    reference_type: 'topup'
                })
                .returning('*');

            return {
                newBalance,
                transaction
            };
        });

        return {
            balance: result.newBalance,
            transaction: {
                id: result.transaction.id,
                type: result.transaction.type,
                amount: parseFloat(result.transaction.amount),
                description: result.transaction.description,
                createdAt: result.transaction.created_at
            }
        };
    }

    /**
     * Deduct funds from wallet
     */
    async deductFunds(userId, amount, { description, referenceType, referenceId }) {
        const wallet = await db('wallets').where({ user_id: userId }).first();

        if (!wallet) {
            const error = new Error('Wallet not found');
            error.status = 404;
            throw error;
        }

        const currentBalance = parseFloat(wallet.balance);
        if (currentBalance < amount) {
            const error = new Error('Insufficient funds');
            error.status = 400;
            throw error;
        }

        const result = await db.transaction(async (trx) => {
            // Update wallet balance
            const newBalance = currentBalance - amount;
            await trx('wallets')
                .where({ id: wallet.id })
                .update({
                    balance: newBalance,
                    updated_at: db.fn.now()
                });

            // Create transaction record
            const [transaction] = await trx('transactions')
                .insert({
                    wallet_id: wallet.id,
                    type: 'debit',
                    amount: amount,
                    description,
                    reference_type: referenceType,
                    reference_id: referenceId
                })
                .returning('*');

            return {
                newBalance,
                transaction
            };
        });

        return {
            balance: result.newBalance,
            transaction: {
                id: result.transaction.id,
                type: result.transaction.type,
                amount: parseFloat(result.transaction.amount),
                description: result.transaction.description,
                createdAt: result.transaction.created_at
            }
        };
    }

    /**
     * Check if user has sufficient balance
     */
    async hasSufficientBalance(userId, amount) {
        const wallet = await db('wallets').where({ user_id: userId }).first();
        if (!wallet) return false;
        return parseFloat(wallet.balance) >= amount;
    }

    /**
     * Get transaction history
     */
    async getTransactions(userId, { page = 1, limit = 20, type }) {
        const wallet = await db('wallets').where({ user_id: userId }).first();

        if (!wallet) {
            const error = new Error('Wallet not found');
            error.status = 404;
            throw error;
        }

        let query = db('transactions')
            .where({ wallet_id: wallet.id })
            .orderBy('created_at', 'desc');

        if (type) {
            query = query.where({ type });
        }

        // Get total count
        const [{ count }] = await query.clone().count();

        // Get paginated results
        const transactions = await query
            .select('*')
            .limit(limit)
            .offset((page - 1) * limit);

        return {
            transactions: transactions.map(t => ({
                id: t.id,
                type: t.type,
                amount: parseFloat(t.amount),
                description: t.description,
                referenceType: t.reference_type,
                referenceId: t.reference_id,
                createdAt: t.created_at
            })),
            pagination: {
                page,
                limit,
                total: parseInt(count),
                totalPages: Math.ceil(parseInt(count) / limit)
            }
        };
    }
}

export default new WalletService();
