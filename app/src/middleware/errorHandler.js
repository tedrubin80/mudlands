/**
 * Centralized error handling middleware
 * Provides consistent error responses and logging
 */

const GameLogger = require('../utils/logger');

class ErrorHandler {
    /**
     * Express error handling middleware
     */
    static handleError(err, req, res, next) {
        // Log the error with context
        GameLogger.error('Unhandled error in request', err, {
            url: req.url,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            body: req.body ? Object.keys(req.body) : undefined // Don't log sensitive data
        });

        // Determine error status and message
        let statusCode = 500;
        let message = 'Internal server error';
        
        if (err.name === 'ValidationError') {
            statusCode = 400;
            message = err.message;
        } else if (err.name === 'UnauthorizedError') {
            statusCode = 401;
            message = 'Unauthorized';
        } else if (err.name === 'CastError') {
            statusCode = 400;
            message = 'Invalid data format';
        } else if (err.code === 'ECONNREFUSED') {
            statusCode = 503;
            message = 'Service temporarily unavailable';
        } else if (err.status && err.status < 500) {
            statusCode = err.status;
            message = err.message;
        }

        // Don't expose internal errors in production
        if (process.env.NODE_ENV === 'production' && statusCode === 500) {
            message = 'Internal server error';
        }

        res.status(statusCode).json({
            success: false,
            message,
            ...(process.env.NODE_ENV === 'development' && { 
                stack: err.stack,
                error: err.name 
            })
        });
    }

    /**
     * Handle 404 routes
     */
    static handleNotFound(req, res) {
        GameLogger.warn('Route not found', {
            url: req.url,
            method: req.method,
            ip: req.ip
        });

        res.status(404).json({
            success: false,
            message: 'Route not found'
        });
    }

    /**
     * Async route wrapper to catch promise rejections
     */
    static asyncWrapper(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }

    /**
     * Database error handler
     */
    static handleDatabaseError(error, operation, context = {}) {
        const isDuplicateKey = error.code === '23505'; // PostgreSQL duplicate key
        const isConnectionError = error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND';
        
        if (isDuplicateKey) {
            GameLogger.warn('Database duplicate key error', {
                operation,
                constraint: error.constraint,
                ...context
            });
            return {
                statusCode: 409,
                message: 'Resource already exists'
            };
        }
        
        if (isConnectionError) {
            GameLogger.error('Database connection error', error, {
                operation,
                ...context
            });
            return {
                statusCode: 503,
                message: 'Database temporarily unavailable'
            };
        }

        GameLogger.error('Database operation failed', error, {
            operation,
            ...context
        });
        
        return {
            statusCode: 500,
            message: 'Database operation failed'
        };
    }

    /**
     * Socket error handler
     */
    static handleSocketError(socket, error, context = {}) {
        GameLogger.error('Socket error', error, {
            socketId: socket.id,
            ...context
        });

        // Send error to client
        socket.emit('error', {
            message: 'An error occurred',
            type: 'socket_error'
        });
    }

    /**
     * Game logic error handler
     */
    static handleGameError(error, context = {}) {
        // Determine if this is a known game error
        if (error.name === 'PlayerNotFoundError') {
            GameLogger.warn('Player not found', context);
            return { success: false, message: 'Player not found' };
        }
        
        if (error.name === 'RoomNotFoundError') {
            GameLogger.warn('Room not found', context);
            return { success: false, message: 'Location not found' };
        }
        
        if (error.name === 'InsufficientResourcesError') {
            GameLogger.info('Insufficient resources', context);
            return { success: false, message: error.message };
        }

        // Unknown game error
        GameLogger.error('Unexpected game error', error, context);
        return { 
            success: false, 
            message: 'A game error occurred. Please try again.' 
        };
    }
}

module.exports = ErrorHandler;