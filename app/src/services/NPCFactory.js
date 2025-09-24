const NPC = require('../models/NPC');
const { getInstance: getAIService } = require('./AIContentService');
const GameLogger = require('../utils/logger');

class NPCFactory {
    constructor() {
        this.aiService = getAIService();
        this.templates = new Map();
        this.loadTemplates();
    }
    
    loadTemplates() {
        // Template NPCs for fallback and quick generation
        this.templates.set('merchant', {
            race: 'human',
            personality: {
                values: ['profit', 'fairness'],
                objectives: ['expand business'],
                identity: 'merchant',
                conflicts: ['competition'],
                emotions: ['opportunistic', 'calculating']
            },
            knowledge: {
                topics: ['trade', 'prices', 'regional goods'],
                specialties: ['commerce', 'market trends']
            }
        });
        
        this.templates.set('guard', {
            race: 'human',
            personality: {
                values: ['duty', 'law'],
                objectives: ['maintain order'],
                identity: 'town guard',
                conflicts: ['criminals', 'troublemakers'],
                emotions: ['vigilant', 'stern']
            },
            knowledge: {
                topics: ['local laws', 'security', 'criminals'],
                specialties: ['combat', 'investigation']
            }
        });
        
        this.templates.set('innkeeper', {
            race: 'human',
            personality: {
                values: ['hospitality', 'community'],
                objectives: ['serve travelers'],
                identity: 'innkeeper',
                conflicts: ['rowdy customers'],
                emotions: ['welcoming', 'sociable']
            },
            knowledge: {
                topics: ['local news', 'travelers', 'food'],
                specialties: ['gossip', 'regional cuisine']
            }
        });
    }
    
    async generateNPC(config = {}) {
        const {
            location = 'unknown location',
            type = 'commoner',
            importance = 'minor',
            useAI = true,
            context = '',
            template = null
        } = config;
        
        GameLogger.debug('Generating NPC', { location, type, importance, useAI });
        
        try {
            let npcData = null;
            
            if (useAI && this.aiService.enabled) {
                // Try AI generation first
                npcData = await this.generateWithAI(location, type, importance, context);
            }
            
            // Fallback to template generation if AI fails or is disabled
            if (!npcData) {
                npcData = this.generateFromTemplate(template || type);
            }
            
            // Create NPC instance
            const npc = new NPC(npcData);
            
            // Post-process the NPC
            this.enhanceNPC(npc, { location, type, importance });
            
            GameLogger.info('NPC generated successfully', { 
                name: npc.name, 
                type, 
                location, 
                aiGenerated: !!npcData.aiGenerated 
            });
            
            return npc;
            
        } catch (error) {
            GameLogger.error('Failed to generate NPC', error, { location, type });
            
            // Emergency fallback
            return this.createBasicNPC(type);
        }
    }
    
    async generateWithAI(location, type, importance, context) {
        try {
            const aiData = await this.aiService.generateNPC(location, type, importance, context);
            
            if (!aiData || !aiData.name) {
                return null;
            }
            
            // Convert AI response to NPC format
            const npcData = {
                name: aiData.name,
                race: aiData.race || 'human',
                gender: aiData.gender || 'neutral',
                age: aiData.age || 'adult',
                aiGenerated: true,
                
                appearance: {
                    height: aiData.appearance?.height || 'average height',
                    build: aiData.appearance?.build || 'average build',
                    hair: aiData.appearance?.hair || 'brown hair',
                    eyes: aiData.appearance?.eyes || 'brown eyes',
                    clothing: aiData.appearance?.clothing || aiData.appearance?.description || 'simple clothes',
                    distinguishing: aiData.appearance?.distinguishing_marks ? 
                        [aiData.appearance.distinguishing_marks] : []
                },
                
                personality: {
                    values: this.extractValues(aiData.personality),
                    objectives: this.extractObjectives(aiData.personality),
                    identity: aiData.class || aiData.occupation || type,
                    conflicts: this.extractConflicts(aiData.personality),
                    emotions: this.extractEmotions(aiData.personality)
                },
                
                speech: {
                    greeting: aiData.dialogue?.greeting || "Hello there.",
                    farewell: aiData.dialogue?.farewell || "Farewell.",
                    patterns: this.extractSpeechPatterns(aiData.personality?.mannerisms),
                    vocabulary: this.determineVocabulary(aiData.class, aiData.race),
                    accent: this.determineAccent(aiData.race)
                },
                
                knowledge: {
                    topics: aiData.knowledge?.local ? [aiData.knowledge.local] : ['local area'],
                    secrets: aiData.knowledge?.secrets ? [aiData.knowledge.secrets] : [],
                    rumors: aiData.knowledge?.rumors ? [aiData.knowledge.rumors] : [],
                    specialties: aiData.knowledge?.services ? [aiData.knowledge.services] : []
                },
                
                relationships: {
                    family: {},
                    friends: [],
                    enemies: [],
                    professional: aiData.knowledge?.relationships || {}
                },
                
                occupation: {
                    profession: aiData.class || aiData.occupation || type,
                    workplace: location,
                    skills: aiData.stats?.relevant_skills || [],
                    schedule: this.generateSchedule(aiData.class || type)
                },
                
                stats: {
                    level: aiData.stats?.level || 1,
                    hp: aiData.stats?.hp || 10,
                    ac: aiData.stats?.ac || 10
                }
            };
            
            return npcData;
            
        } catch (error) {
            GameLogger.warn('AI NPC generation failed, falling back to template', error);
            return null;
        }
    }
    
