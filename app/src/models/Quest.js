const { v4: uuidv4 } = require('uuid');

class Quest {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.title = data.title || 'Untitled Quest';
        this.description = data.description || '';
        this.long_description = data.long_description || '';
        
        // Quest categorization
        this.type = data.type || 'fetch'; // fetch, kill, escort, explore, social, mystery
        this.category = data.category || 'side'; // main, side, daily, event
        this.difficulty = data.difficulty || 'easy'; // easy, medium, hard, epic
        this.level_requirement = data.level_requirement || 1;
        
        // Story elements
        this.narrative = {
            hook: data.narrative?.hook || 'A simple task awaits.',
            background: data.narrative?.background || '',
            stakes: data.narrative?.stakes || 'Completing this will help someone.',
            resolution: data.narrative?.resolution || 'The task is complete.'
        };
        
        // Quest giver and involved NPCs
        this.giver = data.giver || null; // NPC ID
        this.involved_npcs = data.involved_npcs || [];
        this.target_npcs = data.target_npcs || []; // NPCs to interact with
        
        // Prerequisites and requirements
        this.prerequisites = {
            level: data.prerequisites?.level || 1,
            quests_completed: data.prerequisites?.quests_completed || [],
            items_required: data.prerequisites?.items_required || [],
            skills_required: data.prerequisites?.skills_required || [],
            reputation_required: data.prerequisites?.reputation_required || {},
            flags_required: data.prerequisites?.flags_required || []
        };
        
        // Objectives system
        this.objectives = data.objectives || [];
        /* Objective structure:
        {
            id: 'obj_1',
            type: 'kill', // kill, collect, deliver, talk_to, explore, use_item
            description: 'Kill 5 goblins',
            target: 'goblin',
            quantity: 5,
            current_progress: 0,
            completed: false,
            optional: false,
            hidden: false // Don't show to player initially
        }
        */
        
        // Rewards
        this.rewards = {
            experience: data.rewards?.experience || 0,
            gold: data.rewards?.gold || 0,
            items: data.rewards?.items || [],
            reputation: data.rewards?.reputation || {},
            unlocks: data.rewards?.unlocks || [], // What this quest unlocks
            titles: data.rewards?.titles || []
        };
        
        // Quest state
        this.status = data.status || 'available'; // available, active, completed, failed, locked
        this.can_abandon = data.can_abandon !== false;
        this.repeatable = data.repeatable || false;
        this.time_limit = data.time_limit || null; // milliseconds
        this.cooldown = data.cooldown || 0; // time before can repeat
        
        // Branching and consequences
        this.branches = data.branches || [];
        /* Branch structure:
        {
            condition: 'player_chose_option_a',
            next_quest: 'quest_id_2',
            modifications: { // Changes to make to this quest
                objectives: [...],
                rewards: {...}
            }
        }
        */
        
        // World state impact
        this.world_effects = data.world_effects || [];
        /* Effect structure:
        {
            type: 'npc_mood_change',
            target: 'npc_id',
            effect: { mood: 'happy', trust_change: 10 },
            condition: 'quest_completed' // when to apply
        }
        */
        
        // Location and movement
        this.locations_involved = data.locations_involved || [];
        this.start_location = data.start_location || null;
        this.turn_in_location = data.turn_in_location || null;
        
        // Meta information
        this.created_by = data.created_by || 'system';
        this.creation_date = data.creation_date || Date.now();
        this.last_modified = data.last_modified || Date.now();
        this.tags = data.tags || [];
        
