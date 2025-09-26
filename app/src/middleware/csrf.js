/**
 * CSRF Protection Middleware
 * Lightweight implementation using session-based tokens
 */

const crypto = require('crypto');
const GameLogger = require('../utils/logger');

class CSRFProtection {
    /**
     * Generate CSRF token
     */
    static generateToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Initialize CSRF token for session
     */
    static initializeToken(req, res, next) {
        if (!req.session.csrfToken) {
            req.session.csrfToken = CSRFProtection.generateToken();
        }
        next();
    }

    /**
     * Provide CSRF token endpoint
     */
    static getToken(req, res) {
        res.json({
            success: true,
            csrfToken: req.session.csrfToken
        });
    }

    /**
     * Verify CSRF token middleware
     */
    static verifyToken(req, res, next) {
        // Skip CSRF check for GET requests (they should be idempotent)
        if (req.method === 'GET') {
            return next();
        }

        // Skip CSRF for Socket.IO (has different protection mechanisms)
        if (req.url.includes('/socket.io')) {
            return next();
        }

        // Skip CSRF for registration, login, and character creation endpoints (they have other protections)
        if (req.url === '/auth/register' || req.url === '/auth/login' ||
            req.url === '/character/create' ||
            req.originalUrl === '/api/auth/register' || req.originalUrl === '/api/auth/login' ||
            req.originalUrl === '/api/character/create') {
            return next();
        }

        // Skip CSRF for AI character activation endpoints (internal system calls)
        if (req.originalUrl.includes('/api/ai/characters/') ||
            req.originalUrl.includes('/api/ai/story/')) {
            return next();
        }

        const sessionToken = req.session.csrfToken;
        const requestToken = req.headers['x-csrf-token'] || 
                            req.body.csrfToken || 
                            req.query.csrfToken;

        if (!sessionToken) {
            GameLogger.security('CSRF: No session token', {
                ip: req.ip,
                url: req.url,
                method: req.method
            });

            return res.status(403).json({
                success: false,
                message: 'CSRF token required'
            });
        }

        if (!requestToken) {
            GameLogger.security('CSRF: No request token', {
                ip: req.ip,
                url: req.url,
                method: req.method,
                userAgent: req.get('User-Agent')
            });

            return res.status(403).json({
                success: false,
                message: 'CSRF token missing'
            });
        }

        // Use crypto.timingSafeEqual to prevent timing attacks
        const sessionBuffer = Buffer.from(sessionToken, 'hex');
        const requestBuffer = Buffer.from(requestToken, 'hex');

        if (sessionBuffer.length !== requestBuffer.length || 
            !crypto.timingSafeEqual(sessionBuffer, requestBuffer)) {
            
            GameLogger.security('CSRF: Invalid token', {
                ip: req.ip,
                url: req.url,
                method: req.method,
                userAgent: req.get('User-Agent')
            });

            return res.status(403).json({
                success: false,
                message: 'Invalid CSRF token'
            });
        }

        next();
    }

    /**
     * Rotate CSRF token after sensitive operations
     */
    static rotateToken(req, res, next) {
        req.session.csrfToken = CSRFProtection.generateToken();
        next();
    }
}

module.exports = CSRFProtection;