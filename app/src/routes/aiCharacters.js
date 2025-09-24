/**
 * AI Characters API Routes
 * Handles automated character activation and management
 */

const express = require('express');
const router = express.Router();
const AICharacterController = require('../services/AICharacterController');

// Initialize AI controller (this should be done in server.js)
let aiController = null;

// Initialize AI controller
function initializeAI(world, socketHandler) {
    aiController = new AICharacterController(world, socketHandler);
    return aiController;
}

// Middleware to ensure AI controller is initialized
const requireAI = (req, res, next) => {
    if (!aiController) {
        return res.status(500).json({
            success: false,
            message: 'AI Character Controller not initialized'
        });
    }
    next();
};

// Activate AI character
router.post('/activate', requireAI, async (req, res) => {
    try {
        const { characterId, behavior, duration, event } = req.body;

        if (!characterId || !behavior || !duration) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters: characterId, behavior, duration'
            });
        }

        const success = await aiController.activateCharacter(characterId, behavior, duration, event);

        res.json({
            success: success,
            message: success ? 'Character activated successfully' : 'Failed to activate character',
            data: {
                characterId,
                behavior,
                duration,
                event: event || null
            }
        });

    } catch (error) {
        console.error('Error activating AI character:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Deactivate AI character
router.post('/deactivate', requireAI, async (req, res) => {
    try {
        const { characterId, sessionData } = req.body;

        if (!characterId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameter: characterId'
            });
        }

        aiController.deactivateCharacter(characterId);

        res.json({
            success: true,
            message: 'Character deactivated successfully',
            sessionData: sessionData
        });

    } catch (error) {
        console.error('Error deactivating AI character:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Handle story events
router.post('/story-event', requireAI, async (req, res) => {
    try {
        const event = req.body;

        if (!event.type || !event.description) {
            return res.status(400).json({
                success: false,
                message: 'Missing required event data: type, description'
            });
        }

        aiController.handleStoryEvent(event);

        res.json({
            success: true,
            message: 'Story event processed successfully',
            event: event
        });

    } catch (error) {
        console.error('Error processing story event:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get AI status
router.get('/status', requireAI, (req, res) => {
    try {
        const status = aiController.getStatusReport();

        res.json({
            success: true,
            data: status
        });

    } catch (error) {
        console.error('Error getting AI status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// List available AI characters
router.get('/available', requireAI, (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');

        const activeDir = '/var/www/mudlands.online/app/mudlands_ai_analysis/character_profiles/auto_players/active';

        if (!fs.existsSync(activeDir)) {
            return res.json({
                success: true,
                data: { characters: [] }
            });
        }

        const files = fs.readdirSync(activeDir);
        const characters = [];

        for (const file of files) {
            if (file.endsWith('.json')) {
                const charData = JSON.parse(fs.readFileSync(path.join(activeDir, file), 'utf8'));
                characters.push({
                    id: charData.metadata.character_id,
                    name: charData.character_data.name,
                    title: charData.character_data.title,
                    faction: charData.character_data.faction_allegiance,
                    status: charData.metadata.status
                });
            }
        }

        res.json({
            success: true,
            data: { characters }
        });

    } catch (error) {
        console.error('Error listing AI characters:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Manually trigger AI cycle
router.post('/trigger-cycle', requireAI, async (req, res) => {
    try {
        // This would typically call the scheduler's runCycle method
        // For now, we'll just activate a random character as a test

        const period = req.body.period || 'manual';
        const intensity = req.body.intensity || 'moderate';

        res.json({
            success: true,
            message: 'AI cycle triggered successfully',
            data: { period, intensity }
        });

    } catch (error) {
        console.error('Error triggering AI cycle:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Load character from AI analysis
router.post('/load-from-ai', requireAI, async (req, res) => {
    try {
        const { characterId } = req.body;

        if (!characterId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameter: characterId'
            });
        }

        // Load character configuration from analysis files
        const fs = require('fs');
        const path = require('path');

        // Check different directories
        const searchDirs = [
            '/var/www/mudlands.online/app/mudlands_ai_analysis/character_profiles/manual_test_queue/ready_for_testing',
            '/var/www/mudlands.online/app/mudlands_ai_analysis/character_profiles/manual_test_queue/approved_for_auto',
            '/var/www/mudlands.online/app/mudlands_ai_analysis/character_profiles/auto_players/active'
        ];

        let characterConfig = null;
        let foundInDir = null;

        for (const dir of searchDirs) {
            const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

            for (const file of files) {
                const config = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
                if (config.metadata.character_id === characterId) {
                    characterConfig = config;
                    foundInDir = dir;
                    break;
                }
            }

            if (characterConfig) break;
        }

        if (!characterConfig) {
            return res.status(404).json({
                success: false,
                message: 'Character not found'
            });
        }

        // Register character with AI controller
        aiController.registerAICharacter(characterConfig);

        res.json({
            success: true,
            message: 'Character loaded successfully',
            data: {
                characterId: characterConfig.metadata.character_id,
                name: characterConfig.character_data.name,
                source: foundInDir.split('/').pop()
            }
        });

    } catch (error) {
        console.error('Error loading character from AI:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Update character status
router.put('/:id/status', requireAI, async (req, res) => {
    try {
        const characterId = req.params.id;
        const { status, notes } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameter: status'
            });
        }

        // Update character file status
        const fs = require('fs');
        const path = require('path');

        // Find character file
        const searchDirs = [
            '/var/www/mudlands.online/app/mudlands_ai_analysis/character_profiles/manual_test_queue/ready_for_testing',
            '/var/www/mudlands.online/app/mudlands_ai_analysis/character_profiles/manual_test_queue/currently_testing',
            '/var/www/mudlands.online/app/mudlands_ai_analysis/character_profiles/manual_test_queue/approved_for_auto'
        ];

        let characterFile = null;
        let characterConfig = null;

        for (const dir of searchDirs) {
            if (!fs.existsSync(dir)) continue;

            const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

            for (const file of files) {
                const config = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
                if (config.metadata.character_id === characterId) {
                    characterFile = path.join(dir, file);
                    characterConfig = config;
                    break;
                }
            }

            if (characterConfig) break;
        }

        if (!characterConfig) {
            return res.status(404).json({
                success: false,
                message: 'Character not found'
            });
        }

        // Update status
        characterConfig.metadata.status = status;
        characterConfig.metadata.last_updated = new Date().toISOString();

        if (notes) {
            characterConfig.metadata.testing_notes = notes;
        }

        // Save updated config
        fs.writeFileSync(characterFile, JSON.stringify(characterConfig, null, 2));

        res.json({
            success: true,
            message: 'Character status updated successfully',
            data: {
                characterId,
                status,
                updated: characterConfig.metadata.last_updated
            }
        });

    } catch (error) {
        console.error('Error updating character status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Enable character for auto-play
router.post('/:id/enable-auto', requireAI, async (req, res) => {
    try {
        const characterId = req.params.id;

        const fs = require('fs');
        const path = require('path');

        // Find character in approved_for_auto
        const approvedDir = '/var/www/mudlands.online/app/mudlands_ai_analysis/character_profiles/manual_test_queue/approved_for_auto';
        const activeDir = '/var/www/mudlands.online/app/mudlands_ai_analysis/character_profiles/auto_players/active';

        if (!fs.existsSync(approvedDir) || !fs.existsSync(activeDir)) {
            return res.status(500).json({
                success: false,
                message: 'Auto-player directories not configured'
            });
        }

        const files = fs.readdirSync(approvedDir).filter(f => f.endsWith('.json'));
        let characterFile = null;

        for (const file of files) {
            const config = JSON.parse(fs.readFileSync(path.join(approvedDir, file), 'utf8'));
            if (config.metadata.character_id === characterId) {
                characterFile = file;
                break;
            }
        }

        if (!characterFile) {
            return res.status(404).json({
                success: false,
                message: 'Character not found in approved queue'
            });
        }

        // Move character to active auto-players
        const sourcePath = path.join(approvedDir, characterFile);
        const targetPath = path.join(activeDir, characterFile);

        fs.renameSync(sourcePath, targetPath);

        // Update status in moved file
        const config = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
        config.metadata.status = 'active_auto_player';
        config.metadata.auto_enabled_date = new Date().toISOString();
        fs.writeFileSync(targetPath, JSON.stringify(config, null, 2));

        // Register with AI controller
        aiController.registerAICharacter(config);

        res.json({
            success: true,
            message: 'Character enabled for auto-play successfully',
            data: {
                characterId,
                enabled: config.metadata.auto_enabled_date
            }
        });

    } catch (error) {
        console.error('Error enabling character for auto-play:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

module.exports = { router, initializeAI };