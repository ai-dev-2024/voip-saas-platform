import Telnyx from 'telnyx';
import db from '../config/database.js';
import config from '../config/index.js';
import walletService from './wallet.service.js';

const telnyx = Telnyx(config.telnyxApiKey);

class TelnyxService {
    /**
     * Search available DID numbers
     */
    async searchNumbers({ countryCode = 'US', areaCode, contains, type = 'local', limit = 20 }) {
        try {
            const searchParams = {
                filter: {
                    country_code: countryCode,
                    phone_number_type: type,
                    limit
                }
            };

            if (areaCode) {
                searchParams.filter.national_destination_code = areaCode;
            }

            if (contains) {
                searchParams.filter.phone_number = { contains };
            }

            const response = await telnyx.availablePhoneNumbers.list(searchParams);

            return response.data.map(num => ({
                phoneNumber: num.phone_number,
                region: num.region_information?.[0]?.region_name,
                type: num.phone_number_type,
                monthlyRate: parseFloat(num.cost_information?.monthly_cost || '1.00'),
                setupRate: parseFloat(num.cost_information?.upfront_cost || '0.00'),
                features: num.features || []
            }));
        } catch (error) {
            console.error('Telnyx search error:', error);
            throw new Error('Failed to search phone numbers');
        }
    }

    /**
     * Purchase a DID number
     */
    async purchaseNumber(userId, phoneNumber) {
        // Check if number is already owned
        const existing = await db('did_numbers')
            .where({ phone_number: phoneNumber, status: 'active' })
            .first();

        if (existing) {
            const error = new Error('This number is already in use');
            error.status = 400;
            throw error;
        }

        try {
            // Order the number from Telnyx
            const orderResponse = await telnyx.numberOrders.create({
                phone_numbers: [{ phone_number: phoneNumber }],
                connection_id: config.telnyxSipConnectionId
            });

            const order = orderResponse.data;
            const purchasedNumber = order.phone_numbers[0];

            // Get monthly cost (default to $1 if not available)
            const monthlyCost = 1.00; // Telnyx typical cost
            const setupCost = 0.00;

            // Check wallet balance
            const hasFunds = await walletService.hasSufficientBalance(userId, setupCost + monthlyCost);
            if (!hasFunds && setupCost + monthlyCost > 0) {
                const error = new Error('Insufficient wallet balance');
                error.status = 400;
                throw error;
            }

            // Save to database
            const [didNumber] = await db('did_numbers')
                .insert({
                    user_id: userId,
                    phone_number: purchasedNumber.phone_number,
                    telnyx_number_id: purchasedNumber.id || order.id,
                    country_code: purchasedNumber.phone_number?.substring(0, 2) === '+1' ? 'US' : 'XX',
                    type: 'local',
                    monthly_cost: monthlyCost,
                    setup_cost: setupCost,
                    status: 'active'
                })
                .returning('*');

            // Deduct from wallet if there's a cost
            if (setupCost > 0) {
                await walletService.deductFunds(userId, setupCost, {
                    description: `DID purchase: ${phoneNumber}`,
                    referenceType: 'did_purchase',
                    referenceId: didNumber.id
                });
            }

            return {
                id: didNumber.id,
                phoneNumber: didNumber.phone_number,
                monthlyCost: parseFloat(didNumber.monthly_cost),
                status: didNumber.status,
                purchasedAt: didNumber.purchased_at
            };
        } catch (error) {
            console.error('Telnyx purchase error:', error);
            if (error.status) throw error;
            throw new Error('Failed to purchase phone number');
        }
    }

    /**
     * Get user's DID numbers
     */
    async getUserNumbers(userId) {
        const numbers = await db('did_numbers')
            .where({ user_id: userId, status: 'active' })
            .orderBy('purchased_at', 'desc');

        return numbers.map(num => ({
            id: num.id,
            phoneNumber: num.phone_number,
            countryCode: num.country_code,
            region: num.region,
            type: num.type,
            monthlyCost: parseFloat(num.monthly_cost),
            status: num.status,
            purchasedAt: num.purchased_at
        }));
    }

    /**
     * Release a DID number
     */
    async releaseNumber(userId, numberId) {
        const number = await db('did_numbers')
            .where({ id: numberId, user_id: userId })
            .first();

        if (!number) {
            const error = new Error('Number not found');
            error.status = 404;
            throw error;
        }

        try {
            // Release from Telnyx
            await telnyx.phoneNumbers.del(number.telnyx_number_id);
        } catch (error) {
            console.error('Telnyx release error:', error);
            // Continue with database update even if Telnyx fails
        }

        // Update database
        await db('did_numbers')
            .where({ id: numberId })
            .update({
                status: 'released',
                user_id: null
            });

        return { message: 'Number released successfully' };
    }

    /**
     * Generate WebRTC token for user
     */
    async generateWebRTCToken(userId) {
        try {
            // Check if user has credentials
            let credentials = await db('webrtc_credentials')
                .where({ user_id: userId, active: true })
                .first();

            if (!credentials) {
                // Create new Telnyx credential
                const credResponse = await telnyx.telephonyCredentials.create({
                    connection_id: config.telnyxSipConnectionId,
                    name: `user-${userId}`,
                    tag: userId
                });

                const [newCred] = await db('webrtc_credentials')
                    .insert({
                        user_id: userId,
                        telnyx_credential_id: credResponse.data.id,
                        sip_username: credResponse.data.sip_username
                    })
                    .returning('*');

                credentials = newCred;
            }

            // Generate JWT token
            const tokenResponse = await telnyx.telephonyCredentials.createToken(
                credentials.telnyx_credential_id
            );

            return {
                token: tokenResponse.data,
                sipUsername: credentials.sip_username
            };
        } catch (error) {
            console.error('WebRTC token error:', error);
            throw new Error('Failed to generate WebRTC credentials');
        }
    }

    /**
     * Initiate outbound call
     */
    async initiateCall(userId, { from, to }) {
        // Verify user owns the 'from' number
        const userNumber = await db('did_numbers')
            .where({ user_id: userId, phone_number: from, status: 'active' })
            .first();

        if (!userNumber) {
            const error = new Error('You do not own this phone number');
            error.status = 403;
            throw error;
        }

        try {
            const response = await telnyx.calls.create({
                connection_id: config.telnyxSipConnectionId,
                from: from,
                to: to,
                webhook_url: `${config.backendUrl}/api/webhooks/telnyx/call`
            });

            return {
                callId: response.data.call_control_id,
                callLegId: response.data.call_leg_id,
                from,
                to,
                status: 'initiated'
            };
        } catch (error) {
            console.error('Call initiation error:', error);
            throw new Error('Failed to initiate call');
        }
    }
}

export default new TelnyxService();
