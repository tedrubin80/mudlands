const redis = require('redis');
const GameLogger = require('../utils/logger');

class AIContentService {
    constructor() {
        this.enabled = process.env.AI_ENABLED === 'true';
        this.ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
        this.model = process.env.OLLAMA_MODEL || 'llama3.1:8b';
        this.fallbackToStatic = process.env.AI_FALLBACK_TO_STATIC !== 'false';
        this.requestTimeout = parseInt(process.env.AI_REQUEST_TIMEOUT) || 30000;
        this.maxRetries = parseInt(process.env.AI_MAX_RETRIES) || 3;
        this.cacheTTL = parseInt(process.env.AI_CACHE_TTL) || 3600;
        
        // Rate limiting
        this.rateLimit = parseInt(process.env.AI_RATE_LIMIT_PER_MINUTE) || 30;
        this.requestQueue = [];
        this.queueMaxSize = parseInt(process.env.AI_QUEUE_MAX_SIZE) || 100;
        this.requestCount = 0;
        this.lastResetTime = Date.now();
        
        // Circuit breaker
        this.circuitState = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.failureThreshold = 5;
        this.circuitResetTimeout = 60000; // 1 minute
        this.lastFailureTime = null;
        
        // Initialize Redis cache
        this.initializeCache();
        
        // Initialize prompt templates
        this.promptTemplates = new Map();
        this.loadPromptTemplates();
        
        GameLogger.info('AIContentService initialized', {
            enabled: this.enabled,
            model: this.model,
            ollamaHost: this.ollamaHost
        });
    }
    
    async initializeCache() {
        if (!this.enabled) return;
        
        try {
            this.cacheClient = redis.createClient({
                socket: {
                    host: process.env.AI_REDIS_HOST || 'localhost',
                    port: parseInt(process.env.AI_REDIS_PORT) || 6380
                },
                database: parseInt(process.env.AI_REDIS_DB) || 0
            });
            
            this.cacheClient.on('error', (err) => {
                GameLogger.error('AI Redis cache error', err);
            });
            
            this.cacheClient.on('connect', () => {
                GameLogger.info('AI Redis cache connected');
            });
            
            await this.cacheClient.connect();
        } catch (error) {
            GameLogger.error('Failed to initialize AI cache', error);
            this.cacheClient = null;
        }
    }
    
    loadPromptTemplates() {
        // D&D 5e aligned prompt templates
        this.promptTemplates.set('npc', {
            system: `You are a D&D 5e content generator. Create NPCs with personality, motivations, and backstories that fit a medieval fantasy world. Include alignment, personality traits, ideals, bonds, and flaws.`,
            template: `Generate a D&D 5e NPC with the following specifications:
Location: {location}
Type: {type}
Level of Importance: {importance}
Context: {context}

Provide the response in JSON format with these fields:
- name: Full name
- race: D&D 5e race
- class: Their occupation or class if applicable
- alignment: D&D alignment
- personality: Brief personality description
- dialogue: An object with greeting, idle, and quest dialogue options
- knowledge: What this NPC knows about the local area
- secrets: Any secrets they might share with trusted players
- stats: Basic stats (level, hp, ac)
- inventory: Items they carry for trade or quest rewards`
        });
        
        this.promptTemplates.set('quest', {
            system: `You are a D&D 5e quest designer. Create engaging quests with clear objectives, meaningful rewards, and interesting narrative hooks. Ensure quests are level-appropriate and balanced.`,
            template: `Create a D&D 5e quest with these parameters:
Player Level: {level}
Quest Type: {type}
Location: {location}
Difficulty: {difficulty}
Current World State: {worldState}

Provide the response in JSON format with:
- title: Quest name
- description: Detailed quest description
- objectives: Array of objectives with descriptions
- rewards: Experience, gold, and items
- prerequisites: Any required quests or conditions
- dialogue: NPC dialogue for quest giving and completion
- consequences: How this quest affects the world`
        });
        
        this.promptTemplates.set('monster', {
            system: `You are a D&D 5e monster creator. Generate balanced monsters appropriate for the challenge rating. Include abilities, behaviors, and loot that make sense for the creature type.`,
            template: `Create a D&D 5e monster with:
Challenge Rating: {cr}
Environment: {environment}
Type: {type}
Role: {role}

Provide JSON with:
- name: Monster name
- type: Creature type (beast, undead, etc.)
- alignment: Monster alignment
- stats: AC, HP, Speed, STR, DEX, CON, INT, WIS, CHA
- abilities: Special abilities and attacks
- behavior: Combat behavior and tactics
- loot: Items dropped on defeat
- description: Physical appearance and lore`
        });
        
        this.promptTemplates.set('item', {
            system: `You are a D&D 5e item designer. Create balanced magical and mundane items with interesting properties and lore. Ensure items are appropriate for their rarity level.`,
            template: `Design a D&D 5e item:
Rarity: {rarity}
Type: {type}
Level Requirement: {level}
Theme: {theme}

Provide JSON with:
- name: Item name
- type: Weapon, armor, consumable, etc.
- rarity: Common, uncommon, rare, very rare, legendary
- description: Physical description and lore
- stats: Damage, AC bonus, or other mechanical benefits
- properties: Special magical properties if any
- value: Gold piece value
- requirements: Class, level, or stat requirements
- cursed: Boolean indicating if item is cursed`
        });
        
        this.promptTemplates.set('room', {
            system: `You are a D&D dungeon master describing locations. Create vivid, atmospheric descriptions that engage the senses and hint at possibilities for exploration and interaction.`,
            template: `Describe this location:
Name: {name}
Type: {type}
Current State: {state}
Time of Day: {timeOfDay}
Weather: {weather}
Recent Events: {events}

Provide JSON with:
- description: Atmospheric description of the room
- sensory: What players see, hear, smell, feel
- points_of_interest: Notable features to investigate
- hidden: Secret areas or items (requiring perception checks)
- atmosphere: The mood and feeling of the location
- dynamic_elements: Things that change based on player actions`
        });
    }
    