        // Player tracking
        this.player_data = data.player_data || {}; // player_id -> quest progress data
    }
    
    // Check if player meets prerequisites
    canPlayerStart(player) {
        // Level requirement
        if (player.level < this.prerequisites.level) {
            return { can_start: false, reason: 'insufficient_level' };
        }
        
        // Required quests
        for (const questId of this.prerequisites.quests_completed) {
            if (!player.hasCompletedQuest(questId)) {
                return { can_start: false, reason: 'missing_prerequisite_quest' };
            }
        }
        
        // Required items
        for (const item of this.prerequisites.items_required) {
            if (!player.hasItem(item.id, item.quantity || 1)) {
                return { can_start: false, reason: 'missing_required_item' };
            }
        }
        
        // Reputation requirements
        for (const [faction, required] of Object.entries(this.prerequisites.reputation_required)) {
            const current = player.getReputation(faction);
            if (current < required) {
                return { can_start: false, reason: 'insufficient_reputation' };
            }
        }
        
        // Story flags
        for (const flag of this.prerequisites.flags_required) {
            if (!player.hasStoryFlag(flag)) {
                return { can_start: false, reason: 'missing_story_flag' };
            }
        }
        
        return { can_start: true };
    }
    
    // Start quest for player
    startForPlayer(player) {
        if (this.status !== 'available') return false;
        
        const canStart = this.canPlayerStart(player);
        if (!canStart.can_start) return false;
        
        // Initialize player quest data
        this.player_data[player.id] = {
            status: 'active',
            start_time: Date.now(),
            objectives: this.objectives.map(obj => ({
                ...obj,
                current_progress: 0,
                completed: false
            })),
            choices_made: [],
            custom_data: {}
        };
        
        // Remove required items if consumed
        for (const item of this.prerequisites.items_required) {
            if (item.consumed) {
                player.removeItem(item.id, item.quantity || 1);
            }
        }
        
        return true;
    }
    
    // Update objective progress
    updateObjectiveProgress(playerId, objectiveId, progress = 1) {
        if (!this.player_data[playerId]) return false;
        
        const playerQuest = this.player_data[playerId];
        const objective = playerQuest.objectives.find(obj => obj.id === objectiveId);
        
        if (!objective || objective.completed) return false;
        
        objective.current_progress = Math.min(
            objective.current_progress + progress,
            objective.quantity || 1
        );
        
        // Check if objective is complete
        if (objective.current_progress >= (objective.quantity || 1)) {
            objective.completed = true;
            this.checkQuestCompletion(playerId);
        }
        
        return true;
    }
    
    // Check if quest is complete for player
    checkQuestCompletion(playerId) {
        if (!this.player_data[playerId]) return false;
        
        const playerQuest = this.player_data[playerId];
        const requiredObjectives = playerQuest.objectives.filter(obj => !obj.optional);
        const completedRequired = requiredObjectives.filter(obj => obj.completed);
        
        if (completedRequired.length >= requiredObjectives.length) {
            playerQuest.status = 'completed';
            playerQuest.completion_time = Date.now();
            return true;
        }
        
        return false;
    }
    
    // Complete quest for player and give rewards
    completeForPlayer(player) {
        if (!this.player_data[player.id] || this.player_data[player.id].status !== 'completed') {
            return false;
        }
        
        // Give rewards
        player.gainExperience(this.rewards.experience);
        player.addGold(this.rewards.gold);
        
        for (const item of this.rewards.items) {
            player.addItem(item.id, item.quantity || 1);
        }
        
        for (const [faction, rep] of Object.entries(this.rewards.reputation)) {
            player.modifyReputation(faction, rep);
        }
        
        for (const title of this.rewards.titles) {
            player.addTitle(title);
        }
        
        // Apply world effects
        this.applyWorldEffects('quest_completed');
        
        // Mark as turned in
        this.player_data[player.id].status = 'turned_in';
        this.player_data[player.id].turn_in_time = Date.now();
        
        return true;
    }
    
    // Apply world state changes
    applyWorldEffects(condition) {
        for (const effect of this.world_effects) {
            if (effect.condition === condition) {
                // This would need to be implemented based on your world system
                // For example: modifying NPC moods, unlocking areas, etc.
                console.log(`Applying world effect: ${effect.type} on ${effect.target}`);
            }
        }
    }
    
    // Get quest status for player
    getPlayerStatus(playerId) {
        return this.player_data[playerId]?.status || 'not_started';
    }
    
    // Get formatted objective list for player
    getObjectivesForPlayer(playerId) {
        if (!this.player_data[playerId]) return [];
        
        return this.player_data[playerId].objectives
            .filter(obj => !obj.hidden)
            .map(obj => ({
                description: obj.description,
                progress: `${obj.current_progress}/${obj.quantity || 1}`,
                completed: obj.completed,
                optional: obj.optional
            }));
    }
    
    // Generate context-appropriate dialogue
    getQuestDialogue(phase, playerId = null) {
        const dialogues = {
            offer: this.narrative.hook,
            accept: `Excellent! ${this.narrative.background}`,
            decline: "Perhaps another time then.",
            in_progress: this.getProgressDialogue(playerId),
            complete_check: this.getCompletionDialogue(playerId),
            turn_in: this.narrative.resolution,
            already_completed: "You've already helped me with this matter."
        };
        
        return dialogues[phase] || "I have nothing more to say about this.";
    }
    
    getProgressDialogue(playerId) {
        if (!this.player_data[playerId]) return "How are things going?";
        
        const playerQuest = this.player_data[playerId];
        const completedCount = playerQuest.objectives.filter(obj => obj.completed).length;
        const totalCount = playerQuest.objectives.filter(obj => !obj.optional).length;
        
        if (completedCount === 0) {
            return "You haven't started yet. Remember what you need to do?";
        } else if (completedCount < totalCount) {
            return "You're making progress, but there's still work to be done.";
        } else {
            return "Excellent work! You've completed everything I asked.";
        }
    }
    
    getCompletionDialogue(playerId) {
        if (this.getPlayerStatus(playerId) === 'completed') {
            return "Wonderful! You've completed the task. Here's your reward.";
        } else {
            return "You haven't finished everything yet. Come back when you're done.";
        }
    }
    
    // Factory methods for common quest types
    static createFetchQuest(config) {
        return new Quest({
            type: 'fetch',
            title: config.title || 'Fetch Quest',
            objectives: [{
                id: 'fetch_obj',
                type: 'collect',
                description: `Collect ${config.quantity || 1} ${config.item_name}`,
                target: config.item_id,
                quantity: config.quantity || 1,
                current_progress: 0,
                completed: false
            }],
            ...config
        });
    }
    
    static createKillQuest(config) {
        return new Quest({
            type: 'kill',
            title: config.title || 'Extermination',
            objectives: [{
                id: 'kill_obj',
                type: 'kill',
                description: `Defeat ${config.quantity || 1} ${config.monster_name}`,
                target: config.monster_type,
                quantity: config.quantity || 1,
                current_progress: 0,
                completed: false
            }],
            ...config
        });
    }
    
    static createDeliveryQuest(config) {
        return new Quest({
            type: 'delivery',
            title: config.title || 'Delivery',
            objectives: [
                {
                    id: 'get_item',
                    type: 'collect',
                    description: `Get the ${config.item_name}`,
                    target: config.item_id,
                    quantity: 1,
                    current_progress: 0,
                    completed: false
                },
                {
                    id: 'deliver_item',
                    type: 'deliver',
                    description: `Deliver the ${config.item_name} to ${config.recipient_name}`,
                    target: config.recipient_id,
                    quantity: 1,
                    current_progress: 0,
                    completed: false
                }
            ],
            ...config
        });
    }
    
    // Export to JSON
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            long_description: this.long_description,
            type: this.type,
            category: this.category,
            difficulty: this.difficulty,
            level_requirement: this.level_requirement,
            narrative: this.narrative,
            giver: this.giver,
            involved_npcs: this.involved_npcs,
            target_npcs: this.target_npcs,
            prerequisites: this.prerequisites,
            objectives: this.objectives,
            rewards: this.rewards,
            status: this.status,
            can_abandon: this.can_abandon,
            repeatable: this.repeatable,
            time_limit: this.time_limit,
            cooldown: this.cooldown,
            branches: this.branches,
            world_effects: this.world_effects,
            locations_involved: this.locations_involved,
            start_location: this.start_location,
            turn_in_location: this.turn_in_location,
            created_by: this.created_by,
            creation_date: this.creation_date,
            last_modified: this.last_modified,
            tags: this.tags,
            player_data: this.player_data
        };
    }
}

module.exports = Quest;