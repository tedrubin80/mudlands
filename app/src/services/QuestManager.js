const Quest = require('../models/Quest');
const GameLogger = require('../utils/logger');

class QuestManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.questTemplates = new Map();
        this.activeQuests = new Map(); // questId -> Quest instance
        this.playerQuests = new Map(); // playerId -> Set of questIds
    }

    async initialize() {
        GameLogger.gameEvent('quest_manager_initialize_start');
        await this.loadQuestTemplates();
        GameLogger.gameEvent('quest_manager_initialize_complete', { 
            templateCount: this.questTemplates.size 
        });
    }

    async loadQuestTemplates() {
        // Load quest templates from data/quests.json
        try {
            const fs = require('fs');
            const path = require('path');
            const questPath = path.join(__dirname, '../data/quests.json');
            
            if (fs.existsSync(questPath)) {
                const questData = JSON.parse(fs.readFileSync(questPath, 'utf8'));
                
                if (questData.quests) {
                    questData.quests.forEach(questTemplate => {
                        const quest = new Quest(questTemplate);
                        this.questTemplates.set(quest.id, quest);
                    });
                }
            } else {
                // Create basic starter quests if no file exists
                this.createStarterQuests();
            }
        } catch (error) {
            GameLogger.error('Failed to load quest templates', error);
            this.createStarterQuests();
        }
    }

    createStarterQuests() {
        // Create some basic starter quests
        const starterQuests = [
            {
                id: 'welcome_to_aldoria',
                title: 'Welcome to Aldoria',
                description: 'Get acquainted with the town and its people.',
                type: 'tutorial',
                category: 'main',
                difficulty: 'easy',
                level_requirement: 1,
                narrative: {
                    hook: 'Welcome to Aldoria! Let me show you around town.',
                    background: 'Every new adventurer needs to learn the basics of survival.',
                    stakes: 'Knowing your way around town could save your life.',
                    resolution: 'Well done! You\'re starting to understand how things work here.'
                },
                giver: 'town_guide',
                objectives: [
                    {
                        id: 'visit_market',
                        type: 'explore',
                        description: 'Visit the Market Street',
                        target: 'market_street',
                        quantity: 1
                    },
                    {
                        id: 'visit_training',
                        type: 'explore',
                        description: 'Visit the Training Grounds',
                        target: 'training_grounds',
                        quantity: 1
                    }
                ],
                rewards: {
                    experience: 50,
                    gold: 10,
                    items: [{ id: 'health_potion', quantity: 3 }]
                }
            },
            {
                id: 'goblin_menace',
                title: 'The Goblin Menace',
                description: 'Clear out goblin scouts that have been harassing travelers.',
                type: 'kill',
                category: 'side',
                difficulty: 'easy',
                level_requirement: 1,
                narrative: {
                    hook: 'Goblin scouts have been attacking travelers on the roads.',
                    background: 'These goblins are getting bolder each day.',
                    stakes: 'If we don\'t stop them, trade routes will be compromised.',
                    resolution: 'Excellent work! The roads are safer now.'
                },
                giver: 'guard_captain',
                objectives: [
                    {
                        id: 'kill_goblins',
                        type: 'kill',
                        description: 'Defeat 3 Goblin Scouts',
                        target: 'goblin_scout',
                        quantity: 3
                    }
                ],
                rewards: {
                    experience: 75,
                    gold: 25,
                    items: [{ id: 'leather_boots', quantity: 1 }]
                }
            },
            {
                id: 'herb_gathering',
                title: 'Herb Gathering',
                description: 'Collect healing herbs for the town alchemist.',
                type: 'fetch',
                category: 'side',
                difficulty: 'easy',
                level_requirement: 1,
                narrative: {
                    hook: 'I need someone to gather some herbs for my potions.',
                    background: 'These herbs are essential for healing potions.',
                    stakes: 'Without them, I can\'t help injured adventurers.',
                    resolution: 'Perfect! These herbs are exactly what I needed.'
                },
                giver: 'town_alchemist',
                objectives: [
                    {
                        id: 'collect_herbs',
                        type: 'collect',
                        description: 'Collect 5 Herb Bundles',
                        target: 'herb_bundle',
                        quantity: 5
                    }
                ],
                rewards: {
                    experience: 40,
                    gold: 15,
                    items: [{ id: 'health_potion', quantity: 2 }]
                },
                repeatable: true,
                cooldown: 3600000 // 1 hour
            },
            {
                id: 'wolves_in_the_woods',
                title: 'Wolves in the Woods',
                description: 'Investigate reports of aggressive wolves near town.',
                type: 'kill',
                category: 'main',
                difficulty: 'normal',
                level_requirement: 2,
                prerequisites: {
                    level: 2,
                    quests_completed: ['welcome_to_aldoria']
                },
                narrative: {
                    hook: 'Travelers report aggressive wolves blocking the forest paths.',
                    background: 'These wolves are unusually aggressive - something is wrong.',
                    stakes: 'If left unchecked, they could threaten the town itself.',
                    resolution: 'Well done. The forest paths are clear once more.'
                },
                giver: 'forest_ranger',
                objectives: [
                    {
                        id: 'kill_wolves',
                        type: 'kill',
                        description: 'Defeat 2 Forest Wolves',
                        target: 'forest_wolf',
                        quantity: 2
                    },
                    {
                        id: 'investigate_cave',
                        type: 'explore',
                        description: 'Investigate the Forest Clearing',
                        target: 'forest_clearing',
                        quantity: 1
                    }
                ],
                rewards: {
                    experience: 100,
                    gold: 40,
                    items: [{ id: 'wolf_pelt_cloak', quantity: 1 }]
                }
            }
        ];

        starterQuests.forEach(questData => {
            const quest = new Quest(questData);
            this.questTemplates.set(quest.id, quest);
        });

        GameLogger.gameEvent('starter_quests_created', { count: starterQuests.length });
    }

    // Get available quests for a player
    getAvailableQuests(player) {
        const availableQuests = [];
        
        for (const [questId, questTemplate] of this.questTemplates) {
            const canStart = questTemplate.canPlayerStart(player);
            if (canStart.can_start && questTemplate.getPlayerStatus(player.id) === 'not_started') {
                availableQuests.push(questTemplate);
            }
        }

        return availableQuests;
    }

    // Get active quests for a player
    getActiveQuests(player) {
        const activeQuests = [];
        
        for (const [questId, questTemplate] of this.questTemplates) {
            const status = questTemplate.getPlayerStatus(player.id);
            if (status === 'active') {
                activeQuests.push(questTemplate);
            }
        }

        return activeQuests;
    }

    // Get completed but not turned in quests for a player
    getCompletedQuests(player) {
        const completedQuests = [];
        
        for (const [questId, questTemplate] of this.questTemplates) {
            const status = questTemplate.getPlayerStatus(player.id);
            if (status === 'completed') {
                completedQuests.push(questTemplate);
            }
        }

        return completedQuests;
    }

    // Start a quest for a player
    startQuest(player, questId) {
        const questTemplate = this.questTemplates.get(questId);
        if (!questTemplate) {
            return { success: false, message: 'Quest not found' };
        }

        const started = questTemplate.startForPlayer(player);
        if (!started) {
            return { success: false, message: 'Cannot start this quest' };
        }

        // Track player quests
        if (!this.playerQuests.has(player.id)) {
            this.playerQuests.set(player.id, new Set());
        }
        this.playerQuests.get(player.id).add(questId);

        player.needsUpdate = true;
        GameLogger.playerAction(player.id, player.name, 'quest_started', { questId, questTitle: questTemplate.title });

        return { 
            success: true, 
            message: `Quest started: ${questTemplate.title}` 
        };
    }

    // Complete a quest for a player
    completeQuest(player, questId) {
        const questTemplate = this.questTemplates.get(questId);
        if (!questTemplate) {
            return { success: false, message: 'Quest not found' };
        }

        const completed = questTemplate.completeForPlayer(player);
        if (!completed) {
            return { success: false, message: 'Quest cannot be completed yet' };
        }

        player.needsUpdate = true;
        GameLogger.playerAction(player.id, player.name, 'quest_completed', { 
            questId, 
            questTitle: questTemplate.title,
            rewards: questTemplate.rewards
        });

        return { 
            success: true, 
            message: `Quest completed: ${questTemplate.title}!`,
            rewards: questTemplate.rewards
        };
    }

    // Update quest progress when certain events happen
    updateQuestProgress(player, eventType, eventData) {
        const activeQuests = this.getActiveQuests(player);
        let progressMade = false;

        for (const quest of activeQuests) {
            const playerData = quest.player_data[player.id];
            if (!playerData) continue;

            for (const objective of playerData.objectives) {
                if (objective.completed) continue;

                let shouldUpdate = false;
                
                switch (eventType) {
                    case 'monster_killed':
                        if (objective.type === 'kill' && objective.target === eventData.monsterType) {
                            shouldUpdate = true;
                        }
                        break;
                    
                    case 'item_collected':
                        if (objective.type === 'collect' && objective.target === eventData.itemId) {
                            shouldUpdate = true;
                        }
                        break;
                    
                    case 'location_visited':
                        if (objective.type === 'explore' && objective.target === eventData.locationId) {
                            shouldUpdate = true;
                        }
                        break;
                    
                    case 'npc_talked':
                        if (objective.type === 'talk_to' && objective.target === eventData.npcId) {
                            shouldUpdate = true;
                        }
                        break;
                    
                    case 'item_delivered':
                        if (objective.type === 'deliver' && 
                            objective.target === eventData.npcId && 
                            eventData.itemId === objective.item_id) {
                            shouldUpdate = true;
                        }
                        break;
                }

                if (shouldUpdate) {
                    const progress = eventData.quantity || 1;
                    quest.updateObjectiveProgress(player.id, objective.id, progress);
                    progressMade = true;
                    
                    // Notify player of progress
                    const progressText = `${objective.current_progress}/${objective.quantity || 1}`;
                    this.gameEngine.emit('messageToPlayer', {
                        playerId: player.id,
                        message: `Quest Progress: ${objective.description} (${progressText})`
                    });

                    // Check if objective is complete
                    if (objective.completed) {
                        this.gameEngine.emit('messageToPlayer', {
                            playerId: player.id,
                            message: `Objective completed: ${objective.description}`
                        });
                    }
                }
            }
        }

        if (progressMade) {
            player.needsUpdate = true;
        }

        return progressMade;
    }

    // Get quest template by ID
    getQuestTemplate(questId) {
        return this.questTemplates.get(questId);
    }

    // Get quest dialogue for NPC interactions
    getQuestDialogue(npcId, player) {
        const dialogues = [];
        
        // Check for quests this NPC can give
        for (const [questId, questTemplate] of this.questTemplates) {
            if (questTemplate.giver === npcId) {
                const status = questTemplate.getPlayerStatus(player.id);
                
                switch (status) {
                    case 'not_started':
                        const canStart = questTemplate.canPlayerStart(player);
                        if (canStart.can_start) {
                            dialogues.push({
                                type: 'quest_offer',
                                questId: questId,
                                title: questTemplate.title,
                                text: questTemplate.getQuestDialogue('offer')
                            });
                        }
                        break;
                    
                    case 'active':
                        dialogues.push({
                            type: 'quest_progress',
                            questId: questId,
                            title: questTemplate.title,
                            text: questTemplate.getQuestDialogue('in_progress', player.id)
                        });
                        break;
                    
                    case 'completed':
                        dialogues.push({
                            type: 'quest_turn_in',
                            questId: questId,
                            title: questTemplate.title,
                            text: questTemplate.getQuestDialogue('complete_check', player.id)
                        });
                        break;
                    
                    case 'turned_in':
                        if (questTemplate.repeatable) {
                            // Check cooldown
                            const playerData = questTemplate.player_data[player.id];
                            const timeSinceCompletion = Date.now() - playerData.turn_in_time;
                            if (timeSinceCompletion >= questTemplate.cooldown) {
                                dialogues.push({
                                    type: 'quest_offer',
                                    questId: questId,
                                    title: questTemplate.title,
                                    text: questTemplate.getQuestDialogue('offer')
                                });
                            }
                        }
                        break;
                }
            }
        }

        return dialogues;
    }

    // Clean up completed non-repeatable quests
    cleanupPlayerQuests(playerId) {
        const playerQuestIds = this.playerQuests.get(playerId);
        if (!playerQuestIds) return;

        for (const questId of playerQuestIds) {
            const quest = this.questTemplates.get(questId);
            if (quest && quest.getPlayerStatus(playerId) === 'turned_in' && !quest.repeatable) {
                playerQuestIds.delete(questId);
            }
        }
    }
}

module.exports = QuestManager;