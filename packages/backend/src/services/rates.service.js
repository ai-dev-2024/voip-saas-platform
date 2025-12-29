import db from '../config/database.js';
import { cache } from '../config/redis.js';

class RatesService {
    /**
     * Get calling rate for a destination
     */
    async getRate(countryCode, numberType = 'landline') {
        // Try cache first
        const cacheKey = `rate:${countryCode}:${numberType}`;
        const cached = await cache.get(cacheKey);
        if (cached) return cached;

        // Query database
        const rate = await db('calling_rates')
            .where({
                country_code: countryCode.toUpperCase(),
                number_type: numberType,
                active: true
            })
            .first();

        if (!rate) {
            // Return default rate if not found
            return {
                countryCode: countryCode.toUpperCase(),
                numberType,
                ratePerMinute: 0.05, // Default 5 cents
                connectionFee: 0,
                billingIncrement: 60
            };
        }

        const result = {
            countryCode: rate.country_code,
            countryName: rate.country_name,
            numberType: rate.number_type,
            ratePerMinute: parseFloat(rate.rate_per_minute),
            connectionFee: parseFloat(rate.connection_fee),
            billingIncrement: rate.billing_increment
        };

        // Cache for 1 hour
        await cache.set(cacheKey, result, 3600);

        return result;
    }

    /**
     * Get all rates for a country
     */
    async getRatesByCountry(countryCode) {
        const rates = await db('calling_rates')
            .where({
                country_code: countryCode.toUpperCase(),
                active: true
            });

        return rates.map(rate => ({
            countryCode: rate.country_code,
            countryName: rate.country_name,
            numberType: rate.number_type,
            ratePerMinute: parseFloat(rate.rate_per_minute),
            connectionFee: parseFloat(rate.connection_fee),
            billingIncrement: rate.billing_increment
        }));
    }

    /**
     * Search rates by country name
     */
    async searchRates(query, { page = 1, limit = 50 }) {
        let dbQuery = db('calling_rates')
            .where('active', true)
            .orderBy('country_name', 'asc');

        if (query) {
            dbQuery = dbQuery.where(function () {
                this.whereILike('country_name', `%${query}%`)
                    .orWhereILike('country_code', `%${query}%`);
            });
        }

        const [{ count }] = await dbQuery.clone().count();

        const rates = await dbQuery
            .select('*')
            .limit(limit)
            .offset((page - 1) * limit);

        return {
            rates: rates.map(rate => ({
                countryCode: rate.country_code,
                countryName: rate.country_name,
                numberType: rate.number_type,
                ratePerMinute: parseFloat(rate.rate_per_minute),
                connectionFee: parseFloat(rate.connection_fee)
            })),
            pagination: {
                page,
                limit,
                total: parseInt(count),
                totalPages: Math.ceil(parseInt(count) / limit)
            }
        };
    }

    /**
     * Calculate call cost estimate
     */
    async estimateCallCost(countryCode, durationMinutes, numberType = 'landline') {
        const rate = await this.getRate(countryCode, numberType);

        const totalCost = rate.connectionFee + (rate.ratePerMinute * durationMinutes);

        return {
            rate,
            estimatedDuration: durationMinutes,
            connectionFee: rate.connectionFee,
            perMinuteCost: rate.ratePerMinute * durationMinutes,
            totalCost: Math.round(totalCost * 100) / 100
        };
    }

    /**
     * Seed initial calling rates (for setup)
     */
    async seedDefaultRates() {
        const defaultRates = [
            { country_code: 'US', country_name: 'United States', number_type: 'landline', rate_per_minute: 0.01 },
            { country_code: 'US', country_name: 'United States', number_type: 'mobile', rate_per_minute: 0.02 },
            { country_code: 'CA', country_name: 'Canada', number_type: 'landline', rate_per_minute: 0.01 },
            { country_code: 'CA', country_name: 'Canada', number_type: 'mobile', rate_per_minute: 0.02 },
            { country_code: 'GB', country_name: 'United Kingdom', number_type: 'landline', rate_per_minute: 0.02 },
            { country_code: 'GB', country_name: 'United Kingdom', number_type: 'mobile', rate_per_minute: 0.05 },
            { country_code: 'DE', country_name: 'Germany', number_type: 'landline', rate_per_minute: 0.02 },
            { country_code: 'DE', country_name: 'Germany', number_type: 'mobile', rate_per_minute: 0.06 },
            { country_code: 'FR', country_name: 'France', number_type: 'landline', rate_per_minute: 0.02 },
            { country_code: 'FR', country_name: 'France', number_type: 'mobile', rate_per_minute: 0.05 },
            { country_code: 'IN', country_name: 'India', number_type: 'landline', rate_per_minute: 0.02 },
            { country_code: 'IN', country_name: 'India', number_type: 'mobile', rate_per_minute: 0.03 },
            { country_code: 'AU', country_name: 'Australia', number_type: 'landline', rate_per_minute: 0.02 },
            { country_code: 'AU', country_name: 'Australia', number_type: 'mobile', rate_per_minute: 0.08 },
            { country_code: 'JP', country_name: 'Japan', number_type: 'landline', rate_per_minute: 0.03 },
            { country_code: 'JP', country_name: 'Japan', number_type: 'mobile', rate_per_minute: 0.10 },
            { country_code: 'CN', country_name: 'China', number_type: 'landline', rate_per_minute: 0.02 },
            { country_code: 'CN', country_name: 'China', number_type: 'mobile', rate_per_minute: 0.03 },
            { country_code: 'BR', country_name: 'Brazil', number_type: 'landline', rate_per_minute: 0.03 },
            { country_code: 'BR', country_name: 'Brazil', number_type: 'mobile', rate_per_minute: 0.12 },
        ];

        for (const rate of defaultRates) {
            await db('calling_rates')
                .insert({
                    ...rate,
                    connection_fee: 0,
                    billing_increment: 60,
                    active: true
                })
                .onConflict(['country_code', 'number_type'])
                .ignore();
        }
    }
}

export default new RatesService();