    generateFromTemplate(templateType) {
        const template = this.templates.get(templateType) || this.templates.get('merchant');
        
        const names = {
            human: ['Aldric', 'Brenna', 'Cedric', 'Diana', 'Edon', 'Fara', 'Gareth', 'Hilda'],
            elf: ['Aerdrie', 'Berrian', 'Caelynn', 'Dayereth', 'Enna', 'Fhaertala'],
            dwarf: ['Adrik', 'Baern', 'Darrak', 'Eberk', 'Fargrim', 'Gardain'],
            halfling: ['Alton', 'Beau', 'Cade', 'Daisy', 'Errich', 'Finnan']
        };
        
        const race = template.race || 'human';
        const nameList = names[race] || names.human;
        const name = nameList[Math.floor(Math.random() * nameList.length)];
        
        return {
            name: name + ' ' + this.generateSurname(race),
            race: race,
            personality: template.personality,
            knowledge: template.knowledge,
            occupation: {
                profession: templateType,
                workplace: 'local area'
            },
            speech: {
                greeting: this.generateGreeting(templateType),
                farewell: "Farewell, friend."
            }
        };
    }
    
    generateSurname(race) {
        const surnames = {
            human: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis'],
            elf: ['Silverleaf', 'Moonwhisper', 'Starweaver', 'Nightbreeze', 'Dawnstrider'],
            dwarf: ['Ironforge', 'Stonebeard', 'Goldaxe', 'Hammerfist', 'Deepdelver'],
            halfling: ['Goodbarrel', 'Lightfinger', 'Greenbottle', 'Thornfield', 'Underhill']
        };
        
        const list = surnames[race] || surnames.human;
        return list[Math.floor(Math.random() * list.length)];
    }
    
    generateGreeting(type) {
        const greetings = {
            merchant: "Welcome to my shop! What can I interest you in today?",
            guard: "State your business, traveler.",
            innkeeper: "Welcome to our establishment! Are you looking for a room?",
            commoner: "Good day to you, stranger."
        };
        
        return greetings[type] || greetings.commoner;
    }
    
    createBasicNPC(type) {
        return new NPC({
            name: 'Unnamed ' + (type || 'Villager'),
            race: 'human',
            personality: {
                identity: type || 'villager'
            },
            speech: {
                greeting: "Hello there."
            }
        });
    }
    
    enhanceNPC(npc, config) {
        // Add location-specific knowledge
        if (config.location && config.location !== 'unknown location') {
            if (!npc.knowledge.topics.includes(config.location)) {
                npc.knowledge.topics.push(config.location);
            }
        }
        
        // Set importance-based traits
        if (config.importance === 'major') {
            npc.trust_level = Math.max(npc.trust_level || 0, 20);
            npc.interaction_count = Math.max(npc.interaction_count || 0, 5);
        } else if (config.importance === 'minor') {
            npc.trust_level = Math.min(npc.trust_level || 0, 10);
        }
        
        // Add default values if missing
        npc.trust_level = npc.trust_level || 0;
        npc.interaction_count = npc.interaction_count || 0;
        npc.reputation_modifiers = npc.reputation_modifiers || {};
        npc.memory = npc.memory || [];
        npc.current_mood = npc.current_mood || 'neutral';
    }
    
