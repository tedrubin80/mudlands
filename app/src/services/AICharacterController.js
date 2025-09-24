/**
 * AI Character Controller
 * Handles automated NPC behavior and interactions in Mudlands
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class AICharacterController extends EventEmitter {
    constructor(world, socketHandler) {
        super();
        this.world = world;
        this.socketHandler = socketHandler;
        this.activeAICharacters = new Map();
        this.behaviorQueue = new Map();
        this.storyEventHandlers = new Map();

        // Load AI configurations
        this.aiConfigPath = '/var/www/mudlands.online/app/mudlands_ai_analysis/character_profiles/auto_players/active';
        this.loadAIConfigurations();

        // Register story event handlers
        this.registerStoryEventHandlers();
    }

    // Load AI character configurations
    loadAIConfigurations() {
        if (!fs.existsSync(this.aiConfigPath)) {
            console.log('AI character directory not found');
            return;
        }

        const files = fs.readdirSync(this.aiConfigPath);
        for (const file of files) {
            if (file.endsWith('.json')) {
                const config = JSON.parse(fs.readFileSync(path.join(this.aiConfigPath, file), 'utf8'));
                this.registerAICharacter(config);
            }
        }
    }

    // Register an AI character
    registerAICharacter(config) {
        const charId = config.metadata.character_id;

        // Create AI character instance
        const aiChar = {
            id: charId,
            config: config,
            currentBehavior: null,
            behaviorStack: [],
            memory: {
                recentInteractions: [],
                knownPlayers: new Map(),
                currentGoals: [],
                emotionalState: 'neutral'
            },
            stats: {
                activations: 0,
                interactions: 0,
                questsGiven: 0,
                storiesShared: 0
            }
        };

        this.activeAICharacters.set(charId, aiChar);
    }

    // Activate AI character with specific behavior
    async activateCharacter(characterId, behavior, duration, event = null) {
        const aiChar = this.activeAICharacters.get(characterId);
        if (!aiChar) {
            console.error(`AI character ${characterId} not found`);
            return false;
        }

        aiChar.currentBehavior = behavior;
        aiChar.activationTime = Date.now();
        aiChar.duration = duration * 60 * 1000; // Convert to milliseconds
        aiChar.relatedEvent = event;
        aiChar.stats.activations++;

        // Initialize character in game world
        const npc = this.createNPCFromConfig(aiChar.config);
        const startLocation = aiChar.config.character_data.location;

        if (this.world.rooms[startLocation]) {
            this.world.rooms[startLocation].npcs.push(npc);
            npc.currentRoom = startLocation;

            // Start behavior execution
            this.executeBehavior(aiChar, npc);

            // Schedule deactivation
            setTimeout(() => this.deactivateCharacter(characterId), aiChar.duration);

            return true;
        }

        return false;
    }

    // Create NPC instance from configuration
    createNPCFromConfig(config) {
        const NPC = require('../models/NPC');

        return new NPC({
            id: config.metadata.character_id,
            name: config.character_data.name,
            title: config.character_data.title,
            race: config.character_data.race,
            class: config.character_data.class,
            level: config.character_data.level,
            dialogue: config.game_mechanics.dialogue_trees,
            services: config.game_mechanics.services_offered,
            quests: config.game_mechanics.quests_available,
            personality: config.ai_behavior_config.personality_traits,
            isAIControlled: true
        });
    }

    // Execute character behavior
    async executeBehavior(aiChar, npc) {
        const behavior = aiChar.currentBehavior;
        const config = aiChar.config;

        // Map behaviors to actions
        const behaviorActions = {
            // Morning behaviors
            council_meeting: () => this.conductMeeting(npc, aiChar),
            town_inspection: () => this.performInspection(npc, aiChar),
            citizen_audiences: () => this.holdAudiences(npc, aiChar),
            morning_prayers: () => this.performPrayers(npc, aiChar),
            healing_services: () => this.provideHealing(npc, aiChar),
            hunting: () => this.goHunting(npc, aiChar),
            territory_patrol: () => this.patrolTerritory(npc, aiChar),

            // Evening behaviors
            private_meetings: () => this.conductPrivateMeeting(npc, aiChar),
            tavern_socializing: () => this.socializeInTavern(npc, aiChar),
            beast_kin_meetings: () => this.attendBeastKinMeeting(npc, aiChar),
            secret_rituals: () => this.performSecretRitual(npc, aiChar),

            // Night behaviors
            insomnia_walks: () => this.wanderAtNight(npc, aiChar),
            divine_communion: () => this.communeWithDivine(npc, aiChar),
            shadowblight_rituals: () => this.performCorruption(npc, aiChar),
            pack_howling: () => this.howlWithPack(npc, aiChar),

            // Default
            idle_activity: () => this.performIdleActivity(npc, aiChar)
        };

        const action = behaviorActions[behavior] || behaviorActions.idle_activity;

        // Execute behavior with periodic updates
        const updateInterval = setInterval(() => {
            if (!aiChar.currentBehavior) {
                clearInterval(updateInterval);
                return;
            }

            // Check for player interactions
            this.checkForPlayerInteractions(npc, aiChar);

            // Execute behavior action
            action();

            // Update emotional state based on interactions
            this.updateEmotionalState(aiChar);

        }, 30000); // Update every 30 seconds

        // Store interval for cleanup
        aiChar.behaviorInterval = updateInterval;
    }

    // Behavior implementations
    conductMeeting(npc, aiChar) {
        const room = this.world.rooms[npc.currentRoom];
        if (!room) return;

        // Generate meeting dialogue
        const dialogues = [
            "The council must address these growing concerns...",
            "We need unity now more than ever.",
            "The restoration efforts require careful planning.",
            "These are difficult decisions, but necessary ones."
        ];

        const message = dialogues[Math.floor(Math.random() * dialogues.length)];
        this.broadcastToRoom(room, `${npc.name} says: "${message}"`);

        // Move to different location occasionally
        if (Math.random() < 0.3) {
            this.moveCharacter(npc, aiChar, 'council_chambers');
        }
    }

    performInspection(npc, aiChar) {
        const locations = ['town_square', 'market', 'town_gates', 'residential_district'];
        const targetLocation = locations[Math.floor(Math.random() * locations.length)];

        this.moveCharacter(npc, aiChar, targetLocation);

        const observations = [
            "examines the area carefully",
            "takes notes about the town's condition",
            "speaks with local residents",
            "checks the structural integrity of buildings"
        ];

        const action = observations[Math.floor(Math.random() * observations.length)];
        this.broadcastToRoom(this.world.rooms[npc.currentRoom], `${npc.name} ${action}.`);
    }

    socializeInTavern(npc, aiChar) {
        this.moveCharacter(npc, aiChar, 'inn_common');

        const activities = [
            { action: "shares a tale from the old days", type: "story" },
            { action: "buys a round for everyone", type: "generosity" },
            { action: "engages in animated discussion", type: "debate" },
            { action: "listens intently to travelers' news", type: "information" }
        ];

        const activity = activities[Math.floor(Math.random() * activities.length)];
        this.broadcastToRoom(this.world.rooms[npc.currentRoom], `${npc.name} ${activity.action}.`);

        // Track story sharing
        if (activity.type === "story") {
            aiChar.stats.storiesShared++;
        }
    }

    performSecretRitual(npc, aiChar) {
        // Veiled Scholar's hidden activities
        if (aiChar.config.character_data.faction_allegiance.includes("Shadowblight")) {
            // Don't broadcast these activities publicly
            aiChar.memory.currentGoals.push("spread_corruption");

            // Subtly corrupt items or locations
            const room = this.world.rooms[npc.currentRoom];
            if (room) {
                room.hiddenProperties = room.hiddenProperties || {};
                room.hiddenProperties.corruptionLevel = (room.hiddenProperties.corruptionLevel || 0) + 1;
            }
        }
    }

    howlWithPack(npc, aiChar) {
        // Razorclaw's Beast-kin behavior
        this.moveCharacter(npc, aiChar, 'forest_edge');

        this.broadcastToRoom(
            this.world.rooms[npc.currentRoom],
            `${npc.name} raises their head and howls into the night, a haunting sound that echoes through the forest.`
        );

        // Other Beast-kin might respond
        setTimeout(() => {
            if (Math.random() < 0.5) {
                this.broadcastToRoom(
                    this.world.rooms[npc.currentRoom],
                    "Distant howls answer from deep within the forest."
                );
            }
        }, 3000);
    }

    // Check for player interactions
    checkForPlayerInteractions(npc, aiChar) {
        const room = this.world.rooms[npc.currentRoom];
        if (!room) return;

        const playersInRoom = room.players || [];

        for (const playerId of playersInRoom) {
            const player = this.world.players.get(playerId);
            if (!player) continue;

            // Check if this is a new interaction
            const lastInteraction = aiChar.memory.knownPlayers.get(playerId);
            const now = Date.now();

            if (!lastInteraction || now - lastInteraction > 300000) { // 5 minutes
                this.initiateInteraction(npc, aiChar, player);
                aiChar.memory.knownPlayers.set(playerId, now);
            }
        }
    }

    // Initiate interaction with player
    initiateInteraction(npc, aiChar, player) {
        const config = aiChar.config;
        const personality = config.ai_behavior_config.personality_traits;

        // Generate contextual greeting based on personality
        let greeting = config.game_mechanics.dialogue_trees.greeting;

        // Modify based on current behavior and event
        if (aiChar.currentBehavior === 'secret_rituals') {
            greeting = "Oh! I didn't hear you approach. How may I... assist you?";
        } else if (aiChar.relatedEvent) {
            greeting = `Have you heard about ${aiChar.relatedEvent.description}? Troubling times indeed.`;
        }

        // Send personalized message to player
        this.socketHandler.sendToPlayer(player.id, {
            type: 'npc_interaction',
            npc: {
                name: npc.name,
                title: npc.title,
                message: greeting,
                services: npc.services,
                hasQuests: npc.quests.length > 0
            }
        });

        aiChar.stats.interactions++;

        // Remember this interaction
        aiChar.memory.recentInteractions.push({
            playerId: player.id,
            playerName: player.name,
            timestamp: Date.now(),
            behavior: aiChar.currentBehavior
        });

        // Limit memory size
        if (aiChar.memory.recentInteractions.length > 50) {
            aiChar.memory.recentInteractions.shift();
        }
    }

    // Move character to new location
    moveCharacter(npc, aiChar, targetLocation) {
        const currentRoom = this.world.rooms[npc.currentRoom];
        const targetRoom = this.world.rooms[targetLocation];

        if (!currentRoom || !targetRoom) return false;

        // Remove from current room
        const npcIndex = currentRoom.npcs.findIndex(n => n.id === npc.id);
        if (npcIndex !== -1) {
            currentRoom.npcs.splice(npcIndex, 1);
        }

        // Announce departure
        this.broadcastToRoom(currentRoom, `${npc.name} leaves toward ${targetLocation}.`);

        // Add to target room
        targetRoom.npcs.push(npc);
        npc.currentRoom = targetLocation;

        // Announce arrival
        this.broadcastToRoom(targetRoom, `${npc.name} arrives from ${currentRoom.name}.`);

        return true;
    }

    // Update character's emotional state
    updateEmotionalState(aiChar) {
        const recentInteractions = aiChar.memory.recentInteractions.length;
        const currentGoals = aiChar.memory.currentGoals.length;

        if (recentInteractions > 5) {
            aiChar.memory.emotionalState = 'social';
        } else if (currentGoals > 3) {
            aiChar.memory.emotionalState = 'focused';
        } else if (aiChar.currentBehavior.includes('secret') || aiChar.currentBehavior.includes('shadow')) {
            aiChar.memory.emotionalState = 'secretive';
        } else {
            aiChar.memory.emotionalState = 'neutral';
        }
    }

    // Broadcast message to room
    broadcastToRoom(room, message) {
        if (!room || !room.players) return;

        for (const playerId of room.players) {
            this.socketHandler.sendToPlayer(playerId, {
                type: 'room_event',
                message: message
            });
        }
    }

    // Deactivate character
    deactivateCharacter(characterId) {
        const aiChar = this.activeAICharacters.get(characterId);
        if (!aiChar) return;

        // Clear behavior interval
        if (aiChar.behaviorInterval) {
            clearInterval(aiChar.behaviorInterval);
        }

        // Remove NPC from world
        const room = this.world.rooms[aiChar.config.character_data.location];
        if (room) {
            const npcIndex = room.npcs.findIndex(n => n.id === characterId);
            if (npcIndex !== -1) {
                const npc = room.npcs[npcIndex];
                this.broadcastToRoom(room, `${npc.name} departs to attend to other matters.`);
                room.npcs.splice(npcIndex, 1);
            }
        }

        // Save character statistics
        this.saveCharacterStats(aiChar);

        // Reset behavior
        aiChar.currentBehavior = null;
        aiChar.behaviorStack = [];
        aiChar.relatedEvent = null;
    }

    // Save character statistics and memory
    saveCharacterStats(aiChar) {
        const statsFile = path.join(
            '/var/www/mudlands.online/app/mudlands_ai_analysis/implementation_logs',
            `character_stats_${aiChar.id}.json`
        );

        const stats = {
            characterId: aiChar.id,
            lastActive: new Date().toISOString(),
            stats: aiChar.stats,
            memory: {
                knownPlayers: Array.from(aiChar.memory.knownPlayers.entries()),
                recentInteractions: aiChar.memory.recentInteractions,
                totalActivations: aiChar.stats.activations
            }
        };

        fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
    }

    // Register story event handlers
    registerStoryEventHandlers() {
        // Political events
        this.storyEventHandlers.set('debate', (event) => {
            // Characters involved in debate become more active
            for (const participant of event.participants) {
                const aiChar = Array.from(this.activeAICharacters.values())
                    .find(char => char.config.metadata.character_id.startsWith(participant));

                if (aiChar) {
                    aiChar.memory.currentGoals.push('defend_position');
                    aiChar.memory.emotionalState = 'passionate';
                }
            }
        });

        // Shadowblight events
        this.storyEventHandlers.set('outbreak', (event) => {
            // Alert relevant characters
            const healers = Array.from(this.activeAICharacters.values())
                .filter(char => char.config.game_mechanics.services_offered.includes('Healing'));

            for (const healer of healers) {
                healer.memory.currentGoals.push('investigate_outbreak');
                healer.memory.emotionalState = 'concerned';
            }
        });

        // Beast-kin events
        this.storyEventHandlers.set('incident', (event) => {
            // Increase tension for Beast-kin characters
            const beastKin = Array.from(this.activeAICharacters.values())
                .filter(char => char.config.character_data.race.includes('kin'));

            for (const char of beastKin) {
                char.memory.emotionalState = 'wary';
                char.memory.currentGoals.push('avoid_confrontation');
            }
        });
    }

    // Handle story event
    handleStoryEvent(event) {
        const handler = this.storyEventHandlers.get(event.type);
        if (handler) {
            handler(event);
        }

        // Broadcast event effects to players
        const announcement = this.generateEventAnnouncement(event);
        if (announcement) {
            this.socketHandler.broadcast({
                type: 'world_event',
                message: announcement,
                category: event.category
            });
        }
    }

    // Generate event announcement
    generateEventAnnouncement(event) {
        const announcements = {
            debate: `A heated debate erupts in the town square about ${event.description}.`,
            outbreak: `Urgent: ${event.description}. Citizens are advised to seek healing services.`,
            discovery: `News spreads of ${event.description}.`,
            incident: `Tension rises as ${event.description}.`,
            festival: `The town prepares for ${event.description}!`,
            warning: `Troubling reports arrive: ${event.description}.`
        };

        return announcements[event.type] || null;
    }

    // Perform idle activity
    performIdleActivity(npc, aiChar) {
        const idleActions = [
            "contemplates quietly",
            "organizes their belongings",
            "observes the surroundings",
            "rests briefly",
            "reviews some documents"
        ];

        const action = idleActions[Math.floor(Math.random() * idleActions.length)];
        const room = this.world.rooms[npc.currentRoom];

        if (room && Math.random() < 0.2) { // 20% chance to show idle action
            this.broadcastToRoom(room, `${npc.name} ${action}.`);
        }
    }

    // Specialized behavior methods
    provideHealing(npc, aiChar) {
        const room = this.world.rooms[npc.currentRoom];
        if (!room) return;

        this.broadcastToRoom(room, `${npc.name} prepares healing remedies and tends to the sick.`);

        // Check if any players need healing
        for (const playerId of room.players || []) {
            const player = this.world.players.get(playerId);
            if (player && player.hp < player.maxHp) {
                this.socketHandler.sendToPlayer(playerId, {
                    type: 'npc_offer',
                    npc: npc.name,
                    service: 'healing',
                    message: `${npc.name} notices your injuries and offers healing services.`
                });
            }
        }
    }

    goHunting(npc, aiChar) {
        // Razorclaw's hunting behavior
        this.moveCharacter(npc, aiChar, 'deep_forest');

        const huntingActions = [
            "tracks prey through the underbrush",
            "sniffs the air, catching a scent",
            "moves silently through the trees",
            "marks territory boundaries"
        ];

        const action = huntingActions[Math.floor(Math.random() * huntingActions.length)];
        this.broadcastToRoom(this.world.rooms[npc.currentRoom], `${npc.name} ${action}.`);

        // Might return with game
        if (Math.random() < 0.3) {
            setTimeout(() => {
                this.moveCharacter(npc, aiChar, 'forest_edge_camp');
                this.broadcastToRoom(
                    this.world.rooms[npc.currentRoom],
                    `${npc.name} returns from the hunt with fresh game.`
                );
            }, 60000); // After 1 minute
        }
    }

    wanderAtNight(npc, aiChar) {
        // Elder Thaddeus's insomnia walks
        const nightLocations = ['memorial_garden', 'town_walls', 'old_bridge'];
        const location = nightLocations[Math.floor(Math.random() * nightLocations.length)];

        this.moveCharacter(npc, aiChar, location);

        const thoughts = [
            "stares at the memorial stone, lost in memories",
            "walks slowly along the walls, deep in thought",
            "pauses to look at the stars, remembering better times",
            "mutters quietly about the burdens of leadership"
        ];

        const thought = thoughts[Math.floor(Math.random() * thoughts.length)];
        this.broadcastToRoom(this.world.rooms[npc.currentRoom], `${npc.name} ${thought}.`);
    }

    // Get AI status report
    getStatusReport() {
        const report = {
            activeCharacters: [],
            totalStats: {
                activations: 0,
                interactions: 0,
                questsGiven: 0,
                storiesShared: 0
            }
        };

        for (const [id, aiChar] of this.activeAICharacters) {
            report.activeCharacters.push({
                id: id,
                name: aiChar.config.character_data.name,
                currentBehavior: aiChar.currentBehavior,
                emotionalState: aiChar.memory.emotionalState,
                stats: aiChar.stats
            });

            // Aggregate stats
            report.totalStats.activations += aiChar.stats.activations;
            report.totalStats.interactions += aiChar.stats.interactions;
            report.totalStats.questsGiven += aiChar.stats.questsGiven;
            report.totalStats.storiesShared += aiChar.stats.storiesShared;
        }

        return report;
    }
}

module.exports = AICharacterController;