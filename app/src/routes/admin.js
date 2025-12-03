/**
 * Admin Panel API Routes
 * Secure admin endpoints with authentication and authorization
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const CSRFProtection = require('../middleware/csrf');
const GameLogger = require('../utils/logger');
const { pool } = require('../config/database');

// Create router factory that accepts GameEngine instance
function createAdminRouter(gameEngine) {
    const router = express.Router();

// Admin credentials from environment
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '[REDACTED]';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'mudlands_admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '[REDACTED]';

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

/**
 * Update player level
 */
router.post('/players/:playerId/level', authenticateAdmin, CSRFProtection.verifyToken, async (req, res) => {
    try {
        const { playerId } = req.params;
        const { level } = req.body;

        if (!level || level < 1 || level > 99) {
            return res.status(400).json({
                success: false,
                message: 'Level must be between 1 and 99'
            });
        }

        // Update in database
        await pool.query(`
            UPDATE player_stats
            SET level = $1, experience = $2
            WHERE player_id = $3
        `, [level, level * 1000, playerId]);

        // If player is online, update in game engine
        if (gameEngine) {
            const activePlayer = gameEngine.getPlayerById(playerId);
            if (activePlayer) {
                activePlayer.level = level;
                activePlayer.experience = level * 1000;
                activePlayer.recalculateStats();
            }
        }

        GameLogger.info('Admin updated player level', {
            admin: req.admin.username,
            playerId,
            newLevel: level
        });

        res.json({
            success: true,
            message: `Player level updated to ${level}`
        });

    } catch (error) {
        GameLogger.error('Admin level update error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to update player level'
        });
    }
});

/**
 * Update player stats (HP, MP, Gold)
 */
router.post('/players/:playerId/stats', authenticateAdmin, CSRFProtection.verifyToken, async (req, res) => {
    try {
        const { playerId } = req.params;
        const { hp, mp, gold } = req.body;

        const updates = [];
        const values = [];
        let paramCount = 0;

        if (hp !== undefined) {
            updates.push(`current_hp = $${++paramCount}`);
            values.push(hp);
        }
        if (mp !== undefined) {
            updates.push(`current_mp = $${++paramCount}`);
            values.push(mp);
        }
        if (gold !== undefined) {
            updates.push(`gold = $${++paramCount}`);
            values.push(gold);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid stats to update'
            });
        }

        values.push(playerId);
        await pool.query(`
            UPDATE player_stats
            SET ${updates.join(', ')}
            WHERE player_id = $${++paramCount}
        `, values);

        // Update active player if online
        if (gameEngine) {
            const activePlayer = gameEngine.getPlayerById(playerId);
            if (activePlayer) {
                if (hp !== undefined) activePlayer.currentHp = hp;
                if (mp !== undefined) activePlayer.currentMp = mp;
                if (gold !== undefined) activePlayer.gold = gold;
            }
        }

        GameLogger.info('Admin updated player stats', {
            admin: req.admin.username,
            playerId,
            updates: { hp, mp, gold }
        });

        res.json({
            success: true,
            message: 'Player stats updated successfully'
        });

    } catch (error) {
        GameLogger.error('Admin stats update error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to update player stats'
        });
    }
});

/**
 * Get AI characters
 */
