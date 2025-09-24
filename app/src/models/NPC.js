const { v4: uuidv4 } = require('uuid');

class NPC {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.name = data.name || 'Unnamed NPC';
        this.title = data.title || '';
        this.race = data.race || 'human';
        this.gender = data.gender || 'neutral';
        this.age = data.age || 'adult';
        
        // Physical description
        this.appearance = {
            height: data.appearance?.height || 'average height',
            build: data.appearance?.build || 'average build',
            hair: data.appearance?.hair || 'brown hair',
            eyes: data.appearance?.eyes || 'brown eyes',
            clothing: data.appearance?.clothing || 'simple clothes',
            distinguishing: data.appearance?.distinguishing || []
        };
        
        // Personality using the VOICE method
        this.personality = {
            values: data.personality?.values || ['honesty', 'hard work'],
            objectives: data.personality?.objectives || ['make a living'],
            identity: data.personality?.identity || 'common citizen',
            conflicts: data.personality?.conflicts || ['financial struggles'],
            emotions: data.personality?.emotions || ['content', 'cautious']
        };
        
        // Dialogue patterns
        this.speech = {
            greeting: data.speech?.greeting || "Hello there, traveler.",
            farewell: data.speech?.farewell || "Safe travels.",
            patterns: data.speech?.patterns || [],
            vocabulary: data.speech?.vocabulary || 'common',
            accent: data.speech?.accent || 'none'
        };
        
        // Knowledge and information
        this.knowledge = {
            topics: data.knowledge?.topics || ['local area'],
            secrets: data.knowledge?.secrets || [],
            rumors: data.knowledge?.rumors || [],
            specialties: data.knowledge?.specialties || []
        };
        
        // Relationships
        this.relationships = {
            family: data.relationships?.family || {},
            friends: data.relationships?.friends || [],
            enemies: data.relationships?.enemies || [],
            romantic: data.relationships?.romantic || null,
            professional: data.relationships?.professional || []
        };
        
        // Quest and story involvement
        this.quests = {
            gives: data.quests?.gives || [],
            involved_in: data.quests?.involved_in || [],
            completed_for_player: data.quests?.completed_for_player || []
        };
        
        // Stats and abilities (if combat-capable)
        this.stats = data.stats || null;
        this.skills = data.skills || [];
        this.equipment = data.equipment || [];
        
        // Location and behavior
        this.location = data.location || 'town_square';
        this.schedule = data.schedule || { default: 'stays_put' };
        this.movement_pattern = data.movement_pattern || 'stationary';
        
        // Story state
        this.mood = data.mood || 'neutral';
        this.trust_level = data.trust_level || 0; // -100 to 100
        this.reputation_modifiers = data.reputation_modifiers || {};
        this.story_flags = data.story_flags || {};
        
