/**
 * Daily Story Evolution Service
 * Automatically expands and evolves the game story based on player actions,
 * world state, and AI-generated narrative developments
 */

const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const { getInstance: getAIService } = require('./AIContentService');
const GameLogger = require('../utils/logger');

class DailyStoryEvolution {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.aiService = getAIService();
        this.storyStatePath = '/var/www/mudlands/app/mudlands_ai_analysis/world_data/story_state.json';
        this.evolutionLogPath = '/var/www/mudlands/app/mudlands_ai_analysis/implementation_logs/story_evolution.log';
        
        // Track player actions for story influence
        this.playerActionLog = [];
        this.maxActionLogSize = 100;
        
        // Evolution happens daily at specific times
        this.evolutionSchedule = [
            { hour: 6, type: 'morning_shift' },      // 6 AM
            { hour: 12, type: 'midday_event' },      // Noon
            { hour: 18, type: 'evening_development' }, // 6 PM
            { hour: 23, type: 'night_progression' }   // 11 PM
        ];
        
        this.isRunning = false;
        this.lastEvolutionTime = null;
        
        GameLogger.info('DailyStoryEvolution service initialized');
    }
    
    /**
     * Start the automated story evolution system
     */
    async start() {
        if (this.isRunning) {
            GameLogger.warn('DailyStoryEvolution already running');
            return;
        }
        
        this.isRunning = true;
        GameLogger.info('Starting DailyStoryEvolution service');
        
        // Check for evolution every 5 minutes
        this.evolutionInterval = setInterval(() => {
            this.checkAndEvolve();
        }, 5 * 60 * 1000); // 5 minutes
        
        // Run initial check
        await this.checkAndEvolve();
    }
    
    /**
     * Stop the evolution service
     */
    stop() {
        if (this.evolutionInterval) {
            clearInterval(this.evolutionInterval);
            this.evolutionInterval = null;
        }
        
        this.isRunning = false;
        GameLogger.info('DailyStoryEvolution service stopped');
    }
    
    /**
     * Log player action for story influence
     */
    logPlayerAction(playerId, actionType, details) {
        this.playerActionLog.unshift({
            playerId,
            playerName: details.playerName || 'Unknown',
            actionType,
            details,
            timestamp: Date.now()
        });
        
        // Keep log size manageable
        if (this.playerActionLog.length > this.maxActionLogSize) {
            this.playerActionLog = this.playerActionLog.slice(0, this.maxActionLogSize);
        }
        
        // Important actions trigger immediate story reactions
        const importantActions = ['quest_completed', 'boss_defeated', 'faction_joined', 'item_discovered'];
        if (importantActions.includes(actionType)) {
            this.reactToPlayerAction(playerId, actionType, details);
        }
    }
    
    /**
     * Check if it's time to evolve and execute evolution
     */
    async checkAndEvolve() {
        const now = new Date();
        const currentHour = now.getHours();
        
        // Check if we're at a scheduled evolution time
        const scheduledEvolution = this.evolutionSchedule.find(s => s.hour === currentHour);
        
        if (scheduledEvolution) {
            const lastEvolutionDate = this.lastEvolutionTime ? new Date(this.lastEvolutionTime) : null;
            
            // Only evolve once per hour
            if (!lastEvolutionDate || 
                lastEvolutionDate.getDate() !== now.getDate() ||
                lastEvolutionDate.getHours() !== currentHour) {
                
                await this.evolveStory(scheduledEvolution.type);
                this.lastEvolutionTime = now.getTime();
            }
        }
    }
    
    /**
     * Main story evolution logic
     */
    async evolveStory(evolutionType) {
        try {
            GameLogger.info(`Executing story evolution: ${evolutionType}`);
            
            // Load current story state
            const storyState = await this.loadStoryState();
            
            // Gather world data
            const worldData = await this.gatherWorldData();
            
            // Generate AI-powered story developments
            const developments = await this.generateStoryDevelopments(
                storyState,
                worldData,
                evolutionType
            );
            
            // Apply developments to world
            await this.applyStoryDevelopments(developments);
            
            // Update story state
            await this.updateStoryState(storyState, developments);
            
            // Log evolution
            await this.logEvolution(evolutionType, developments);
            
            GameLogger.info(`Story evolution completed: ${developments.length} developments applied`);
            
        } catch (error) {
            GameLogger.error('Story evolution failed', error);
        }
    }
    
    /**
     * Load current story state from file
     */
    async loadStoryState() {
        try {
            const data = await fs.readFile(this.storyStatePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            GameLogger.error('Failed to load story state', error);
            return this.getDefaultStoryState();
        }
    }
    
    /**
     * Gather current world data for AI context
     */
    async gatherWorldData() {
        const players = Array.from(this.gameEngine.players.values());
        
        return {
            playerCount: players.length,
            activePlayers: players.map(p => ({
                name: p.name,
                level: p.level,
                location: p.location,
                quests: p.activeQuests?.length || 0
            })),
            recentActions: this.playerActionLog.slice(0, 20),
            worldTime: this.gameEngine.world?.time || { day: 1, hour: 12 },
            weather: this.gameEngine.world?.weather || 'clear',
            activeNPCs: this.gameEngine.world?.activeNPCs || []
        };
    }
    
    /**
     * Use AI to generate story developments
     */
    async generateStoryDevelopments(storyState, worldData, evolutionType) {
        const developments = [];
        
        // Generate faction tension shifts based on player actions
        const factionDevelopment = await this.generateFactionDevelopment(storyState, worldData);
        if (factionDevelopment) developments.push(factionDevelopment);
        
        // Progress active plots
        for (const plot of storyState.active_plots || []) {
            const plotDevelopment = await this.progressPlot(plot, worldData);
            if (plotDevelopment) developments.push(plotDevelopment);
        }
        
        // Generate new events based on milestones
        const newEvents = await this.checkMilestones(storyState, worldData);
        developments.push(...newEvents);
        
        // AI-powered NPC developments
        if (evolutionType === 'evening_development' || evolutionType === 'night_progression') {
            const npcDevelopments = await this.generateNPCDevelopments(storyState, worldData);
            developments.push(...npcDevelopments);
        }
        
        return developments;
    }
    
    /**
     * Generate faction relationship changes
     */
    async generateFactionDevelopment(storyState, worldData) {
        // Analyze recent player actions affecting factions
        const factionActions = this.playerActionLog.filter(a => 
            a.actionType === 'npc_interaction' || 
            a.actionType === 'quest_completed' ||
            a.actionType === 'faction_choice'
        );
        
        if (factionActions.length === 0) return null;
        
        // Use AI to determine how factions should evolve
        const context = `
Player Actions: ${JSON.stringify(factionActions.slice(0, 5))}
Current Tensions: ${JSON.stringify(storyState.faction_tensions)}
World State: ${storyState.currentPhase}
        `;
        
        try {
            const aiResponse = await this.aiService.generateContent('faction_development', {
                context,
                tensions: JSON.stringify(storyState.faction_tensions)
            });
            
            return {
                type: 'faction_shift',
                changes: aiResponse.changes || {},
                narrative: aiResponse.narrative || 'The political landscape shifts.'
            };
        } catch (error) {
            GameLogger.warn('AI faction development failed, using fallback');
            return null;
        }
    }
    
    /**
     * Progress an active plot thread
     */
    async progressPlot(plot, worldData) {
        // Check if players have triggered the next phase
        const relevantActions = this.playerActionLog.filter(a => 
            this.isRelevantToPlot(a, plot)
        );
        
        if (relevantActions.length > 0 || Math.random() < 0.3) {
            // Progress the plot
            return {
                type: 'plot_progression',
                plotId: plot.id,
                previousPhase: plot.phase,
                newPhase: this.getNextPlotPhase(plot.phase),
                progress: Math.min(plot.progress + 10, 100),
                event: `The ${plot.id} story advances...`
            };
        }
        
        return null;
    }
    
    /**
     * Check if an action is relevant to a plot
     */
    isRelevantToPlot(action, plot) {
        // Check if action involves key characters
        if (plot.key_characters) {
            for (const npcId of plot.key_characters) {
                if (action.details?.npcId === npcId || 
                    action.details?.npcName?.toLowerCase().includes(npcId.toLowerCase())) {
                    return true;
                }
            }
        }
        
        // Check if action matches the next trigger
        if (plot.next_trigger && action.actionType === plot.next_trigger) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Get next phase for a plot
     */
    getNextPlotPhase(currentPhase) {
        const phaseProgression = {
            'discovery': 'investigation',
            'investigation': 'confrontation',
            'confrontation': 'resolution',
            'hidden': 'discovery',
            'tension': 'conflict',
            'conflict': 'resolution'
        };
        
        return phaseProgression[currentPhase] || 'escalation';
    }
    
    /**
     * Check for milestone triggers
     */
    async checkMilestones(storyState, worldData) {
        const events = [];
        
        for (const [key, milestone] of Object.entries(storyState.milestone_triggers || {})) {
            if (milestone.triggered) continue;
            
            // Check if milestone condition is met
            const [metric, threshold] = key.split('_').slice(0, -1).join('_').split('_');
            const currentValue = storyState.faction_tensions?.[metric] || 0;
            const thresholdValue = parseInt(key.match(/\d+$/)[0]);
            
            if (currentValue >= thresholdValue) {
                events.push({
                    type: 'milestone_triggered',
                    milestoneKey: key,
                    event: milestone.event,
                    description: milestone.description,
                    triggeredAt: Date.now()
                });
            }
        }
        
        return events;
    }
    
    /**
     * Generate NPC-driven story developments
     */
    async generateNPCDevelopments(storyState, worldData) {
        const developments = [];
        
        // Each NPC can generate rumors, start events, or shift relationships
        const activeNPCs = worldData.activeNPCs || [];
        
        for (const npc of activeNPCs.slice(0, 3)) { // Limit to 3 NPCs per evolution
            if (Math.random() < 0.4) { // 40% chance per NPC
                developments.push({
                    type: 'npc_initiative',
                    npcId: npc.id,
                    action: this.generateNPCAction(npc, storyState),
                    timestamp: Date.now()
                });
            }
        }
        
        return developments;
    }
    
    /**
     * Generate an action for an NPC
     */
    generateNPCAction(npc, storyState) {
        const actions = [
            { type: 'spreads_rumor', description: `${npc.name} shares interesting news with locals` },
            { type: 'makes_request', description: `${npc.name} seeks help with a personal matter` },
            { type: 'reveals_information', description: `${npc.name} reveals something they've been keeping secret` },
            { type: 'changes_behavior', description: `${npc.name} starts acting differently` }
        ];
        
        return actions[Math.floor(Math.random() * actions.length)];
    }
    
    /**
     * Apply story developments to the game world
     */
    async applyStoryDevelopments(developments) {
        for (const dev of developments) {
            switch (dev.type) {
                case 'faction_shift':
                    this.applyFactionChanges(dev.changes);
                    this.broadcastStoryEvent(dev.narrative);
                    break;
                    
                case 'plot_progression':
                    this.updatePlotProgress(dev);
                    break;
                    
                case 'milestone_triggered':
                    await this.triggerMilestoneEvent(dev);
                    break;
                    
                case 'npc_initiative':
                    this.handleNPCInitiative(dev);
                    break;
            }
        }
    }
    
    /**
     * Apply faction relationship changes
     */
    applyFactionChanges(changes) {
        // Update faction tensions in world
        for (const [faction, change] of Object.entries(changes)) {
            if (this.gameEngine.world?.factions?.[faction]) {
                this.gameEngine.world.factions[faction].tension += change;
            }
        }
    }
    
    /**
     * Broadcast a story event to all players
     */
    broadcastStoryEvent(message) {
        const players = Array.from(this.gameEngine.players.values());
        
        for (const player of players) {
            if (player.socketId) {
                this.gameEngine.emit('messageToPlayer', {
                    playerId: player.id,
                    message: chalk.yellow(`[WORLD EVENT] ${message}`)
                });
            }
        }
        
        GameLogger.info('Story event broadcasted', { message });
    }
    
    /**
     * Update plot progress
     */
    updatePlotProgress(development) {
        // Find and update the plot in game engine
        GameLogger.info('Plot progressed', {
            plotId: development.plotId,
            phase: development.newPhase,
            progress: development.progress
        });
    }
    
    /**
     * Trigger a milestone event
     */
    async triggerMilestoneEvent(milestone) {
        GameLogger.info('Milestone triggered', {
            event: milestone.event,
            description: milestone.description
        });
        
        this.broadcastStoryEvent(milestone.description);
        
        // Spawn related NPCs or quests
        // This is where you'd create dynamic content based on the event
    }
    
    /**
     * Handle NPC taking initiative
     */
    handleNPCInitiative(development) {
        GameLogger.info('NPC initiative', {
            npcId: development.npcId,
            action: development.action.type
        });
        
        // NPCs could start conversations, offer quests, or trigger events
    }
    
    /**
     * Update and save story state
     */
    async updateStoryState(storyState, developments) {
        // Increment day if midnight passed
        const now = new Date();
        if (now.getHours() === 0) {
            storyState.day = (storyState.day || 1) + 1;
        }
        
        // Apply developments to state
        for (const dev of developments) {
            if (dev.type === 'milestone_triggered') {
                storyState.milestone_triggers[dev.milestoneKey].triggered = true;
            }
            
            if (dev.type === 'plot_progression') {
                const plot = storyState.active_plots.find(p => p.id === dev.plotId);
                if (plot) {
                    plot.phase = dev.newPhase;
                    plot.progress = dev.progress;
                }
            }
        }
        
        // Add recent events
        storyState.world_events = storyState.world_events || [];
        storyState.world_events.unshift({
            timestamp: Date.now(),
            developments: developments.length,
            summary: this.summarizeDevelopments(developments)
        });
        
        // Keep only last 30 events
        storyState.world_events = storyState.world_events.slice(0, 30);
        
        // Save to file
        try {
            await fs.writeFile(
                this.storyStatePath,
                JSON.stringify(storyState, null, 2),
                'utf8'
            );
            GameLogger.info('Story state updated and saved');
        } catch (error) {
            GameLogger.error('Failed to save story state', error);
        }
    }
    
    /**
     * Summarize developments for logging
     */
    summarizeDevelopments(developments) {
        const types = developments.map(d => d.type);
        const counts = {};
        
        for (const type of types) {
            counts[type] = (counts[type] || 0) + 1;
        }
        
        return Object.entries(counts)
            .map(([type, count]) => `${count}x ${type}`)
            .join(', ');
    }
    
    /**
     * Log evolution for debugging and tracking
     */
    async logEvolution(evolutionType, developments) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            evolutionType,
            developmentCount: developments.length,
            developments: developments.map(d => ({
                type: d.type,
                summary: d.description || d.narrative || d.event || 'No description'
            }))
        };
        
        try {
            const logLine = JSON.stringify(logEntry) + '\n';
            await fs.appendFile(this.evolutionLogPath, logLine, 'utf8');
        } catch (error) {
            GameLogger.warn('Failed to write evolution log', error);
        }
    }
    
    /**
     * React to important player actions immediately
     */
    async reactToPlayerAction(playerId, actionType, details) {
        GameLogger.info('Immediate story reaction triggered', {
            playerId,
            actionType,
            details
        });
        
        // This is where you'd generate immediate story consequences
        // For example, completing a quest might immediately affect faction relations
    }
    
    /**
     * Get default story state
     */
    getDefaultStoryState() {
        return {
            day: 1,
            currentPhase: 'beginning',
            faction_tensions: {},
            active_plots: [],
            world_events: [],
            milestone_triggers: {}
        };
    }
}

module.exports = DailyStoryEvolution;
