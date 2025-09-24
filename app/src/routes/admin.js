/**
 * Admin Panel API Routes
 * Secure admin endpoints with authentication and authorization
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const CSRFProtection = require('../middleware/csrf');
const GameLogger = require('../utils/logger');
const { pool } = require('../config/database');

// Create router factory that accepts GameEngine instance
function createAdminRouter(gameEngine) {
    const router = express.Router();

// Admin credentials from environment
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ted@theorubin.com';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'mudlands_admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'kekpiv-mypxox-1pyrRo';

/**
 * Admin authentication middleware
 */
const authenticateAdmin = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.adminToken;
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Admin authentication required'
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            throw new Error('Invalid admin token');
        }
        req.admin = decoded;
        next();
    } catch (error) {
        GameLogger.security('Invalid admin token attempt', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            error: error.message
        });
        
        return res.status(401).json({
            success: false,
            message: 'Invalid admin token'
        });
    }
};

/**
 * Admin login endpoint - uses regular authentication but checks admin status
 */
router.post('/login', async (req, res) => {
    const { email, username, password } = req.body;
    
    try {
        const bcrypt = require('bcrypt');
        const db = require('../config/database');
        
        // Get user by username (like regular auth)
        const userData = await db.getPlayerByUsername(username);
        if (!userData) {
            GameLogger.security('Admin login attempt - user not found', {
                ip: req.ip,
                username,
                userAgent: req.get('User-Agent')
            });
            
            return res.status(401).json({
                success: false,
                message: 'Invalid admin credentials'
            });
        }
        
        // Verify password
        const passwordMatch = await bcrypt.compare(password, userData.password_hash);
        if (!passwordMatch) {
            GameLogger.security('Admin login attempt - wrong password', {
                ip: req.ip,
                username,
                userAgent: req.get('User-Agent')
            });
            
            return res.status(401).json({
                success: false,
                message: 'Invalid admin credentials'
            });
        }
        
        // Check if user is admin
        if (!userData.is_admin) {
            GameLogger.security('Admin login attempt - not admin', {
                ip: req.ip,
                username,
                userAgent: req.get('User-Agent')
            });
            
            return res.status(401).json({
                success: false,
                message: 'Access denied - admin privileges required'
            });
        }
        
        // Generate admin JWT token
        const adminToken = jwt.sign({
            role: 'admin',
            userId: userData.id,
            email: userData.email,
            username: userData.username
        }, process.env.JWT_SECRET, {
            expiresIn: '24h'
        });
        
        // Set secure cookie
        res.cookie('adminToken', adminToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        
        GameLogger.info('Admin login successful', {
            ip: req.ip,
            username: userData.username,
            userId: userData.id
        });
        
        res.json({
            success: true,
            message: 'Admin login successful',
            token: adminToken
        });
        
    } catch (error) {
        GameLogger.error('Admin login error', {
            error: error.message,
            ip: req.ip
        });
        
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

/**
 * Admin logout endpoint
 */
router.post('/logout', authenticateAdmin, (req, res) => {
    res.clearCookie('adminToken');
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

/**
 * Get system stats
 */
router.get('/stats', authenticateAdmin, async (req, res) => {
    try {
        // Get database counts
        const [roomsResult, playersResult, itemsResult] = await Promise.all([
            pool.query('SELECT COUNT(*) as count FROM rooms'),
            pool.query('SELECT COUNT(*) as count FROM players'),
            pool.query('SELECT COUNT(*) as count FROM items')
        ]);

        const totalRooms = parseInt(roomsResult.rows[0].count);
        const totalPlayers = parseInt(playersResult.rows[0].count);
        const totalItems = parseInt(itemsResult.rows[0].count);

        const stats = {
            server: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                nodeVersion: process.version,
                environment: process.env.NODE_ENV
            },
            game: {
                onlinePlayers: gameEngine ? gameEngine.getPlayerCount() : 0,
                totalPlayers: totalPlayers,
                totalRooms: totalRooms,
                totalNPCs: 0, // Will be implemented when NPCs table exists
                totalItems: totalItems
            },
            ai: {
                enabled: process.env.AI_ENABLED === 'true',
                model: process.env.OLLAMA_MODEL,
                cacheHits: 0,
                cacheMisses: 0
            }
        };

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        GameLogger.error('Admin stats error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to get system stats'
        });
    }
});

/**
 * Get all players
 */
router.get('/players', authenticateAdmin, async (req, res) => {
    try {
        // Get active players from game engine
        const activePlayers = gameEngine ? gameEngine.getActivePlayers() : [];

        // Also get player data from database for offline players
        const dbPlayersResult = await pool.query(`
            SELECT p.id, p.username, p.email, p.last_login, p.is_admin,
                   ps.level, ps.experience, ps.class, ps.location,
                   ps.current_hp, ps.max_hp
            FROM players p
            LEFT JOIN player_stats ps ON p.id = ps.player_id
            ORDER BY p.last_login DESC
            LIMIT 50
        `);

        const players = activePlayers.map(player => ({
            id: player.id,
            name: player.name,
            level: player.level,
            location: player.location,
            status: 'online',
            hp: `${player.currentHp}/${player.maxHp}`,
            class: player.className
        }));

        // Add offline players that aren't already in the active list
        const activePlayerIds = new Set(activePlayers.map(p => p.id));
        dbPlayersResult.rows.forEach(dbPlayer => {
            if (!activePlayerIds.has(dbPlayer.id)) {
                players.push({
                    id: dbPlayer.id,
                    name: dbPlayer.username,
                    level: dbPlayer.level || 1,
                    location: dbPlayer.location || 'unknown',
                    status: 'offline',
                    hp: dbPlayer.current_hp ? `${dbPlayer.current_hp}/${dbPlayer.max_hp}` : 'N/A',
                    class: dbPlayer.class || 'Novice',
                    lastLogin: dbPlayer.last_login
                });
            }
        });

        res.json({
            success: true,
            players
        });

    } catch (error) {
        GameLogger.error('Admin get players error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to get players'
        });
    }
});

/**
 * Kick player
 */
router.post('/players/:playerId/kick', authenticateAdmin, CSRFProtection.verifyToken, async (req, res) => {
    try {
        const { playerId } = req.params;
        const { reason } = req.body;

        if (!gameEngine) {
            return res.status(503).json({
                success: false,
                message: 'Game engine not available'
            });
        }

        const result = await gameEngine.kickPlayer(playerId, reason || 'Kicked by admin');

        GameLogger.info('Admin kicked player', {
            admin: req.admin.username,
            playerId,
            reason,
            success: result
        });

        res.json({
            success: true,
            message: result ? 'Player kicked successfully' : 'Player not found or already disconnected'
        });

    } catch (error) {
        GameLogger.error('Admin kick player error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to kick player'
        });
    }
});

/**
 * Execute server command
 */
router.post('/command', authenticateAdmin, CSRFProtection.verifyToken, async (req, res) => {
    try {
        const { command } = req.body;

        if (!command || typeof command !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Command is required'
            });
        }

        if (!gameEngine) {
            return res.status(503).json({
                success: false,
                message: 'Game engine not available'
            });
        }

        // Log admin command execution
        GameLogger.info('Admin command executed', {
            admin: req.admin.username,
            command: command.substring(0, 100) // Truncate for logging
        });

        // Execute command through game engine
        const result = await gameEngine.executeAdminCommand(command, req.admin);

        res.json({
            success: true,
            result: result || 'Command executed successfully'
        });

    } catch (error) {
        GameLogger.error('Admin command error', {
            error: error.message,
            command: req.body.command
        });

        res.status(500).json({
            success: false,
            message: 'Command execution failed: ' + error.message
        });
    }
});