router.get('/ai-characters', authenticateAdmin, async (req, res) => {
    try {
        const fs = require('fs').promises;
        const path = require('path');

        const aiCharactersPath = path.join(__dirname, '../../mudlands_ai_analysis/character_profiles/manual_test_queue/ready_for_testing');
        const activationConfigPath = path.join(__dirname, '../../mudlands_ai_analysis/character_profiles/auto_players/activation_config.json');

        // Get real-time AI character status from the game engine
        const gameEngine = req.app.get('gameEngine');
        let activeAICharacters = [];

        if (gameEngine && gameEngine.aiCharacterController) {
            const report = gameEngine.aiCharacterController.getStatusReport();
            activeAICharacters = report.activeCharacters || [];
        }

        // Read AI character profiles from ready_for_testing
        const characterFiles = await fs.readdir(aiCharactersPath);
        const characters = [];

        for (const file of characterFiles) {
            if (file.endsWith('.json')) {
                const filePath = path.join(aiCharactersPath, file);
                const characterData = JSON.parse(await fs.readFile(filePath, 'utf8'));

                // Check if this character is currently active in the AI system
                const isActiveInAI = activeAICharacters.find(ac => ac.id === characterData.metadata.character_id);

                characters.push({
                    id: characterData.metadata.character_id,
                    name: characterData.character_data.name,
                    level: characterData.character_data.level,
                    location: characterData.character_data.location,
                    status: characterData.metadata.status,
                    lastUpdated: characterData.metadata.last_updated,
                    personality: characterData.ai_behavior_config.personality_traits.join(', '),
                    filePath: file,
                    // Add real-time AI status
                    isActiveInAI: !!isActiveInAI,
                    currentBehavior: isActiveInAI?.currentBehavior || null,
                    aiStats: isActiveInAI?.stats || null
                });
            }
        }

        // Also check active directory for characters that might be active but not in ready_for_testing
        const activePath = path.join(__dirname, '../../mudlands_ai_analysis/character_profiles/auto_players/active');
        try {
            const activeFiles = await fs.readdir(activePath);
            for (const file of activeFiles) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(activePath, file);
                    const characterData = JSON.parse(await fs.readFile(filePath, 'utf8'));

                    // Check if we already have this character from ready_for_testing
                    if (!characters.find(c => c.id === characterData.metadata.character_id)) {
                        const isActiveInAI = activeAICharacters.find(ac => ac.id === characterData.metadata.character_id);

                        characters.push({
                            id: characterData.metadata.character_id,
                            name: characterData.character_data.name,
                            level: characterData.character_data.level,
                            location: characterData.character_data.location,
                            status: 'active',
                            lastUpdated: characterData.metadata.last_updated,
                            personality: characterData.ai_behavior_config.personality_traits.join(', '),
                            filePath: file,
                            isActiveInAI: !!isActiveInAI,
                            currentBehavior: isActiveInAI?.currentBehavior || null,
                            aiStats: isActiveInAI?.stats || null
                        });
                    }
                }
            }
        } catch (e) {
            // Active directory might not exist
        }

        // Read activation config
        let activationConfig = {};
        try {
            activationConfig = JSON.parse(await fs.readFile(activationConfigPath, 'utf8'));
        } catch (e) {
            // File might not exist yet
        }

        res.json({
            success: true,
            characters,
            activationConfig
        });

    } catch (error) {
        GameLogger.error('Admin AI characters error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to get AI characters'
        });
    }
});

/**
 * Update AI character activation
 */
router.post('/ai-characters/:characterId/activate', authenticateAdmin, CSRFProtection.verifyToken, async (req, res) => {
    try {
        const { characterId } = req.params;
        const { active, schedule } = req.body;

        const fs = require('fs').promises;
        const path = require('path');
        const activationConfigPath = path.join(__dirname, '../../mudlands_ai_analysis/character_profiles/auto_players/activation_config.json');

        let config = {};
        try {
            config = JSON.parse(await fs.readFile(activationConfigPath, 'utf8'));
        } catch (e) {
            // Create new config if file doesn't exist
            config = { characters: {} };
        }

        if (active) {
            config.characters[characterId] = {
                active: true,
                schedule: schedule || ['11:00', '18:00'],
                lastActivated: null
            };
        } else {
            delete config.characters[characterId];
        }

        await fs.writeFile(activationConfigPath, JSON.stringify(config, null, 2));

        GameLogger.info('Admin updated AI character activation', {
            admin: req.admin.username,
            characterId,
            active,
            schedule
        });

        res.json({
            success: true,
            message: `AI character ${active ? 'activated' : 'deactivated'}`
        });

    } catch (error) {
        GameLogger.error('Admin AI activation error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to update AI character activation'
        });
    }
});

/**
 * Manually trigger AI character
 */
router.post('/ai-characters/:characterId/trigger', authenticateAdmin, CSRFProtection.verifyToken, async (req, res) => {
    try {
        const { characterId } = req.params;

        // Execute the AI character scheduler for this specific character
        const { spawn } = require('child_process');
        const schedulerPath = path.join(__dirname, '../../mudlands_ai_analysis/auto_character_scheduler.js');

        const child = spawn('node', [schedulerPath, '--character', characterId], {
            cwd: path.join(__dirname, '../../'),
            stdio: 'pipe'
        });

        let output = '';
        child.stdout.on('data', (data) => {
            output += data.toString();
        });

        child.on('close', (code) => {
            GameLogger.info('Admin triggered AI character', {
                admin: req.admin.username,
                characterId,
                exitCode: code,
                output: output.substring(0, 500)
            });

            res.json({
                success: code === 0,
                message: code === 0 ? 'AI character triggered successfully' : 'AI character trigger failed',
                output: output
            });
        });

    } catch (error) {
        GameLogger.error('Admin AI trigger error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to trigger AI character'
        });
    }
});

