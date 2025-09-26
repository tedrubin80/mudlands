const express = require('express');
const router = express.Router();
const { getInstance: getAIService } = require('../services/AIContentService');
const NPCFactory = require('../services/NPCFactory');
const GameLogger = require('../utils/logger');

// Middleware to check if AI is enabled
const requireAI = (req, res, next) => {
    const aiService = getAIService();
    if (!aiService.enabled) {
        return res.status(503).json({
            error: 'AI services are disabled',
            message: 'Set AI_ENABLED=true in .env to enable AI features'
        });
    }
    next();
};

// AI Health Check
router.get('/health', async (req, res) => {
    try {
        const aiService = getAIService();
        const health = await aiService.healthCheck();
        
        const status = health.ollamaConnected && health.circuitState === 'CLOSED' ? 'healthy' : 'degraded';
        const statusCode = status === 'healthy' ? 200 : 503;
        
        res.status(statusCode).json({
            status,
            timestamp: new Date().toISOString(),
            services: {
                ollama: {
                    connected: health.ollamaConnected,
                    status: health.ollamaConnected ? 'up' : 'down'
                },
                redis: {
                    connected: health.cacheConnected,
                    status: health.cacheConnected ? 'up' : 'down'
                }
            },
            circuit_breaker: {
                state: health.circuitState,
                failure_count: health.failureCount
            },
            performance: {
                queue_size: health.queueSize,
                request_count: health.requestCount
            },
            configuration: {
                enabled: health.enabled,
                model: process.env.OLLAMA_MODEL,
                timeout: process.env.AI_REQUEST_TIMEOUT,
                rate_limit: process.env.AI_RATE_LIMIT_PER_MINUTE
            }
        });
    } catch (error) {
        GameLogger.error('AI health check failed', error);
        res.status(500).json({
            status: 'error',
            message: 'Health check failed',
            error: error.message
        });
    }
});

// AI Status Dashboard
router.get('/status', requireAI, async (req, res) => {
    try {
        const aiService = getAIService();
        const health = await aiService.healthCheck();
        
        // Get system stats
        const stats = {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            timestamp: new Date().toISOString()
        };
        
        res.json({
            ai_service: health,
            system: stats,
            environment: {
                node_version: process.version,
                platform: process.platform,
                arch: process.arch
            }
        });
    } catch (error) {
        GameLogger.error('AI status check failed', error);
        res.status(500).json({
            error: 'Status check failed',
            message: error.message
        });
    }
});

// Test AI Generation
router.post('/test/generate', requireAI, async (req, res) => {
    try {
        const { type = 'npc', ...params } = req.body;
        const aiService = getAIService();
        
        let result;
        const startTime = Date.now();
        
        switch (type) {
            case 'npc':
                result = await aiService.generateNPC(
                    params.location || 'test location',
                    params.npcType || 'commoner',
                    params.importance || 'minor',
                    params.context || 'test generation'
                );
                break;
                
            case 'quest':
                result = await aiService.generateQuest(
                    params.level || 1,
                    params.questType || 'fetch',
                    params.location || 'test location',
                    params.difficulty || 'easy'
                );
                break;
                
            case 'monster':
                result = await aiService.generateMonster(
                    params.cr || 1,
                    params.environment || 'forest',
                    params.monsterType || 'beast',
                    params.role || 'solo'
                );
                break;
                
            case 'item':
                result = await aiService.generateItem(
                    params.rarity || 'common',
                    params.itemType || 'weapon',
                    params.level || 1,
                    params.theme || 'standard'
                );
                break;
                
            case 'room':
                result = await aiService.enhanceRoomDescription(
                    params.name || 'Test Room',
                    params.roomType || 'indoor',
                    params.state || {},
                    params.timeOfDay || 'day',
                    params.weather || 'clear',
                    params.events || []
                );
                break;
                
            default:
                return res.status(400).json({
                    error: 'Invalid generation type',
                    valid_types: ['npc', 'quest', 'monster', 'item', 'room']
                });
        }
        
        const duration = Date.now() - startTime;
        
        res.json({
            success: true,
            type,
            duration_ms: duration,
            result,
            generated_at: new Date().toISOString()
        });
        
    } catch (error) {
        GameLogger.error('AI test generation failed', error);
        res.status(500).json({
            success: false,
            error: error.message,
            type: req.body.type
        });
    }
});