/**
 * Generate AI content
 */
router.post('/ai/generate', authenticateAdmin, CSRFProtection.verifyToken, async (req, res) => {
    try {
        const { type, prompt, parameters } = req.body;
        
        if (!type || !prompt) {
            return res.status(400).json({
                success: false,
                message: 'Type and prompt are required'
            });
        }
        
        const AIContentService = require('../services/AIContentService');
        const result = await AIContentService.generateContent(type, prompt, parameters);
        
        GameLogger.info('Admin AI generation', {
            admin: req.admin.username,
            type,
            promptLength: prompt.length
        });
        
        res.json({
            success: true,
            content: result
        });
        
    } catch (error) {
        GameLogger.error('Admin AI generation error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'AI generation failed: ' + error.message
        });
    }
});

/**
 * Get AI service status
 */
router.get('/ai/status', authenticateAdmin, async (req, res) => {
    try {
        const AIContentService = require('../services/AIContentService');
        const status = {
            enabled: process.env.AI_ENABLED === 'true',
            model: process.env.OLLAMA_MODEL,
            host: process.env.OLLAMA_HOST,
            circuitBreakerState: AIContentService.getCircuitBreakerState?.() || 'unknown',
            cacheStats: AIContentService.getCacheStats?.() || {},
            lastError: AIContentService.getLastError?.() || null
        };
        
        res.json({
            success: true,
            status
        });
        
    } catch (error) {
        GameLogger.error('Admin AI status error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to get AI status'
        });
    }
});

/**
 * Broadcast message to all players
 */
router.post('/broadcast', authenticateAdmin, CSRFProtection.verifyToken, async (req, res) => {
    try {
        const { message, type } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        if (!gameEngine) {
            return res.status(503).json({
                success: false,
                message: 'Game engine not available'
            });
        }

        // Send broadcast through game engine
        await gameEngine.broadcastMessage(message, type || 'admin');

        GameLogger.info('Admin broadcast sent', {
            admin: req.admin.username,
            messageLength: message.length,
            type: type || 'admin',
            playerCount: gameEngine.getPlayerCount()
        });

        res.json({
            success: true,
            message: `Broadcast sent to ${gameEngine.getPlayerCount()} players`
        });

    } catch (error) {
        GameLogger.error('Admin broadcast error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Broadcast failed'
        });
    }
});

    return router;
}

module.exports = createAdminRouter;