/**
 * Delete player character
 */
router.delete('/players/:playerId', authenticateAdmin, CSRFProtection.verifyToken, async (req, res) => {
    try {
        const { playerId } = req.params;

        // First disconnect if online
        if (gameEngine) {
            const activePlayer = gameEngine.getPlayerById(playerId);
            if (activePlayer) {
                gameEngine.kickPlayer(playerId, 'Character deleted by admin');
            }
        }

        // Delete from database
        await pool.query('BEGIN');
        await pool.query('DELETE FROM player_stats WHERE player_id = $1', [playerId]);
        await pool.query('DELETE FROM players WHERE id = $1', [playerId]);
        await pool.query('COMMIT');

        GameLogger.info('Admin deleted player', {
            admin: req.admin.username,
            playerId
        });

        res.json({
            success: true,
            message: 'Player deleted successfully'
        });

    } catch (error) {
        await pool.query('ROLLBACK');
        GameLogger.error('Admin delete player error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to delete player'
        });
    }
});

/**
 * AI Content Generation endpoint
 */
router.post('/ai/generate', authenticateAdmin, CSRFProtection.verifyToken, async (req, res) => {
    try {
        const { type, prompt, parameters } = req.body;

        // Get AI Content Service
        const { getInstance } = require('../services/AIContentService');
        const aiService = getInstance();

        // Determine generation method based on type
        let content;
        switch(type) {
            case 'npc':
                content = await aiService.generateNPC(
                    parameters?.location || 'Unknown Location',
                    parameters?.npcType || 'commoner',
                    parameters?.importance || 'minor',
                    prompt || 'Generate a friendly NPC for a fantasy game'
                );
                break;
            case 'quest':
                content = await aiService.generateQuest(
                    parameters?.level || 5,
                    parameters?.questType || 'fetch',
                    parameters?.location || 'town',
                    parameters?.difficulty || 'medium'
                );
                break;
            case 'monster':
                content = await aiService.generateMonster(
                    parameters?.cr || 1,
                    parameters?.environment || 'forest',
                    parameters?.monsterType || 'beast',
                    parameters?.role || 'solo'
                );
                break;
            case 'item':
                content = await aiService.generateItem(
                    parameters?.rarity || 'common',
                    parameters?.itemType || 'weapon',
                    parameters?.level || 1,
                    parameters?.theme || 'standard'
                );
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: `Unknown content type: ${type}`
                });
        }

        GameLogger.info('AI content generated', {
            admin: req.admin.username,
            type,
            contentPreview: content?.name || content?.title || 'Generated content'
        });

        res.json({
            success: true,
            content,
            type,
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        GameLogger.error('AI content generation failed', {
            error: error.message,
            admin: req.admin.username
        });
        res.status(500).json({
            success: false,
            message: `AI generation failed: ${error.message}`
        });
    }
});

/**
 * AI Activity Log endpoint
 */
router.get('/ai/activity-log', authenticateAdmin, async (req, res) => {
    try {
        // Read recent AI activity from implementation logs
        const fs = require('fs');
        const glob = require('glob');

        const logsPath = path.join(__dirname, '../../mudlands_ai_analysis/implementation_logs');

        // Get recent character stats files
        const statFiles = glob.sync('character_stats_*.json', { cwd: logsPath });

        const activities = [];

        for (const file of statFiles.slice(-10)) { // Last 10 files
            try {
                const filePath = path.join(logsPath, file);
                const stats = JSON.parse(fs.readFileSync(filePath, 'utf8'));

                if (stats.memory?.recentInteractions) {
                    stats.memory.recentInteractions.forEach(interaction => {
                        activities.push({
                            character: stats.characterId,
                            message: `Interacted with ${interaction.playerName} during ${interaction.behavior}`,
                            timestamp: interaction.timestamp,
                            type: 'interaction'
                        });
                    });
                }

                // Add activation events
                if (stats.stats?.activations > 0) {
                    activities.push({
                        character: stats.characterId,
                        message: `Character activated (${stats.stats.activations} total activations)`,
                        timestamp: new Date(stats.lastActive).getTime(),
                        type: 'activation'
                    });
                }
            } catch (err) {
                // Skip invalid files
                continue;
            }
        }

        // Sort by timestamp, most recent first
        activities.sort((a, b) => b.timestamp - a.timestamp);

        res.json({
            success: true,
            activities: activities.slice(0, 50) // Return last 50 activities
        });

    } catch (error) {
        GameLogger.error('Failed to load AI activity log', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to load activity log',
            activities: []
        });
    }
});