        // Meta information
        this.created_by = data.created_by || 'system';
        this.creation_date = data.creation_date || Date.now();
        this.last_interaction = data.last_interaction || null;
        this.interaction_count = data.interaction_count || 0;
    }
    
    // Generate full description
    getDescription() {
        let desc = [];
        
        // Basic appearance
        desc.push(`${this.name} is ${this.getGenderedArticle()} ${this.appearance.height} ${this.race} of ${this.appearance.build}.`);
        desc.push(`${this.getGenderedPronoun('possessive')} ${this.appearance.hair} frames ${this.getGenderedPronoun('possessive')} ${this.appearance.eyes}, and ${this.getGenderedPronoun('subject')} ${this.getGenderedVerb('wear')} ${this.appearance.clothing}.`);
        
        // Distinguishing features
        if (this.appearance.distinguishing.length > 0) {
            desc.push(`Notable features: ${this.appearance.distinguishing.join(', ')}.`);
        }
        
        // Mood/demeanor
        const moodDescriptions = {
            happy: `${this.getGenderedPronoun('subject')} appears to be in good spirits`,
            sad: `there's a melancholy air about ${this.getGenderedPronoun('object')}`,
            angry: `${this.getGenderedPronoun('possessive')} expression seems stern and irritated`,
            worried: `${this.getGenderedPronoun('subject')} looks troubled about something`,
            excited: `${this.getGenderedPronoun('subject')} seems energetic and enthusiastic`,
            neutral: `${this.getGenderedPronoun('subject')} appears calm and composed`
        };
        
        if (moodDescriptions[this.mood]) {
            desc.push(moodDescriptions[this.mood] + '.');
        }
        
        return desc.join(' ');
    }
    
    // Generate contextual greeting based on relationship and mood
    getGreeting(player) {
        const trustLevel = this.getTrustLevel(player);
        const baseGreeting = this.speech.greeting;
        
        // Modify greeting based on trust level
        if (trustLevel > 50) {
            return `${player.name}! Good to see you again. ${baseGreeting}`;
        } else if (trustLevel < -50) {
            return `You again... ${baseGreeting}`;
        } else if (this.hasMetPlayer(player)) {
            return `Oh, hello ${player.name}. ${baseGreeting}`;
        }
        
        return baseGreeting;
    }
    
    // Generate response to topics based on knowledge and personality
    getTopicResponse(topic, player) {
        const knowledge = this.getKnowledgeAbout(topic);
        const trustLevel = this.getTrustLevel(player);
        const willingness = this.calculateWillingnessToShare(topic, trustLevel);
        
        if (!knowledge) {
            return this.generateUnknownTopicResponse(topic);
        }
        
        if (willingness < 0.3) {
            return this.generateReluctantResponse(topic);
        }
        
        if (willingness > 0.8) {
            return this.generateEagerResponse(knowledge);
        }
        
        return this.generateNormalResponse(knowledge);
    }
    
    // Update NPC state based on interaction
    processInteraction(player, interactionType, details = {}) {
        this.last_interaction = Date.now();
        this.interaction_count++;
        
        // Update trust based on interaction type
        const trustChange = this.calculateTrustChange(interactionType, details);
        this.modifyTrust(player, trustChange);
        
        // Update mood based on interaction
        this.updateMood(interactionType, details);
        
        // Store interaction in memory
        this.recordInteraction(player, interactionType, details);
    }
    
    // Helper methods for gender-appropriate language
    getGenderedArticle() {
        const articles = {
            male: 'a',
            female: 'a',
            neutral: 'an'
        };
        return articles[this.gender] || 'a';
    }
    
    getGenderedPronoun(type) {
        const pronouns = {
            male: { subject: 'he', object: 'him', possessive: 'his' },
            female: { subject: 'she', object: 'her', possessive: 'her' },
            neutral: { subject: 'they', object: 'them', possessive: 'their' }
        };
        return pronouns[this.gender]?.[type] || pronouns.neutral[type];
    }
    
    getGenderedVerb(verb) {
        // Adjust verbs for singular/plural based on pronouns
        if (this.gender === 'neutral') {
            // "they" uses plural forms
            const pluralForms = {
                wear: 'wear',
                is: 'are',
                has: 'have',
                does: 'do'
            };
            return pluralForms[verb] || verb;
        }
        return verb + 's'; // Default singular form
    }
    
    // Trust and relationship methods
    getTrustLevel(player) {
        return this.reputation_modifiers[player.id] || this.trust_level;
    }
    
    modifyTrust(player, amount) {
        if (!this.reputation_modifiers[player.id]) {
            this.reputation_modifiers[player.id] = this.trust_level;
        }
        this.reputation_modifiers[player.id] = Math.max(-100, Math.min(100, 
            this.reputation_modifiers[player.id] + amount));
    }
    
    hasMetPlayer(player) {
        return this.reputation_modifiers.hasOwnProperty(player.id) || this.interaction_count > 0;
    }
    
    // Knowledge and information methods
    getKnowledgeAbout(topic) {
        if (this.knowledge.topics.includes(topic)) {
            return { level: 'basic', info: `I know something about ${topic}.` };
        }
        if (this.knowledge.specialties.includes(topic)) {
            return { level: 'expert', info: `I'm quite knowledgeable about ${topic}.` };
        }
        return null;
    }
    
    calculateWillingnessToShare(topic, trustLevel) {
        let willingness = 0.5; // Base willingness
        
        // Adjust for trust
        willingness += (trustLevel / 200); // -0.5 to +0.5
        
        // Adjust for personality
        if (this.personality.values.includes('secrecy')) willingness -= 0.2;
        if (this.personality.values.includes('honesty')) willingness += 0.2;
        if (this.personality.values.includes('helping others')) willingness += 0.3;
        
        // Adjust for topic sensitivity
        if (this.knowledge.secrets.includes(topic)) willingness -= 0.4;
        
        return Math.max(0, Math.min(1, willingness));
    }
    
    // Response generation methods
    generateUnknownTopicResponse(topic) {
        const responses = [
            `I'm afraid I don't know much about ${topic}.`,
            `${topic}? Can't say I'm familiar with that.`,
            `You'd have to ask someone else about ${topic}.`,
            `That's not really my area of expertise.`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    generateReluctantResponse(topic) {
        const responses = [
            "I'd rather not discuss that.",
            "That's... not something I like to talk about.",
            "Perhaps we could speak of something else?",
            "I don't think it's my place to say."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    generateEagerResponse(knowledge) {
        return `Oh, ${knowledge.info} I'd be happy to tell you more!`;
    }
    
    generateNormalResponse(knowledge) {
        return knowledge.info;
    }
    
    // Interaction processing methods
    calculateTrustChange(interactionType, details) {
        const trustChanges = {
            'friendly_greeting': 1,
            'completed_quest': 10,
            'helped_with_problem': 5,
            'rude_behavior': -5,
            'threatening': -15,
            'attacked': -50,
            'gift_given': 8,
            'listened_to_story': 3
        };
        
        return trustChanges[interactionType] || 0;
    }
    
    updateMood(interactionType, details) {
        // Simple mood system - could be expanded
        const moodEffects = {
            'completed_quest': 'happy',
            'helped_with_problem': 'happy',
            'rude_behavior': 'angry',
            'threatening': 'angry',
            'attacked': 'angry',
            'gift_given': 'happy'
        };
        
        if (moodEffects[interactionType]) {
            this.mood = moodEffects[interactionType];
        }
    }
    
    recordInteraction(player, interactionType, details) {
        if (!this.story_flags.interactions) {
            this.story_flags.interactions = [];
        }
        
        this.story_flags.interactions.push({
            playerId: player.id,
            type: interactionType,
            details: details,
            timestamp: Date.now()
        });
        
        // Keep only last 50 interactions
        if (this.story_flags.interactions.length > 50) {
            this.story_flags.interactions = this.story_flags.interactions.slice(-50);
        }
    }
    
    // Save/load methods
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            title: this.title,
            race: this.race,
            gender: this.gender,
            age: this.age,
            appearance: this.appearance,
            personality: this.personality,
            speech: this.speech,
            knowledge: this.knowledge,
            relationships: this.relationships,
            quests: this.quests,
            stats: this.stats,
            skills: this.skills,
            equipment: this.equipment,
            location: this.location,
            schedule: this.schedule,
            movement_pattern: this.movement_pattern,
            mood: this.mood,
            trust_level: this.trust_level,
            reputation_modifiers: this.reputation_modifiers,
            story_flags: this.story_flags,
            created_by: this.created_by,
            creation_date: this.creation_date,
            last_interaction: this.last_interaction,
            interaction_count: this.interaction_count
        };
    }
}

module.exports = NPC;