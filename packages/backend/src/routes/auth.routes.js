import { Router } from 'express';
import authService from '../services/auth.service.js';
import { validate, schemas, trimStrings } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import { rateLimiters } from '../middleware/rateLimiter.js';

const router = Router();

// Apply string trimming to all routes
router.use(trimStrings);

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register',
    rateLimiters.auth,
    validate(schemas.register),
    async (req, res, next) => {
        try {
            const result = await authService.register(req.body);

            // Set refresh token as HTTP-only cookie
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.status(201).json({
                user: result.user,
                accessToken: result.accessToken
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login',
    rateLimiters.auth,
    validate(schemas.login),
    async (req, res, next) => {
        try {
            const deviceInfo = req.get('User-Agent');
            const ipAddress = req.ip;

            const result = await authService.login({
                ...req.body,
                deviceInfo,
                ipAddress
            });

            // Set refresh token as HTTP-only cookie
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.json({
                user: result.user,
                accessToken: result.accessToken
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res, next) => {
    try {
        // Get refresh token from cookie or body
        const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required' });
        }

        const deviceInfo = req.get('User-Agent');
        const ipAddress = req.ip;

        const result = await authService.refreshTokens(refreshToken, deviceInfo, ipAddress);

        // Update refresh token cookie
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            accessToken: result.accessToken
        });
    } catch (error) {
        // Clear cookie on refresh failure
        res.clearCookie('refreshToken');
        next(error);
    }
});

/**
 * POST /api/auth/logout
 * Logout user (revoke refresh token)
 */
router.post('/logout', async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
        await authService.logout(refreshToken);

        res.clearCookie('refreshToken');
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/logout-all
 * Logout from all devices
 */
router.post('/logout-all', authenticate, async (req, res, next) => {
    try {
        await authService.logoutAll(req.user.userId);
        res.clearCookie('refreshToken');
        res.json({ message: 'Logged out from all devices' });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req, res, next) => {
    try {
        const profile = await authService.getProfile(req.user.userId);
        res.json(profile);
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/auth/profile
 * Update user profile
 */
router.patch('/profile',
    authenticate,
    validate(schemas.updateProfile),
    async (req, res, next) => {
        try {
            const { firstName, lastName, phoneNumber, timezone, avatarUrl } = req.body;
            const result = await authService.updateProfile(req.user.userId, {
                firstName,
                lastName,
                phoneNumber,
                timezone,
                avatarUrl
            });
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/auth/change-password
 * Change password
 */
router.post('/change-password',
    authenticate,
    validate(schemas.changePassword),
    async (req, res, next) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const result = await authService.changePassword(req.user.userId, {
                currentPassword,
                newPassword
            });

            // Clear cookies after password change (forces re-login)
            res.clearCookie('refreshToken');
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/auth/sessions
 * Get active sessions
 */
router.get('/sessions', authenticate, async (req, res, next) => {
    try {
        const sessions = await authService.getActiveSessions(req.user.userId);
        res.json({ sessions });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/auth/sessions/:id
 * Revoke a specific session
 */
router.delete('/sessions/:id', authenticate, async (req, res, next) => {
    try {
        await authService.revokeSession(req.user.userId, req.params.id);
        res.json({ message: 'Session revoked' });
    } catch (error) {
        next(error);
    }
});

export default router;
