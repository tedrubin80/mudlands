/**
 * Centralized logging utility using Winston
 * Provides structured logging across the application
 */

const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for console output with colors
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
        let logMessage = `${timestamp} [${level}]: ${message}`;
        
        // Add metadata if present
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        if (metaStr) {
            logMessage += `\n${metaStr}`;
        }
        
        return logMessage;
    })
);

// Custom format for file output (JSON)
const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service: 'mudlands-server' },
    transports: [
        // Error log file
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        
        // Combined log file
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 10,
        }),
        
        // Console output
        new winston.transports.Console({
            format: consoleFormat,
            level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
        })
    ]
});

// Game-specific logging methods
class GameLogger {
    static info(message, meta = {}) {
        logger.info(message, meta);
    }
    
    static warn(message, meta = {}) {
        logger.warn(message, meta);
    }
    
    static error(message, error = null, meta = {}) {
        const logData = { ...meta };
        
        if (error) {
            if (error instanceof Error) {
                logData.error = {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                };
            } else {
                logData.error = error;
            }
        }
        
        logger.error(message, logData);
    }
    
    static debug(message, meta = {}) {
        logger.debug(message, meta);
    }
    
    // Game-specific methods
    static playerAction(playerId, playerName, action, details = {}) {
        this.info(`Player action: ${action}`, {
            playerId,
            playerName,
            action,
            ...details
        });
    }
    
    static gameEvent(event, details = {}) {
        this.info(`Game event: ${event}`, {
            event,
            ...details
        });
    }
    
    static security(message, details = {}) {
        this.warn(`Security: ${message}`, {
            category: 'security',
            ...details
        });
    }
    
    static database(operation, success = true, details = {}) {
        const message = `Database ${operation}: ${success ? 'success' : 'failed'}`;
        if (success) {
            this.info(message, { operation, ...details });
        } else {
            this.error(message, null, { operation, ...details });
        }
    }
    
    static connection(socketId, action, playerName = null) {
        this.info(`Connection ${action}`, {
            socketId,
            action,
            playerName
        });
    }
    
    static crafting(playerId, recipeId, result, details = {}) {
        this.info(`Crafting ${result}`, {
            playerId,
            recipeId,
            result,
            ...details
        });
    }
}

module.exports = GameLogger;