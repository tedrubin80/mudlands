/**
 * JWT Token Blacklist Management
 * Tracks invalidated tokens to prevent reuse
 */

const GameLogger = require('./logger');

class TokenBlacklist {
    constructor() {
        // In-memory blacklist for development
        // In production, use Redis for distributed systems
        this.blacklistedTokens = new Map();
        
        // Clean up expired tokens every hour
        setInterval(() => {
            this.cleanupExpiredTokens();
        }, 60 * 60 * 1000);
    }

    /**
     * Add token to blacklist
     * @param {string} jti - JWT ID (unique identifier)
     * @param {number} exp - Token expiration time
     */
    blacklistToken(jti, exp) {
        if (!jti) {
            GameLogger.warn('Attempted to blacklist token without JTI');
            return;
        }

        this.blacklistedTokens.set(jti, {
            exp: exp * 1000, // Convert to milliseconds
            blacklistedAt: Date.now()
        });

        GameLogger.info('Token blacklisted', { jti, exp });
    }

    /**
     * Check if token is blacklisted
     * @param {string} jti - JWT ID
     * @returns {boolean} True if blacklisted
     */
    isBlacklisted(jti) {
        if (!jti) return false;
        
        const tokenInfo = this.blacklistedTokens.get(jti);
        if (!tokenInfo) return false;

        // Check if token has expired (can be removed from blacklist)
        if (Date.now() > tokenInfo.exp) {
            this.blacklistedTokens.delete(jti);
            return false;
        }

        return true;
    }

    /**
     * Clean up expired tokens from blacklist
     */
    cleanupExpiredTokens() {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [jti, tokenInfo] of this.blacklistedTokens) {
            if (now > tokenInfo.exp) {
                this.blacklistedTokens.delete(jti);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            GameLogger.info(`Cleaned up ${cleanedCount} expired tokens from blacklist`);
        }
    }

    /**
     * Get blacklist stats
     */
    getStats() {
        return {
            totalBlacklisted: this.blacklistedTokens.size,
            entries: Array.from(this.blacklistedTokens.entries()).map(([jti, info]) => ({
                jti,
                exp: new Date(info.exp),
                blacklistedAt: new Date(info.blacklistedAt)
            }))
        };
    }

    /**
     * Clear all blacklisted tokens (for testing)
     */
    clear() {
        this.blacklistedTokens.clear();
        GameLogger.info('Token blacklist cleared');
    }
}

// Singleton instance
const tokenBlacklist = new TokenBlacklist();

module.exports = tokenBlacklist;