/**
 * Trigger all active AI characters
 */
router.post('/ai-characters/trigger-all', authenticateAdmin, CSRFProtection.verifyToken, async (req, res) => {
    try {
        // Get list of active AI characters
        const fs = require('fs');
        const activeDir = path.join(__dirname, '../../mudlands_ai_analysis/character_profiles/auto_players/active');

        if (!fs.existsSync(activeDir)) {
            return res.json({
                success: true,
                message: 'No active AI characters found',
                count: 0
            });
        }

        const activeFiles = fs.readdirSync(activeDir).filter(file => file.endsWith('.json'));

        // Trigger each active character
        let triggeredCount = 0;
        for (const file of activeFiles) {
            try {
                const { spawn } = require('child_process');
                const schedulerPath = path.join(__dirname, '../../mudlands_ai_analysis/auto_character_scheduler.js');
                const characterId = file.replace('.json', '');

                const child = spawn('node', [schedulerPath, '--character', characterId], {
                    cwd: path.join(__dirname, '../../'),
                    stdio: 'pipe',
                    detached: true
                });

                child.unref(); // Allow process to continue independently
                triggeredCount++;

            } catch (err) {
                GameLogger.error('Failed to trigger AI character', {
                    character: file,
                    error: err.message
                });
            }
        }

        GameLogger.info('Triggered all active AI characters', {
            admin: req.admin.username,
            count: triggeredCount
        });

        res.json({
            success: true,
            message: `Triggered ${triggeredCount} AI characters`,
            count: triggeredCount
        });

    } catch (error) {
        GameLogger.error('Failed to trigger all AI characters', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to trigger AI characters'
        });
    }
});

/**
 * AI Service health check and restart
 */
router.post('/ai/restart', authenticateAdmin, CSRFProtection.verifyToken, async (req, res) => {
    try {
        // Get AI service and restart it
        const { getInstance } = require('../services/AIContentService');
        const aiService = getInstance();

        // Shutdown current instance
        await aiService.shutdown();

        // Re-initialize (this will create a new singleton instance)
        delete require.cache[require.resolve('../services/AIContentService')];
        const { getInstance: getNewInstance } = require('../services/AIContentService');
        const newAiService = getNewInstance();

        GameLogger.info('AI service restarted', {
            admin: req.admin.username
        });

        res.json({
            success: true,
            message: 'AI service restarted successfully'
        });

    } catch (error) {
        GameLogger.error('Failed to restart AI service', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to restart AI service'
        });
    }
});

/**
 * Export AI logs
 */