    generateSchedule(profession) {
        const schedules = {
            merchant: {
                '08:00': 'Open shop',
                '12:00': 'Lunch break',
                '13:00': 'Resume business',
                '18:00': 'Close shop',
                '19:00': 'Evening meal'
            },
            guard: {
                '06:00': 'Morning patrol',
                '14:00': 'Afternoon shift',
                '22:00': 'Night watch',
                '02:00': 'Rest period'
            },
            innkeeper: {
                '05:00': 'Prepare breakfast',
                '08:00': 'Serve guests',
                '14:00': 'Clean rooms',
                '18:00': 'Evening service',
                '23:00': 'Last call'
            }
        };
        
        return schedules[profession] || schedules.merchant;
    }
    
    // Helper methods for AI data extraction
    extractValues(personality) {
        if (!personality) return ['survival'];
        
        const values = [];
        if (personality.ideals) values.push(personality.ideals);
        if (personality.traits && Array.isArray(personality.traits)) {
            values.push(...personality.traits);
        }
        
        return values.length > 0 ? values : ['survival'];
    }
    
    extractObjectives(personality) {
        if (!personality) return ['get by each day'];
        
        if (personality.bonds) return [personality.bonds];
        if (personality.motivation) return [personality.motivation];
        
        return ['get by each day'];
    }
    
    extractConflicts(personality) {
        if (!personality) return ['daily struggles'];
        
        if (personality.flaws) return [personality.flaws];
        
        return ['daily struggles'];
    }
    
    extractEmotions(personality) {
        if (!personality) return ['neutral'];
        
        if (personality.traits && Array.isArray(personality.traits)) {
            return personality.traits.slice(0, 2);
        }
        
        if (typeof personality === 'string') {
            return [personality];
        }
        
        return ['neutral'];
    }
    
    extractSpeechPatterns(mannerisms) {
        if (!mannerisms) return [];
        
        if (typeof mannerisms === 'string') {
            return [mannerisms];
        }
        
        return [];
    }
    
    determineVocabulary(profession, race) {
        const vocabularies = {
            merchant: 'business',
            guard: 'military',
            scholar: 'academic',
            noble: 'formal',
            peasant: 'simple'
        };
        
        return vocabularies[profession] || 'common';
    }
    
    determineAccent(race) {
        const accents = {
            dwarf: 'gruff',
            elf: 'melodic',
            halfling: 'cheerful',
            human: 'none'
        };
        
        return accents[race] || 'none';
    }
    
    // Batch generation methods
    async generateNPCGroup(count, config = {}) {
        const npcs = [];
        const promises = [];
        
        for (let i = 0; i < count; i++) {
            promises.push(this.generateNPC({
                ...config,
                useAI: config.useAI !== false && i < Math.ceil(count * 0.3) // Use AI for 30% of NPCs
            }));
        }
        
        try {
            const results = await Promise.allSettled(promises);
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    npcs.push(result.value);
                } else {
                    GameLogger.error(`Failed to generate NPC ${index + 1}`, result.reason);
                    npcs.push(this.createBasicNPC(config.type));
                }
            });
            
        } catch (error) {
            GameLogger.error('Batch NPC generation failed', error);
        }
        
        return npcs;
    }
    
    // Static convenience methods
    static async createMerchant(location, useAI = true) {
        const factory = new NPCFactory();
        return factory.generateNPC({
            location,
            type: 'merchant',
            importance: 'major',
            useAI,
            context: 'Experienced trader with valuable goods and information'
        });
    }
    
    static async createGuard(location, useAI = true) {
        const factory = new NPCFactory();
        return factory.generateNPC({
            location,
            type: 'guard',
            importance: 'major',
            useAI,
            context: 'Dutiful guard responsible for maintaining order and security'
        });
    }
    
    static async createVillager(location, useAI = false) {
        const factory = new NPCFactory();
        return factory.generateNPC({
            location,
            type: 'commoner',
            importance: 'minor',
            useAI,
            context: 'Simple villager going about their daily life'
        });
    }
}

module.exports = NPCFactory;