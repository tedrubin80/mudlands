/**
 * Input validation and sanitization utilities
 * Prevents injection attacks and ensures data integrity
 */

class ValidationUtils {
    /**
     * Sanitize text input by removing potential XSS vectors
     * @param {string} input - User input to sanitize
     * @param {number} maxLength - Maximum allowed length
     * @returns {string} Sanitized input
     */
    static sanitizeText(input, maxLength = 1000) {
        if (typeof input !== 'string') {
            return '';
        }
        
        // Trim whitespace and limit length
        let sanitized = input.trim().substring(0, maxLength);
        
        // Remove null bytes and control characters (except newlines and tabs)
        sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        
        // Remove potentially dangerous HTML/script tags
        sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
        sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
        sanitized = sanitized.replace(/<object[^>]*>.*?<\/object>/gi, '');
        sanitized = sanitized.replace(/<embed[^>]*>/gi, '');
        sanitized = sanitized.replace(/javascript:/gi, '');
        sanitized = sanitized.replace(/on\w+\s*=/gi, '');
        
        return sanitized;
    }

    /**
     * Validate and sanitize username
     * @param {string} username - Username to validate
     * @returns {object} Validation result
     */
    static validateUsername(username) {
        if (!username || typeof username !== 'string') {
            return { isValid: false, message: 'Username is required' };
        }

        const sanitized = this.sanitizeText(username, 50);
        
        if (sanitized.length < 3) {
            return { isValid: false, message: 'Username must be at least 3 characters long' };
        }
        
        if (sanitized.length > 20) {
            return { isValid: false, message: 'Username must be 20 characters or less' };
        }
        
        // Only allow alphanumeric and underscore
        if (!/^[a-zA-Z0-9_]+$/.test(sanitized)) {
            return { isValid: false, message: 'Username can only contain letters, numbers, and underscores' };
        }
        
        // Don't allow usernames that look like system commands
        const reservedNames = ['admin', 'system', 'guest', 'mod', 'moderator', 'bot', 'server'];
        if (reservedNames.includes(sanitized.toLowerCase())) {
            return { isValid: false, message: 'This username is reserved' };
        }
        
        return { isValid: true, sanitized };
    }

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {object} Validation result
     */
    static validatePassword(password) {
        if (!password || typeof password !== 'string') {
            return { isValid: false, message: 'Password is required' };
        }

        if (password.length < 8) {
            return { isValid: false, message: 'Password must be at least 8 characters long' };
        }
        
        if (password.length > 128) {
            return { isValid: false, message: 'Password must be 128 characters or less' };
        }
        
        // Check for basic complexity
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        const complexity = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
        
        if (complexity < 3) {
            return { 
                isValid: false, 
                message: 'Password must contain at least 3 of: lowercase, uppercase, numbers, special characters' 
            };
        }
        
        return { isValid: true };
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {object} Validation result
     */
    static validateEmail(email) {
        if (!email || typeof email !== 'string') {
            return { isValid: false, message: 'Email is required' };
        }

        const sanitized = this.sanitizeText(email, 254).toLowerCase();
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        
        if (!emailRegex.test(sanitized)) {
            return { isValid: false, message: 'Please enter a valid email address' };
        }
        
        return { isValid: true, sanitized };
    }

    /**
     * Validate and sanitize game command
     * @param {string} command - Command to validate
     * @returns {object} Validation result
     */
    static validateCommand(command) {
        if (!command || typeof command !== 'string') {
            return { isValid: false, message: 'Command is required' };
        }

        const sanitized = this.sanitizeText(command, 500);
        
        if (sanitized.length === 0) {
            return { isValid: false, message: 'Command cannot be empty' };
        }
        
        // Prevent command injection attempts
        if (sanitized.includes('&&') || sanitized.includes('||') || sanitized.includes(';')) {
            return { isValid: false, message: 'Invalid command format' };
        }
        
        return { isValid: true, sanitized };
    }

    /**
     * Validate numeric input with range
     * @param {any} value - Value to validate
     * @param {number} min - Minimum allowed value
     * @param {number} max - Maximum allowed value
     * @returns {object} Validation result
     */
    static validateNumber(value, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
        const num = parseInt(value, 10);
        
        if (isNaN(num)) {
            return { isValid: false, message: 'Must be a valid number' };
        }
        
        if (num < min || num > max) {
            return { isValid: false, message: `Must be between ${min} and ${max}` };
        }
        
        return { isValid: true, value: num };
    }

    /**
     * Sanitize player name/message for display
     * @param {string} message - Message to sanitize for chat/display
     * @returns {string} Sanitized message
     */
    static sanitizeMessage(message) {
        if (!message || typeof message !== 'string') {
            return '';
        }
        
        // Limit message length for chat
        const sanitized = this.sanitizeText(message, 500);
        
        // Remove excessive whitespace
        return sanitized.replace(/\s+/g, ' ').trim();
    }

    /**
     * Validate UUID format
     * @param {string} uuid - UUID to validate
     * @returns {boolean} Is valid UUID
     */
    static isValidUUID(uuid) {
        if (!uuid || typeof uuid !== 'string') {
            return false;
        }
        
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }
}

module.exports = ValidationUtils;