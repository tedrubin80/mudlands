#!/usr/bin/env node

/**
 * Mudlands Auto Character Scheduler
 * Manages automated NPC activities and story evolution
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuration
const CONFIG = {
    baseDir: '/var/www/mudlands.online/app/mudlands_ai_analysis',
    serverUrl: 'http://localhost:3000',
    logFile: '/var/www/mudlands.online/app/mudlands_ai_analysis/implementation_logs/auto_character.log',

    // Schedule configuration (24-hour format)
    schedules: {
        morning: { start: '06:00', end: '10:00', intensity: 'moderate' },
        midday: { start: '11:00', end: '14:00', intensity: 'low' },
        evening: { start: '18:00', end: '22:00', intensity: 'high' },
        night: { start: '23:00', end: '02:00', intensity: 'mysterious' }
    },

    // Maximum concurrent auto-characters
    maxConcurrent: 5,

    // Activity duration in minutes
    sessionDuration: {
        min: 15,
        max: 45
    }
};

// Random event templates for story evolution
const STORY_EVENTS = {
    political: [
        { type: 'debate', description: 'Public debate about restoration vs adaptation', participants: ['elder_thaddeus', 'grizelda_ironfoot'], impact: 'faction_tension' },
        { type: 'announcement', description: 'New town decree about Beast-kin rights', participants: ['elder_thaddeus'], impact: 'beast_kin_relations' },
        { type: 'protest', description: 'Citizens protest council decisions', participants: ['town_guard'], impact: 'civil_unrest' }
    ],

    religious: [
        { type: 'vision', description: 'Sister Morwyn receives cryptic vision about the Forgotten', participants: ['sister_morwyn'], impact: 'mystery_deepens' },
        { type: 'pilgrimage', description: 'Religious pilgrims arrive seeking the shrine', participants: ['sister_morwyn'], impact: 'new_questline' },
        { type: 'miracle', description: 'Unexplained healing at the shrine', participants: ['sister_morwyn'], impact: 'faith_increase' }
    ],

    shadowblight: [
        { type: 'outbreak', description: 'New Shadowblight symptoms appear in farmlands', participants: ['veiled_scholar', 'elder_thaddeus'], impact: 'corruption_spreads' },
        { type: 'discovery', description: 'Strange artifact found with corruption properties', participants: ['veiled_scholar'], impact: 'hidden_agenda' },
        { type: 'infection', description: 'NPC shows early signs of corruption', participants: ['sister_morwyn'], impact: 'urgency_increases' }
    ],

    beast_kin: [
        { type: 'meeting', description: 'Secret Beast-kin gathering in the forest', participants: ['razorclaw'], impact: 'faction_organizing' },
        { type: 'incident', description: 'Confrontation between Beast-kin and townspeople', participants: ['razorclaw', 'town_guard'], impact: 'tension_rises' },
        { type: 'trade', description: 'Beast-kin merchants attempt to enter town', participants: ['razorclaw', 'merchant_elena'], impact: 'economic_opportunity' }
    ],

    exploration: [
        { type: 'discovery', description: 'New pre-Sundering ruins discovered', participants: ['grizelda_ironfoot'], impact: 'new_dungeon' },
        { type: 'warning', description: 'Miners report strange sounds from deep tunnels', participants: ['grizelda_ironfoot'], impact: 'mystery_quest' },
        { type: 'breakthrough', description: 'Ancient technology partially restored', participants: ['grizelda_ironfoot', 'veiled_scholar'], impact: 'tech_advancement' }
    ],

    social: [
        { type: 'festival', description: 'Town celebrates harvest festival', participants: ['innkeeper_sarah', 'bard_lyanna'], impact: 'morale_boost' },
        { type: 'rumor', description: 'Mysterious stranger arrives with troubling news', participants: ['merchant_elena', 'innkeeper_sarah'], impact: 'new_information' },
        { type: 'rivalry', description: 'Competition between merchants escalates', participants: ['merchant_elena'], impact: 'economic_conflict' }
    ]
};

// Character behavior profiles based on time and context
const BEHAVIOR_PATTERNS = {
    morning: {
        elder_thaddeus: ['council_meeting', 'town_inspection', 'citizen_audiences'],
        sister_morwyn: ['morning_prayers', 'healing_services', 'shrine_maintenance'],
        razorclaw: ['hunting', 'territory_patrol', 'forest_reconnaissance'],
        veiled_scholar: ['artifact_study', 'research', 'visitor_consultations'],
        grizelda_ironfoot: ['mine_inspection', 'worker_briefing', 'equipment_check']
    },

    evening: {
        elder_thaddeus: ['private_meetings', 'document_review', 'memorial_visits'],
        sister_morwyn: ['evening_vespers', 'mystical_meditation', 'vision_seeking'],
        razorclaw: ['beast_kin_meetings', 'night_hunting', 'boundary_marking'],
        veiled_scholar: ['secret_rituals', 'corruption_experiments', 'cult_communications'],
        grizelda_ironfoot: ['tavern_socializing', 'trade_negotiations', 'story_sharing']
    },

    night: {
        elder_thaddeus: ['insomnia_walks', 'secret_correspondence', 'nightmare_memories'],
        sister_morwyn: ['divine_communion', 'prophecy_study', 'forgotten_prayers'],
        razorclaw: ['pack_howling', 'wilderness_patrol', 'beast_kin_protection'],
        veiled_scholar: ['shadowblight_rituals', 'artifact_corruption', 'cult_recruitment'],
        grizelda_ironfoot: ['deep_mine_exploration', 'ancient_texts_study', 'dwarf_ceremonies']
    }
};

class AutoCharacterScheduler {
    constructor() {
        this.activeCharacters = new Map();
        this.storyState = this.loadStoryState();
        this.eventHistory = [];
    }

    // Load current story state from file
    loadStoryState() {
        const stateFile = path.join(CONFIG.baseDir, 'world_data', 'story_state.json');
        if (fs.existsSync(stateFile)) {
            return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        }
        return {
            day: 1,
            faction_tensions: {
                restoration_vs_adaptation: 50,
                human_vs_beastkin: 60,
                trust_in_council: 70,
                shadowblight_awareness: 20
            },
            active_plots: [],
            world_events: [],
            character_relationships: {}
        };
    }

    // Save story state
    saveStoryState() {
        const stateFile = path.join(CONFIG.baseDir, 'world_data', 'story_state.json');
        fs.writeFileSync(stateFile, JSON.stringify(this.storyState, null, 2));
    }

    // Log activity
    log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level}] ${message}\n`;
        fs.appendFileSync(CONFIG.logFile, logMessage);
        console.log(logMessage.trim());
    }

    // Get current time period
    getCurrentPeriod() {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        for (const [period, schedule] of Object.entries(CONFIG.schedules)) {
            if (this.isTimeInRange(currentTime, schedule.start, schedule.end)) {
                return { name: period, intensity: schedule.intensity };
            }
        }
        return { name: 'idle', intensity: 'none' };
    }

    // Check if time is in range (handles overnight ranges)
    isTimeInRange(current, start, end) {
        if (start <= end) {
            return current >= start && current <= end;
        } else {
            return current >= start || current <= end;
        }
    }

    // Select random characters for activation
    selectActiveCharacters(period) {
        const availableCharacters = this.getAvailableCharacters();
        const numToActivate = Math.min(
            Math.floor(Math.random() * CONFIG.maxConcurrent) + 1,
            availableCharacters.length
        );

        const selected = [];
        const shuffled = availableCharacters.sort(() => Math.random() - 0.5);

        for (let i = 0; i < numToActivate; i++) {
            const char = shuffled[i];
            // Weight selection based on story relevance
            if (this.shouldActivateCharacter(char, period)) {
                selected.push(char);
            }
        }

        return selected;
    }

    // Determine if character should be activated based on story context
    shouldActivateCharacter(character, period) {
        const charId = character.character_id;

        // Check if character is relevant to current story tensions
        if (charId === 'elder_thaddeus_001' && this.storyState.faction_tensions.trust_in_council < 50) {
            return true; // More active when trust is low
        }

        if (charId === 'razorclaw_001' && this.storyState.faction_tensions.human_vs_beastkin > 70) {
            return true; // More active during high tensions
        }

        if (charId === 'veiled_scholar_001' && period.name === 'night') {
            return Math.random() > 0.3; // More likely at night
        }

        // Default random chance
        return Math.random() > 0.4;
    }

    // Get list of available characters
    getAvailableCharacters() {
        const activeDir = path.join(CONFIG.baseDir, 'character_profiles', 'auto_players', 'active');
        if (!fs.existsSync(activeDir)) {
            return [];
        }

        const characters = [];
        const files = fs.readdirSync(activeDir);

        for (const file of files) {
            if (file.endsWith('.json')) {
                const charData = JSON.parse(fs.readFileSync(path.join(activeDir, file), 'utf8'));
                if (!this.activeCharacters.has(charData.metadata.character_id)) {
                    characters.push(charData);
                }
            }
        }

        return characters;
    }

    // Generate random story event
    generateRandomEvent(period) {
        const eventCategories = Object.keys(STORY_EVENTS);

        // Weight event selection based on current tensions
        const weights = {
            political: this.storyState.faction_tensions.restoration_vs_adaptation / 100,
            religious: 0.3,
            shadowblight: this.storyState.faction_tensions.shadowblight_awareness / 100,
            beast_kin: this.storyState.faction_tensions.human_vs_beastkin / 100,
            exploration: 0.4,
            social: period.intensity === 'high' ? 0.6 : 0.3
        };

        // Select category based on weights
        const category = this.weightedRandomSelect(eventCategories, weights);
        const events = STORY_EVENTS[category];
        const event = events[Math.floor(Math.random() * events.length)];

        return {
            ...event,
            category,
            timestamp: new Date().toISOString(),
            period: period.name
        };
    }

    // Weighted random selection
    weightedRandomSelect(items, weights) {
        const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;

        for (const item of items) {
            random -= weights[item] || 0.1;
            if (random <= 0) {
                return item;
            }
        }

        return items[items.length - 1];
    }

    // Execute character behavior
    async activateCharacter(character, period, event = null) {
        const charId = character.metadata.character_id;
        const charName = character.character_data.name;

        this.log(`Activating ${charName} during ${period.name} period`);

        // Determine behavior based on period and event
        const behaviors = BEHAVIOR_PATTERNS[period.name] || BEHAVIOR_PATTERNS.morning;
        const charBehaviors = behaviors[charId.split('_')[0]] || ['idle_activity'];
        const selectedBehavior = charBehaviors[Math.floor(Math.random() * charBehaviors.length)];

        // Create session data
        const session = {
            characterId: charId,
            characterName: charName,
            startTime: new Date(),
            period: period.name,
            behavior: selectedBehavior,
            event: event,
            duration: Math.floor(Math.random() * (CONFIG.sessionDuration.max - CONFIG.sessionDuration.min)) + CONFIG.sessionDuration.min
        };

        this.activeCharacters.set(charId, session);

        // Send activation command to game server
        try {
            await this.sendToGameServer('characters/activate', {
                characterId: charId,
                behavior: selectedBehavior,
                duration: session.duration,
                event: event
            });

            // Schedule deactivation
            setTimeout(() => this.deactivateCharacter(charId), session.duration * 60 * 1000);

        } catch (error) {
            this.log(`Failed to activate ${charName}: ${error.message}`, 'ERROR');
            this.activeCharacters.delete(charId);
        }
    }

    // Deactivate character
    async deactivateCharacter(characterId) {
        const session = this.activeCharacters.get(characterId);
        if (!session) return;

        this.log(`Deactivating ${session.characterName}`);

        try {
            await this.sendToGameServer('characters/deactivate', {
                characterId: characterId,
                sessionData: session
            });
        } catch (error) {
            this.log(`Failed to deactivate ${session.characterName}: ${error.message}`, 'ERROR');
        }

        this.activeCharacters.delete(characterId);
    }

    // Send data to game server
    async sendToGameServer(endpoint, data) {
        const url = `${CONFIG.serverUrl}/api/${endpoint}`;

        return execPromise(`curl -X POST "${url}" -H "Content-Type: application/json" -d '${JSON.stringify(data)}'`)
            .then(result => {
                if (result.stderr) {
                    throw new Error(result.stderr);
                }
                return JSON.parse(result.stdout || '{}');
            });
    }

    // Process story event
    async processStoryEvent(event) {
        this.log(`Processing story event: ${event.type} - ${event.description}`);

        // Update story state based on event impact
        switch (event.impact) {
            case 'faction_tension':
                this.storyState.faction_tensions.restoration_vs_adaptation += Math.floor(Math.random() * 10) - 5;
                break;
            case 'beast_kin_relations':
                this.storyState.faction_tensions.human_vs_beastkin += Math.floor(Math.random() * 15) - 7;
                break;
            case 'corruption_spreads':
                this.storyState.faction_tensions.shadowblight_awareness += Math.floor(Math.random() * 10) + 5;
                break;
            case 'civil_unrest':
                this.storyState.faction_tensions.trust_in_council -= Math.floor(Math.random() * 10) + 5;
                break;
        }

        // Ensure tensions stay within bounds
        for (const key in this.storyState.faction_tensions) {
            this.storyState.faction_tensions[key] = Math.max(0, Math.min(100, this.storyState.faction_tensions[key]));
        }

        // Add to event history
        this.eventHistory.push(event);
        if (this.eventHistory.length > 100) {
            this.eventHistory.shift();
        }

        // Save state
        this.saveStoryState();

        // Notify game server
        await this.sendToGameServer('story/event', event);
    }

    // Main execution cycle
    async runCycle() {
        const period = this.getCurrentPeriod();

        if (period.intensity === 'none') {
            this.log('Outside active hours, skipping cycle');
            return;
        }

        this.log(`Starting cycle for ${period.name} period (intensity: ${period.intensity})`);

        // Generate random event (30% chance)
        let event = null;
        if (Math.random() < 0.3) {
            event = this.generateRandomEvent(period);
            await this.processStoryEvent(event);
        }

        // Select and activate characters
        const charactersToActivate = this.selectActiveCharacters(period);

        for (const character of charactersToActivate) {
            // If character is involved in event, pass event data
            const isInvolved = event && event.participants.some(p =>
                character.metadata.character_id.startsWith(p)
            );

            await this.activateCharacter(
                character,
                period,
                isInvolved ? event : null
            );

            // Stagger activations
            await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 2000));
        }

        // Generate status report
        this.generateStatusReport();
    }

    // Generate status report
    generateStatusReport() {
        const report = {
            timestamp: new Date().toISOString(),
            activeCharacters: Array.from(this.activeCharacters.values()).map(s => ({
                name: s.characterName,
                behavior: s.behavior,
                remainingMinutes: Math.floor((s.duration * 60 * 1000 - (Date.now() - s.startTime)) / 60000)
            })),
            storyState: this.storyState,
            recentEvents: this.eventHistory.slice(-5)
        };

        const reportFile = path.join(CONFIG.baseDir, 'implementation_logs', 'current_status.json');
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    }

    // Start scheduler
    start() {
        this.log('Auto Character Scheduler starting...');

        // Run initial cycle
        this.runCycle();

        // Schedule regular cycles every 10 minutes
        setInterval(() => {
            this.runCycle();
        }, 10 * 60 * 1000);

        // Clean up inactive sessions every hour
        setInterval(() => {
            this.cleanupInactiveSessions();
        }, 60 * 60 * 1000);
    }

    // Clean up inactive sessions
    cleanupInactiveSessions() {
        const now = Date.now();

        for (const [charId, session] of this.activeCharacters.entries()) {
            const elapsed = now - session.startTime;
            const maxDuration = session.duration * 60 * 1000;

            if (elapsed > maxDuration * 1.5) {
                this.log(`Cleaning up stuck session for ${session.characterName}`, 'WARN');
                this.deactivateCharacter(charId);
            }
        }
    }
}

// Command line interface
if (require.main === module) {
    const scheduler = new AutoCharacterScheduler();

    const args = process.argv.slice(2);
    const command = args[0] || 'start';

    switch (command) {
        case 'start':
            scheduler.start();
            break;

        case 'once':
            scheduler.runCycle().then(() => {
                console.log('Single cycle completed');
                process.exit(0);
            });
            break;

        case 'status':
            scheduler.generateStatusReport();
            console.log('Status report generated');
            break;

        default:
            console.log('Usage: node auto_character_scheduler.js [start|once|status]');
            process.exit(1);
    }
}

module.exports = AutoCharacterScheduler;