router.get('/ai/export-logs', authenticateAdmin, async (req, res) => {
    try {
        const fs = require('fs');
        const archiver = require('archiver');

        const logsPath = path.join(__dirname, '../../mudlands_ai_analysis/implementation_logs');

        if (!fs.existsSync(logsPath)) {
            return res.status(404).json({
                success: false,
                message: 'AI logs directory not found'
            });
        }

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=ai_logs_${new Date().toISOString().split('T')[0]}.zip`);

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);

        // Add all log files to archive
        archive.directory(logsPath, 'ai_logs');

        await archive.finalize();

        GameLogger.info('AI logs exported', {
            admin: req.admin.username
        });

    } catch (error) {
        GameLogger.error('Failed to export AI logs', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to export logs'
        });
    }
});

/**
 * Clear AI cache
 */
router.post('/ai/clear-cache', authenticateAdmin, CSRFProtection.verifyToken, async (req, res) => {
    try {
        const { getInstance } = require('../services/AIContentService');
        const aiService = getInstance();

        // Clear the Redis cache if available
        if (aiService.cacheClient) {
            await aiService.cacheClient.flushDb();
        }

        GameLogger.info('AI cache cleared', {
            admin: req.admin.username
        });

        res.json({
            success: true,
            message: 'AI cache cleared successfully'
        });

    } catch (error) {
        GameLogger.error('Failed to clear AI cache', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to clear AI cache'
        });
    }
});

/**
 * Admin logout endpoint
 */
router.post('/logout', async (req, res) => {
    try {
        // Clear the session if it exists
        if (req.session) {
            req.session.destroy((err) => {
                if (err) {
                    console.log('Session destroy error:', err);
                }
            });
        }

        // Clear any cookies
        res.clearCookie('connect.sid');
        res.clearCookie('adminToken');

        GameLogger.info('Admin logout successful', {
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        GameLogger.error('Admin logout error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
});

// ============================================================================
// AI NPC & STORY MONITORING ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/ai-npcs/status
 * Get real-time status of all AI-controlled NPCs
 */
router.get('/ai-npcs/status', authenticateAdmin, async (req, res) => {
    try {
        const aiCharacterController = gameEngine?.aiCharacterController;

        if (!aiCharacterController) {
            return res.json({
                success: true,
                npcs: [],
                message: 'AI Character Controller not active'
            });
        }

        const statusReport = aiCharacterController.getStatusReport();

        // Enhance with location data
        const npcsWithLocations = statusReport.activeCharacters.map(npc => {
            // Find NPC in world
            let location = 'unknown';
            let roomName = 'Unknown';

            for (const [roomId, room] of Object.entries(gameEngine.world.rooms)) {
                const foundNpc = room.npcs?.find(n => n.id === npc.id);
                if (foundNpc) {
                    location = roomId;
                    roomName = room.name;
                    break;
                }
            }

            return {
                ...npc,
                location,
                roomName
            };
        });

        res.json({
            success: true,
            npcs: npcsWithLocations,
            totalStats: statusReport.totalStats,
            timestamp: Date.now()
        });

    } catch (error) {
        GameLogger.error('Failed to get AI NPC status', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve AI NPC status'
        });
    }
});

/**
 * GET /api/admin/story/state
 * Get current story evolution state
 */
router.get('/story/state', authenticateAdmin, async (req, res) => {
    try {
        const fs = require('fs');
        const storyStatePath = path.join(__dirname, '../../mudlands_ai_analysis/world_data/story_state.json');

        if (!fs.existsSync(storyStatePath)) {
            return res.json({
                success: true,
                storyState: null,
                message: 'Story state file not found'
            });
        }

        const storyState = JSON.parse(fs.readFileSync(storyStatePath, 'utf8'));

        res.json({
            success: true,
            storyState,
            timestamp: Date.now()
        });

    } catch (error) {
        GameLogger.error('Failed to get story state', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve story state'
        });
    }
});

/**
 * GET /api/admin/story/recent-events
 * Get recent story evolution events
 */
router.get('/story/recent-events', authenticateAdmin, async (req, res) => {
    try {
        const fs = require('fs');
        const storyStatePath = path.join(__dirname, '../../mudlands_ai_analysis/world_data/story_state.json');

        if (!fs.existsSync(storyStatePath)) {
            return res.json({
                success: true,
                events: [],
                message: 'Story state file not found'
            });
        }

        const storyState = JSON.parse(fs.readFileSync(storyStatePath, 'utf8'));
        const recentEvents = (storyState.world_events || []).slice(0, 10);

        res.json({
            success: true,
            events: recentEvents,
            timestamp: Date.now()
        });

    } catch (error) {
        GameLogger.error('Failed to get recent story events', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve recent events'
        });
    }
});

/**
 * GET /api/admin/ai-npcs/interactions
 * Get recent AI NPC interactions with players
 */
router.get('/ai-npcs/interactions', authenticateAdmin, async (req, res) => {
    try {
        const fs = require('fs');
        const glob = require('glob');
        const logsPath = path.join(__dirname, '../../mudlands_ai_analysis/implementation_logs');

        const interactions = [];

        // Get recent character stats files
        const statFiles = glob.sync('character_stats_*.json', { cwd: logsPath });

        for (const file of statFiles.slice(-5)) { // Last 5 files
            try {
                const filePath = path.join(logsPath, file);
                const stats = JSON.parse(fs.readFileSync(filePath, 'utf8'));

                if (stats.memory?.recentInteractions) {
                    stats.memory.recentInteractions.forEach(interaction => {
                        interactions.push({
                            character: stats.characterId || 'Unknown',
                            characterName: stats.characterName || 'Unknown NPC',
                            playerName: interaction.playerName,
                            behavior: interaction.behavior,
                            timestamp: interaction.timestamp,
                            type: 'interaction'
                        });
                    });
                }
            } catch (err) {
                // Skip invalid files
                continue;
            }
        }

        // Sort by timestamp, most recent first
        interactions.sort((a, b) => b.timestamp - a.timestamp);

        res.json({
            success: true,
            interactions: interactions.slice(0, 20), // Return last 20 interactions
            timestamp: Date.now()
        });

    } catch (error) {
        GameLogger.error('Failed to get AI NPC interactions', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve interactions'
        });
    }
});

// ============================================================================
// ITEM/WEAPON MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/items
 * Get all items from the items database
 */
router.get('/items', authenticateAdmin, async (req, res) => {
    try {
        const itemTemplates = require('../data/items');
        const items = Object.values(itemTemplates);

        res.json(items);
    } catch (error) {
        GameLogger.error('Failed to get items', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to retrieve items' });
    }
});

/**
 * POST /api/admin/items
 * Create or update an item
 */
router.post('/items', authenticateAdmin, CSRFProtection.verifyToken, async (req, res) => {
    try {
        const fs = require('fs').promises;
        const itemsPath = path.join(__dirname, '../data/items.js');

        // Read current items file
        const itemTemplates = require('../data/items');

        // Add or update the item
        const newItem = req.body;
        itemTemplates[newItem.id] = newItem;

        // Write back to file
        const fileContent = `// MUDlands Online Item Database\nconst itemTemplates = ${JSON.stringify(itemTemplates, null, 4)};\n\nmodule.exports = itemTemplates;\n`;
        await fs.writeFile(itemsPath, fileContent, 'utf8');

        // Clear require cache to reload the module
        delete require.cache[require.resolve('../data/items')];

        GameLogger.info('Item saved', { itemId: newItem.id, admin: req.admin.username });
        res.json({ success: true, message: 'Item saved successfully', item: newItem });
    } catch (error) {
        GameLogger.error('Failed to save item', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to save item' });
    }
});

/**
 * DELETE /api/admin/items/:id
 * Delete an item
 */
router.delete('/items/:id', authenticateAdmin, CSRFProtection.verifyToken, async (req, res) => {
    try {
        const fs = require('fs').promises;
        const itemsPath = path.join(__dirname, '../data/items.js');
        const itemTemplates = require('../data/items');

        const itemId = req.params.id;
        if (!itemTemplates[itemId]) {
            return res.status(404).json({ success: false, error: 'Item not found' });
        }

        delete itemTemplates[itemId];

        const fileContent = `// MUDlands Online Item Database\nconst itemTemplates = ${JSON.stringify(itemTemplates, null, 4)};\n\nmodule.exports = itemTemplates;\n`;
        await fs.writeFile(itemsPath, fileContent, 'utf8');
        delete require.cache[require.resolve('../data/items')];

        GameLogger.info('Item deleted', { itemId, admin: req.admin.username });
        res.json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
        GameLogger.error('Failed to delete item', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to delete item' });
    }
});

// ============================================================================
// MONSTER MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/monsters
 * Get all monster templates
 */
router.get('/monsters', authenticateAdmin, async (req, res) => {
    try {
        const monstersPath = path.join(__dirname, '../data/monsters.js');
        const fs = require('fs');

        // Check if monsters file exists
        if (!fs.existsSync(monstersPath)) {
            return res.json([]);
        }

        const monsterTemplates = require('../data/monsters');
        const monsters = Object.values(monsterTemplates);

        res.json(monsters);
    } catch (error) {
        GameLogger.error('Failed to get monsters', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to retrieve monsters' });
    }
});

/**
 * POST /api/admin/monsters
 * Create or update a monster
 */
router.post('/monsters', authenticateAdmin, CSRFProtection.verifyToken, async (req, res) => {
    try {
        const fs = require('fs').promises;
        const fsSync = require('fs');
        const monstersPath = path.join(__dirname, '../data/monsters.js');

        let monsterTemplates = {};

        // Read current monsters file if it exists
        if (fsSync.existsSync(monstersPath)) {
            monsterTemplates = require('../data/monsters');
        }

        // Add or update the monster
        const newMonster = req.body;
        monsterTemplates[newMonster.type] = newMonster;

        // Write back to file
        const fileContent = `// MUDlands Online Monster Database\nconst monsterTemplates = ${JSON.stringify(monsterTemplates, null, 4)};\n\nmodule.exports = monsterTemplates;\n`;
        await fs.writeFile(monstersPath, fileContent, 'utf8');

        // Clear require cache to reload the module
        delete require.cache[require.resolve('../data/monsters')];

        GameLogger.info('Monster saved', { monsterType: newMonster.type, admin: req.admin.username });
        res.json({ success: true, message: 'Monster saved successfully', monster: newMonster });
    } catch (error) {
        GameLogger.error('Failed to save monster', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to save monster' });
    }
});

/**
 * DELETE /api/admin/monsters/:type
 * Delete a monster
 */
router.delete('/monsters/:type', authenticateAdmin, CSRFProtection.verifyToken, async (req, res) => {
    try {
        const fs = require('fs').promises;
        const monstersPath = path.join(__dirname, '../data/monsters.js');
        const monsterTemplates = require('../data/monsters');

        const monsterType = req.params.type;
        if (!monsterTemplates[monsterType]) {
            return res.status(404).json({ success: false, error: 'Monster not found' });
        }

        delete monsterTemplates[monsterType];

        const fileContent = `// MUDlands Online Monster Database\nconst monsterTemplates = ${JSON.stringify(monsterTemplates, null, 4)};\n\nmodule.exports = monsterTemplates;\n`;
        await fs.writeFile(monstersPath, fileContent, 'utf8');
        delete require.cache[require.resolve('../data/monsters')];

        GameLogger.info('Monster deleted', { monsterType, admin: req.admin.username });
        res.json({ success: true, message: 'Monster deleted successfully' });
    } catch (error) {
        GameLogger.error('Failed to delete monster', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to delete monster' });
    }
});

// ============================================================================
// ROOM/WORLD MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/rooms
 * Get all rooms from the world
 */
router.get('/rooms', authenticateAdmin, async (req, res) => {
    try {
        const rooms = gameEngine.world.getAllRooms();
        const roomData = Array.from(rooms.values()).map(room => room.toJSON());

        res.json(roomData);
    } catch (error) {
        GameLogger.error('Failed to get rooms', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to retrieve rooms' });
    }
});

/**
 * POST /api/admin/rooms
 * Create or update a room
 */
router.post('/rooms', authenticateAdmin, CSRFProtection.verifyToken, async (req, res) => {
    try {
        const fs = require('fs').promises;
        const worldPath = path.join(__dirname, '../data/world.json');

        // Read current world.json
        const worldData = JSON.parse(await fs.readFile(worldPath, 'utf8'));

        const newRoom = req.body;

        // Find and update or add room
        const roomIndex = worldData.rooms.findIndex(r => r.id === newRoom.id);
        if (roomIndex >= 0) {
            worldData.rooms[roomIndex] = newRoom;
        } else {
            worldData.rooms.push(newRoom);
        }

        // Write back to file
        await fs.writeFile(worldPath, JSON.stringify(worldData, null, 2), 'utf8');

        // Reload world in game engine
        gameEngine.world.loadWorldFromFile();

        GameLogger.info('Room saved', { roomId: newRoom.id, admin: req.admin.username });
        res.json({ success: true, message: 'Room saved successfully', room: newRoom });
    } catch (error) {
        GameLogger.error('Failed to save room', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to save room' });
    }
});

/**
 * DELETE /api/admin/rooms/:id
 * Delete a room
 */
router.delete('/rooms/:id', authenticateAdmin, CSRFProtection.verifyToken, async (req, res) => {
    try {
        const fs = require('fs').promises;
        const worldPath = path.join(__dirname, '../data/world.json');
        const worldData = JSON.parse(await fs.readFile(worldPath, 'utf8'));

        const roomId = req.params.id;
        const roomIndex = worldData.rooms.findIndex(r => r.id === roomId);

        if (roomIndex < 0) {
            return res.status(404).json({ success: false, error: 'Room not found' });
        }

        worldData.rooms.splice(roomIndex, 1);

        await fs.writeFile(worldPath, JSON.stringify(worldData, null, 2), 'utf8');
        gameEngine.world.loadWorldFromFile();

        GameLogger.info('Room deleted', { roomId, admin: req.admin.username });
        res.json({ success: true, message: 'Room deleted successfully' });
    } catch (error) {
        GameLogger.error('Failed to delete room', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to delete room' });
    }
});

    return router;
}

module.exports = createAdminRouter;