    async generateContent(type, parameters) {
        if (!this.enabled) {
            return this.getFallbackContent(type, parameters);
        }
        
        // Check circuit breaker
        if (this.circuitState === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.circuitResetTimeout) {
                this.circuitState = 'HALF_OPEN';
                this.failureCount = 0;
            } else {
                GameLogger.warn('Circuit breaker OPEN, using fallback content');
                return this.getFallbackContent(type, parameters);
            }
        }
        
        // Check rate limit
        if (!this.checkRateLimit()) {
            GameLogger.warn('Rate limit exceeded, queueing request');
            return this.queueRequest(type, parameters);
        }
        
        // Check cache first
        const cacheKey = this.generateCacheKey(type, parameters);
        const cached = await this.getFromCache(cacheKey);
        if (cached) {
            GameLogger.debug('AI content cache hit', { type, cacheKey });
            return cached;
        }
        
        try {
            // Generate new content
            const content = await this.callOllama(type, parameters);
            
            // Reset circuit breaker on success
            if (this.circuitState === 'HALF_OPEN') {
                this.circuitState = 'CLOSED';
                this.failureCount = 0;
            }
            
            // Cache the result
            await this.saveToCache(cacheKey, content);
            
            return content;
            
        } catch (error) {
            this.handleGenerationError(error);
            
            if (this.fallbackToStatic) {
                return this.getFallbackContent(type, parameters);
            }
            
            throw error;
        }
    }
    
    async callOllama(type, parameters) {
        const template = this.promptTemplates.get(type);
        if (!template) {
            throw new Error(`Unknown content type: ${type}`);
        }
        
        // Build the prompt
        let prompt = template.template;
        for (const [key, value] of Object.entries(parameters)) {
            prompt = prompt.replace(`{${key}}`, value);
        }
        
        const requestBody = {
            model: this.model,
            prompt: prompt,
            system: template.system,
            stream: false,
            options: {
                temperature: 0.7,
                top_p: 0.9,
                max_tokens: 2000
            }
        };
        
        // Make the API call with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.requestTimeout);
        
        try {
            const response = await fetch(`${this.ollamaHost}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });
            
            clearTimeout(timeout);
            
            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Parse the response as JSON
            try {
                const content = JSON.parse(data.response);
                return this.validateContent(type, content);
            } catch (parseError) {
                // If not valid JSON, wrap in appropriate structure
                return this.formatRawResponse(type, data.response);
            }
            
        } catch (error) {
            clearTimeout(timeout);
            
            if (error.name === 'AbortError') {
                throw new Error('AI request timeout');
            }
            
            throw error;
        }
    }
    
    validateContent(type, content) {
        // Basic validation based on content type
        const validators = {
            npc: ['name', 'race', 'personality'],
            quest: ['title', 'description', 'objectives'],
            monster: ['name', 'stats', 'abilities'],
            item: ['name', 'type', 'description'],
            room: ['description', 'sensory']
        };
        
        const required = validators[type];
        if (required) {
            for (const field of required) {
                if (!content[field]) {
                    GameLogger.warn(`AI content missing required field: ${field}`, { type });
                }
            }
        }
        
        return content;
    }
    
    formatRawResponse(type, rawText) {
        // Fallback formatting for non-JSON responses
        const formatted = {
            type: type,
            generated: true,
            content: rawText,
            timestamp: Date.now()
        };
        
        return formatted;
    }
    
    async getFromCache(key) {
        if (!this.cacheClient) return null;
        
        try {
            const cached = await this.cacheClient.get(key);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (error) {
            GameLogger.error('Cache retrieval error', error);
        }
        
        return null;
    }
    
    async saveToCache(key, content) {
        if (!this.cacheClient) return;
        
        try {
            await this.cacheClient.setEx(
                key,
                this.cacheTTL,
                JSON.stringify(content)
            );
        } catch (error) {
            GameLogger.error('Cache save error', error);
        }
    }
    
    generateCacheKey(type, parameters) {
        const params = Object.keys(parameters)
            .sort()
            .map(k => `${k}:${parameters[k]}`)
            .join('|');
        
        return `ai:${type}:${params}`;
    }
    
    checkRateLimit() {
        const now = Date.now();
        const minuteElapsed = now - this.lastResetTime >= 60000;
        
        if (minuteElapsed) {
            this.requestCount = 0;
            this.lastResetTime = now;
        }
        
        if (this.requestCount >= this.rateLimit) {
            return false;
        }
        
        this.requestCount++;
        return true;
    }
    
    async queueRequest(type, parameters) {
        if (this.requestQueue.length >= this.queueMaxSize) {
            GameLogger.warn('AI request queue full, using fallback');
            return this.getFallbackContent(type, parameters);
        }
        
        return new Promise((resolve) => {
            this.requestQueue.push({
                type,
                parameters,
                resolve,
                timestamp: Date.now()
            });
            
            this.processQueue();
        });
    }
    
    async processQueue() {
        if (this.requestQueue.length === 0) return;
        
        if (!this.checkRateLimit()) {
            // Schedule retry after rate limit reset
            setTimeout(() => this.processQueue(), 60000);
            return;
        }
        
        const request = this.requestQueue.shift();
        try {
            const content = await this.generateContent(
                request.type,
                request.parameters
            );
            request.resolve(content);
        } catch (error) {
            request.resolve(this.getFallbackContent(
                request.type,
                request.parameters
            ));
        }
        
        // Process next item in queue
        if (this.requestQueue.length > 0) {
            setTimeout(() => this.processQueue(), 1000);
        }
    }
    
    handleGenerationError(error) {
        GameLogger.error('AI content generation failed', error);
        
        this.failureCount++;
        this.lastFailureTime = Date.now();
        
        if (this.failureCount >= this.failureThreshold) {
            this.circuitState = 'OPEN';
            GameLogger.warn('Circuit breaker opened due to repeated failures');
        }
    }
    
    getFallbackContent(type, parameters) {
        // Return static fallback content based on type
        const fallbacks = {
            npc: {
                name: 'Generic Villager',
                race: 'Human',
                personality: 'Friendly but cautious',
                dialogue: {
                    greeting: 'Hello, traveler.',
                    idle: 'Nice weather today.',
                    quest: 'I have nothing for you right now.'
                }
            },
            quest: {
                title: 'A Simple Task',
                description: 'Help needed with a basic task.',
                objectives: ['Complete the task'],
                rewards: { exp: 100, gold: 50 }
            },
            monster: {
                name: 'Wild Beast',
                stats: { hp: 20, ac: 12, cr: 1 },
                abilities: ['Bite', 'Claw'],
                loot: [{ name: 'Beast Hide', quantity: 1 }]
            },
            item: {
                name: 'Simple Item',
                type: 'misc',
                description: 'An ordinary item.',
                value: 10
            },
            room: {
                description: 'You see a typical room.',
                sensory: 'Nothing unusual catches your attention.'
            }
        };
        
        return fallbacks[type] || { error: 'No fallback available' };
    }
    
    // Public methods for specific content types
    async generateNPC(location, type = 'commoner', importance = 'minor', context = '') {
        return this.generateContent('npc', {
            location,
            type,
            importance,
            context
        });
    }
    
    async generateQuest(level, type = 'fetch', location = 'town', difficulty = 'medium', worldState = {}) {
        return this.generateContent('quest', {
            level,
            type,
            location,
            difficulty,
            worldState: JSON.stringify(worldState)
        });
    }
    
    async generateMonster(cr, environment = 'forest', type = 'beast', role = 'solo') {
        return this.generateContent('monster', {
            cr,
            environment,
            type,
            role
        });
    }
    
    async generateItem(rarity = 'common', type = 'weapon', level = 1, theme = 'standard') {
        return this.generateContent('item', {
            rarity,
            type,
            level,
            theme
        });
    }
    
    async enhanceRoomDescription(name, type = 'indoor', state = {}, timeOfDay = 'day', weather = 'clear', events = []) {
        return this.generateContent('room', {
            name,
            type,
            state: JSON.stringify(state),
            timeOfDay,
            weather,
            events: JSON.stringify(events)
        });
    }
    
    // Health check
    async healthCheck() {
        const health = {
            enabled: this.enabled,
            circuitState: this.circuitState,
            cacheConnected: this.cacheClient?.isReady || false,
            queueSize: this.requestQueue.length,
            requestCount: this.requestCount,
            failureCount: this.failureCount
        };
        
        // Test Ollama connection
        if (this.enabled) {
            try {
                const response = await fetch(`${this.ollamaHost}/api/tags`);
                health.ollamaConnected = response.ok;
            } catch (error) {
                health.ollamaConnected = false;
            }
        }
        
        return health;
    }
    
    // Cleanup
    async shutdown() {
        GameLogger.info('Shutting down AIContentService');
        
        if (this.cacheClient) {
            await this.cacheClient.quit();
        }
        
        // Clear queue
        this.requestQueue = [];
    }
}

// Singleton instance
let instance = null;

module.exports = {
    getInstance: () => {
        if (!instance) {
            instance = new AIContentService();
        }
        return instance;
    },
    
    AIContentService
};