// Test NPC Factory
router.post('/test/npc-factory', requireAI, async (req, res) => {
    try {
        const {
            location = 'Test Location',
            type = 'merchant',
            useAI = true,
            count = 1
        } = req.body;
        
        const factory = new NPCFactory();
        const startTime = Date.now();
        
        let npcs;
        if (count > 1) {
            npcs = await factory.generateNPCGroup(count, {
                location,
                type,
                useAI,
                importance: 'minor'
            });
        } else {
            const npc = await factory.generateNPC({
                location,
                type,
                useAI,
                importance: 'major'
            });
            npcs = [npc];
        }
        
        const duration = Date.now() - startTime;
        
        // Simplify NPCs for response
        const simplifiedNPCs = npcs.map(npc => ({
            name: npc.name,
            race: npc.race,
            identity: npc.personality.identity,
            greeting: npc.speech.greeting,
            knowledge_topics: npc.knowledge.topics,
            ai_generated: npc.aiGenerated || false
        }));
        
        res.json({
            success: true,
            count: npcs.length,
            duration_ms: duration,
            npcs: simplifiedNPCs,
            generated_at: new Date().toISOString()
        });
        
    } catch (error) {
        GameLogger.error('NPC Factory test failed', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Cache Statistics
router.get('/cache/stats', requireAI, async (req, res) => {
    try {
        const aiService = getAIService();
        
        if (!aiService.cacheClient) {
            return res.json({
                cache_enabled: false,
                message: 'Redis cache not available'
            });
        }
        
        // This would require Redis INFO command implementation
        // For now, return basic status
        res.json({
            cache_enabled: true,
            connected: aiService.cacheClient.isReady,
            ttl: process.env.AI_CACHE_TTL || 3600,
            message: 'Cache statistics would require Redis INFO implementation'
        });
        
    } catch (error) {
        GameLogger.error('Cache stats failed', error);
        res.status(500).json({
            error: 'Failed to get cache statistics',
            message: error.message
        });
    }
});

// Clear Cache (Admin only)
router.delete('/cache', requireAI, async (req, res) => {
    try {
        const aiService = getAIService();
        
        if (!aiService.cacheClient) {
            return res.status(503).json({
                error: 'Cache not available'
            });
        }
        
        // This would need proper implementation
        res.json({
            success: true,
            message: 'Cache clear would be implemented here'
        });
        
    } catch (error) {
        GameLogger.error('Cache clear failed', error);
        res.status(500).json({
            error: 'Failed to clear cache',
            message: error.message
        });
    }
});

// AI Configuration
router.get('/config', (req, res) => {
    res.json({
        enabled: process.env.AI_ENABLED === 'true',
        model: process.env.OLLAMA_MODEL,
        host: process.env.OLLAMA_HOST,
        timeout: parseInt(process.env.AI_REQUEST_TIMEOUT),
        rate_limit: parseInt(process.env.AI_RATE_LIMIT_PER_MINUTE),
        cache_ttl: parseInt(process.env.AI_CACHE_TTL),
        fallback_enabled: process.env.AI_FALLBACK_TO_STATIC !== 'false',
        queue_max_size: parseInt(process.env.AI_QUEUE_MAX_SIZE)
    });
});

// AI Character Activation Endpoints (for the auto-character scheduler)

// Activate AI Character
router.post('/characters/activate', async (req, res) => {
    try {
        const { characterId, behavior, duration, event } = req.body;

        if (!characterId) {
            return res.status(400).json({
                success: false,
                message: 'Character ID is required'
            });
        }

        GameLogger.info('AI Character activation request', {
            characterId,
            behavior,
            duration,
            hasEvent: !!event
        });

        // Get game engine instance if available
        const gameEngine = req.app.get('gameEngine'); // We'll need to set this in server.js

        if (gameEngine && gameEngine.aiCharacterController) {
            // Use the existing AI Character Controller
            const success = await gameEngine.aiCharacterController.activateCharacter(
                characterId,
                behavior,
                duration,
                event
            );

            if (success) {
                res.json({
                    success: true,
                    message: `Character ${characterId} activated with behavior: ${behavior}`,
                    characterId,
                    behavior,
                    duration,
                    activatedAt: new Date().toISOString()
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: `Character ${characterId} not found or activation failed`
                });
            }
        } else {
            // Fallback: Log the activation but don't actually activate
            GameLogger.warn('AI Character Controller not available, logging activation only', {
                characterId,
                behavior
            });

            res.json({
                success: true,
                message: `Character activation logged (controller not available): ${characterId}`,
                characterId,
                behavior,
                duration,
                activatedAt: new Date().toISOString(),
                warning: 'AI Character Controller not initialized'
            });
        }

    } catch (error) {
        GameLogger.error('AI Character activation failed', {
            error: error.message,
            characterId: req.body.characterId
        });
        res.status(500).json({
            success: false,
            message: 'Character activation failed',
            error: error.message
        });
    }
});

// Deactivate AI Character
router.post('/characters/deactivate', async (req, res) => {
    try {
        const { characterId, sessionData } = req.body;

        if (!characterId) {
            return res.status(400).json({
                success: false,
                message: 'Character ID is required'
            });
        }

        GameLogger.info('AI Character deactivation request', {
            characterId,
            sessionDuration: sessionData?.duration
        });

        // Get game engine instance if available
        const gameEngine = req.app.get('gameEngine');

        if (gameEngine && gameEngine.aiCharacterController) {
            // Use the existing AI Character Controller
            await gameEngine.aiCharacterController.deactivateCharacter(characterId);

            res.json({
                success: true,
                message: `Character ${characterId} deactivated`,
                characterId,
                deactivatedAt: new Date().toISOString(),
                sessionData
            });
        } else {
            // Fallback: Log the deactivation
            GameLogger.warn('AI Character Controller not available, logging deactivation only', {
                characterId
            });

            res.json({
                success: true,
                message: `Character deactivation logged (controller not available): ${characterId}`,
                characterId,
                deactivatedAt: new Date().toISOString(),
                warning: 'AI Character Controller not initialized'
            });
        }

    } catch (error) {
        GameLogger.error('AI Character deactivation failed', {
            error: error.message,
            characterId: req.body.characterId
        });
        res.status(500).json({
            success: false,
            message: 'Character deactivation failed',
            error: error.message
        });
    }
});

// Story Event Processing
router.post('/story/event', async (req, res) => {
    try {
        const event = req.body;

        GameLogger.info('Story event received', {
            type: event.type,
            description: event.description,
            impact: event.impact,
            participants: event.participants
        });

        // Get game engine instance if available
        const gameEngine = req.app.get('gameEngine');

        if (gameEngine && gameEngine.aiCharacterController) {
            // Process the story event through the AI Character Controller
            await gameEngine.aiCharacterController.handleStoryEvent(event);

            res.json({
                success: true,
                message: 'Story event processed',
                event: {
                    type: event.type,
                    description: event.description,
                    processedAt: new Date().toISOString()
                }
            });
        } else {
            // Fallback: Log the event
            GameLogger.warn('AI Character Controller not available, logging story event only', event);

            res.json({
                success: true,
                message: 'Story event logged (controller not available)',
                event: {
                    ...event,
                    processedAt: new Date().toISOString()
                },
                warning: 'AI Character Controller not initialized'
            });
        }

    } catch (error) {
        GameLogger.error('Story event processing failed', {
            error: error.message,
            event: req.body
        });
        res.status(500).json({
            success: false,
            message: 'Story event processing failed',
            error: error.message
        });
    }
});

// Get AI Character Status
router.get('/characters/status', async (req, res) => {
    try {
        const gameEngine = req.app.get('gameEngine');

        if (gameEngine && gameEngine.aiCharacterController) {
            const report = gameEngine.aiCharacterController.getStatusReport();

            res.json({
                success: true,
                report,
                timestamp: new Date().toISOString()
            });
        } else {
            res.json({
                success: true,
                report: {
                    activeCharacters: [],
                    totalStats: {
                        activations: 0,
                        interactions: 0,
                        questsGiven: 0,
                        storiesShared: 0
                    }
                },
                timestamp: new Date().toISOString(),
                warning: 'AI Character Controller not initialized'
            });
        }

    } catch (error) {
        GameLogger.error('AI Character status failed', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to get character status',
            error: error.message
        });
    }
});

module.exports = router;