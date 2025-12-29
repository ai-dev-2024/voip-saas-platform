import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../config/database.js';
import config from '../config/index.js';

class AuthService {
    /**
     * Register a new user
     */
    async register({ email, password, firstName, lastName }) {
        // Check if user exists
        const existingUser = await db('users').where({ email: email.toLowerCase() }).first();
        if (existingUser) {
            const error = new Error('Email already registered');
            error.status = 400;
            throw error;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user with transaction
        const [user] = await db.transaction(async (trx) => {
            // Insert user
            const [newUser] = await trx('users')
                .insert({
                    email: email.toLowerCase(),
                    password_hash: passwordHash,
                    first_name: firstName,
                    last_name: lastName
                })
                .returning(['id', 'email', 'first_name', 'last_name', 'created_at']);

            // Create wallet for user
            await trx('wallets').insert({
                user_id: newUser.id,
                balance: 0,
                currency: 'USD'
            });

            return [newUser];
        });

        // Generate tokens
        const accessToken = this.generateAccessToken(user);
        const { refreshToken, refreshTokenHash } = await this.generateRefreshToken();

        // Store refresh token
        await this.storeRefreshToken(user.id, refreshTokenHash);

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name
            },
            accessToken,
            refreshToken
        };
    }

    /**
     * Login user
     */
    async login({ email, password, deviceInfo, ipAddress }) {
        // Find user
        const user = await db('users').where({ email: email.toLowerCase() }).first();
        if (!user) {
            const error = new Error('Invalid email or password');
            error.status = 401;
            throw error;
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            const error = new Error('Invalid email or password');
            error.status = 401;
            throw error;
        }

        // Generate tokens
        const accessToken = this.generateAccessToken(user);
        const { refreshToken, refreshTokenHash } = await this.generateRefreshToken();

        // Store refresh token with device info
        await this.storeRefreshToken(user.id, refreshTokenHash, deviceInfo, ipAddress);

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                avatarUrl: user.avatar_url
            },
            accessToken,
            refreshToken
        };
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshTokens(refreshToken, deviceInfo, ipAddress) {
        // Hash the provided refresh token
        const refreshTokenHash = crypto
            .createHash('sha256')
            .update(refreshToken)
            .digest('hex');

        // Find the refresh token in database
        const storedToken = await db('refresh_tokens')
            .where({ token_hash: refreshTokenHash, revoked: false })
            .where('expires_at', '>', new Date())
            .first();

        if (!storedToken) {
            const error = new Error('Invalid or expired refresh token');
            error.status = 401;
            throw error;
        }

        // Get user
        const user = await db('users')
            .where({ id: storedToken.user_id })
            .first();

        if (!user) {
            const error = new Error('User not found');
            error.status = 401;
            throw error;
        }

        // Revoke old refresh token (token rotation)
        await db('refresh_tokens')
            .where({ id: storedToken.id })
            .update({ revoked: true });

        // Generate new tokens
        const accessToken = this.generateAccessToken(user);
        const newRefreshToken = await this.generateRefreshToken();

        // Store new refresh token
        await this.storeRefreshToken(user.id, newRefreshToken.refreshTokenHash, deviceInfo, ipAddress);

        return {
            accessToken,
            refreshToken: newRefreshToken.refreshToken
        };
    }

    /**
     * Logout - revoke refresh token
     */
    async logout(refreshToken) {
        if (!refreshToken) return { message: 'Logged out' };

        const refreshTokenHash = crypto
            .createHash('sha256')
            .update(refreshToken)
            .digest('hex');

        await db('refresh_tokens')
            .where({ token_hash: refreshTokenHash })
            .update({ revoked: true });

        return { message: 'Logged out successfully' };
    }

    /**
     * Logout from all devices
     */
    async logoutAll(userId) {
        await db('refresh_tokens')
            .where({ user_id: userId })
            .update({ revoked: true });

        return { message: 'Logged out from all devices' };
    }

    /**
     * Get user profile
     */
    async getProfile(userId) {
        const user = await db('users')
            .select('id', 'email', 'first_name', 'last_name', 'phone_number',
                'email_verified', 'phone_verified', 'avatar_url', 'timezone', 'created_at')
            .where({ id: userId })
            .first();

        if (!user) {
            const error = new Error('User not found');
            error.status = 404;
            throw error;
        }

        // Get wallet balance
        const wallet = await db('wallets')
            .select('balance', 'currency')
            .where({ user_id: userId })
            .first();

        // Get DID numbers count
        const didCount = await db('did_numbers')
            .where({ user_id: userId, status: 'active' })
            .count('id as count')
            .first();

        return {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            phoneNumber: user.phone_number,
            emailVerified: user.email_verified,
            phoneVerified: user.phone_verified,
            avatarUrl: user.avatar_url,
            timezone: user.timezone,
            createdAt: user.created_at,
            wallet: wallet ? {
                balance: parseFloat(wallet.balance),
                currency: wallet.currency
            } : null,
            stats: {
                didNumbers: parseInt(didCount?.count || 0)
            }
        };
    }

    /**
     * Update user profile
     */
    async updateProfile(userId, { firstName, lastName, phoneNumber, timezone, avatarUrl }) {
        const updateData = {
            updated_at: db.fn.now()
        };

        if (firstName !== undefined) updateData.first_name = firstName;
        if (lastName !== undefined) updateData.last_name = lastName;
        if (phoneNumber !== undefined) updateData.phone_number = phoneNumber;
        if (timezone !== undefined) updateData.timezone = timezone;
        if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;

        const [user] = await db('users')
            .where({ id: userId })
            .update(updateData)
            .returning(['id', 'email', 'first_name', 'last_name', 'phone_number', 'avatar_url', 'timezone']);

        return {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            phoneNumber: user.phone_number,
            avatarUrl: user.avatar_url,
            timezone: user.timezone
        };
    }

    /**
     * Change password
     */
    async changePassword(userId, { currentPassword, newPassword }) {
        const user = await db('users').where({ id: userId }).first();

        const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isValidPassword) {
            const error = new Error('Current password is incorrect');
            error.status = 400;
            throw error;
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 12);

        await db('users')
            .where({ id: userId })
            .update({
                password_hash: newPasswordHash,
                updated_at: db.fn.now()
            });

        // Revoke all refresh tokens for security
        await db('refresh_tokens')
            .where({ user_id: userId })
            .update({ revoked: true });

        return { message: 'Password updated successfully' };
    }

    /**
     * Get active sessions
     */
    async getActiveSessions(userId) {
        const sessions = await db('refresh_tokens')
            .where({ user_id: userId, revoked: false })
            .where('expires_at', '>', new Date())
            .select('id', 'device_info', 'ip_address', 'created_at')
            .orderBy('created_at', 'desc');

        return sessions.map(s => ({
            id: s.id,
            deviceInfo: s.device_info,
            ipAddress: s.ip_address,
            createdAt: s.created_at
        }));
    }

    /**
     * Revoke a specific session
     */
    async revokeSession(userId, sessionId) {
        await db('refresh_tokens')
            .where({ id: sessionId, user_id: userId })
            .update({ revoked: true });

        return { message: 'Session revoked' };
    }

    /**
     * Generate short-lived access token (15 minutes)
     */
    generateAccessToken(user) {
        return jwt.sign(
            {
                userId: user.id,
                email: user.email,
                type: 'access'
            },
            config.jwtSecret,
            { expiresIn: '15m' }
        );
    }

    /**
     * Generate long-lived refresh token (7 days)
     */
    async generateRefreshToken() {
        const refreshToken = crypto.randomBytes(64).toString('hex');
        const refreshTokenHash = crypto
            .createHash('sha256')
            .update(refreshToken)
            .digest('hex');

        return { refreshToken, refreshTokenHash };
    }

    /**
     * Store refresh token in database
     */
    async storeRefreshToken(userId, tokenHash, deviceInfo = null, ipAddress = null) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        await db('refresh_tokens').insert({
            user_id: userId,
            token_hash: tokenHash,
            device_info: deviceInfo,
            ip_address: ipAddress,
            expires_at: expiresAt
        });
    }

    /**
     * Clean up expired refresh tokens (run periodically)
     */
    async cleanupExpiredTokens() {
        const deleted = await db('refresh_tokens')
            .where('expires_at', '<', new Date())
            .orWhere('revoked', true)
            .del();

        return { deleted };
    }

    /**
     * Legacy: Generate token (for backward compatibility)
     * @deprecated Use generateAccessToken instead
     */
    generateToken(user) {
        return this.generateAccessToken(user);
    }
}

export default new AuthService();
