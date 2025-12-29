import db from '../config/database.js';
import walletService from './wallet.service.js';

class CDRService {
    /**
     * Create or update a CDR entry
     */
    async upsertCDR(callData) {
        const {
            callId,
            telnyxCallControlId,
            userId,
            didNumberId,
            direction,
            fromNumber,
            toNumber,
            status,
            startTime,
            answerTime,
            endTime,
            hangupCause,
            recordingUrl,
            metadata
        } = callData;

        // Check if CDR exists
        const existing = await db('cdr').where({ call_id: callId }).first();

        if (existing) {
            // Update existing
            const [updated] = await db('cdr')
                .where({ call_id: callId })
                .update({
                    status,
                    answer_time: answerTime,
                    end_time: endTime,
                    duration_seconds: this.calculateDuration(existing.start_time, endTime),
                    hangup_cause: hangupCause,
                    recording_url: recordingUrl,
                    metadata: metadata ? JSON.stringify(metadata) : existing.metadata
                })
                .returning('*');

            return this.formatCDR(updated);
        }

        // Create new CDR
        const [cdr] = await db('cdr')
            .insert({
                call_id: callId,
                telnyx_call_control_id: telnyxCallControlId,
                user_id: userId,
                did_number_id: didNumberId,
                direction,
                from_number: fromNumber,
                to_number: toNumber,
                status: status || 'initiated',
                start_time: startTime || new Date()
            })
            .returning('*');

        return this.formatCDR(cdr);
    }

    /**
     * Complete a call and calculate cost
     */
    async completeCall(callId, { endTime, hangupCause, recordingUrl }) {
        const cdr = await db('cdr').where({ call_id: callId }).first();

        if (!cdr) {
            console.error('CDR not found for call:', callId);
            return null;
        }

        const duration = this.calculateDuration(cdr.answer_time || cdr.start_time, endTime);
        const cost = this.calculateCost(duration, cdr.direction);

        const [updated] = await db('cdr')
            .where({ call_id: callId })
            .update({
                status: 'completed',
                end_time: endTime,
                duration_seconds: duration,
                hangup_cause: hangupCause || 'normal_clearing',
                cost,
                recording_url: recordingUrl
            })
            .returning('*');

        // Deduct cost from wallet if user exists
        if (cdr.user_id && cost > 0) {
            try {
                await walletService.deductFunds(cdr.user_id, cost, {
                    description: `Call to ${cdr.to_number} (${Math.ceil(duration / 60)} min)`,
                    referenceType: 'call',
                    referenceId: cdr.id
                });
            } catch (error) {
                console.error('Failed to deduct call cost:', error);
            }
        }

        return this.formatCDR(updated);
    }

    /**
     * Get CDR list for user
     */
    async getUserCDR(userId, { page = 1, limit = 20, direction, status, startDate, endDate }) {
        let query = db('cdr')
            .where({ user_id: userId })
            .orderBy('start_time', 'desc');

        if (direction) {
            query = query.where({ direction });
        }

        if (status) {
            query = query.where({ status });
        }

        if (startDate) {
            query = query.where('start_time', '>=', new Date(startDate));
        }

        if (endDate) {
            query = query.where('start_time', '<=', new Date(endDate));
        }

        // Get total count
        const [{ count }] = await query.clone().count();

        // Get paginated results
        const cdrs = await query
            .select('*')
            .limit(limit)
            .offset((page - 1) * limit);

        return {
            records: cdrs.map(this.formatCDR),
            pagination: {
                page,
                limit,
                total: parseInt(count),
                totalPages: Math.ceil(parseInt(count) / limit)
            }
        };
    }

    /**
     * Get CDR by call ID
     */
    async getCDRByCallId(callId) {
        const cdr = await db('cdr').where({ call_id: callId }).first();
        return cdr ? this.formatCDR(cdr) : null;
    }

    /**
     * Get call statistics for user
     */
    async getCallStats(userId, { period = '30d' }) {
        const daysAgo = parseInt(period) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);

        const stats = await db('cdr')
            .where({ user_id: userId })
            .where('start_time', '>=', startDate)
            .select(
                db.raw('COUNT(*) as total_calls'),
                db.raw('SUM(duration_seconds) as total_duration'),
                db.raw('SUM(cost) as total_cost'),
                db.raw("COUNT(CASE WHEN direction = 'inbound' THEN 1 END) as inbound_calls"),
                db.raw("COUNT(CASE WHEN direction = 'outbound' THEN 1 END) as outbound_calls"),
                db.raw("COUNT(CASE WHEN status = 'missed' THEN 1 END) as missed_calls")
            )
            .first();

        return {
            totalCalls: parseInt(stats.total_calls) || 0,
            totalDuration: parseInt(stats.total_duration) || 0,
            totalCost: parseFloat(stats.total_cost) || 0,
            inboundCalls: parseInt(stats.inbound_calls) || 0,
            outboundCalls: parseInt(stats.outbound_calls) || 0,
            missedCalls: parseInt(stats.missed_calls) || 0,
            averageDuration: stats.total_calls > 0
                ? Math.round(stats.total_duration / stats.total_calls)
                : 0
        };
    }

    /**
     * Calculate duration in seconds
     */
    calculateDuration(startTime, endTime) {
        if (!startTime || !endTime) return 0;
        const start = new Date(startTime);
        const end = new Date(endTime);
        return Math.max(0, Math.floor((end - start) / 1000));
    }

    /**
     * Calculate call cost based on duration
     * Default: $0.01 per minute for outbound, free for inbound
     */
    calculateCost(durationSeconds, direction) {
        if (direction === 'inbound') return 0;
        const minutes = Math.ceil(durationSeconds / 60);
        return minutes * 0.01; // $0.01 per minute
    }

    /**
     * Format CDR for API response
     */
    formatCDR(cdr) {
        return {
            id: cdr.id,
            callId: cdr.call_id,
            direction: cdr.direction,
            fromNumber: cdr.from_number,
            toNumber: cdr.to_number,
            status: cdr.status,
            startTime: cdr.start_time,
            answerTime: cdr.answer_time,
            endTime: cdr.end_time,
            durationSeconds: cdr.duration_seconds,
            cost: parseFloat(cdr.cost) || 0,
            hangupCause: cdr.hangup_cause,
            recordingUrl: cdr.recording_url
        };
    }
}

export default new CDRService();
