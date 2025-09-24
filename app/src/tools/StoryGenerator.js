const NPC = require('../models/NPC');
const Quest = require('../models/Quest');

class StoryGenerator {
    constructor() {
        this.nameGenerators = this.initializeNameGenerators();
        this.personalityTraits = this.initializePersonalityTraits();
        this.questHooks = this.initializeQuestHooks();
        this.roomDescriptors = this.initializeRoomDescriptors();
        this.storyThemes = this.initializeStoryThemes();
    }
    
    initializeNameGenerators() {
        return {
            human: {
                male: ['Aldric', 'Bram', 'Caelan', 'Donovan', 'Erik', 'Finn', 'Gareth', 'Henrik', 'Ivan', 'Jasper'],
                female: ['Aria', 'Brenna', 'Celeste', 'Diana', 'Elena', 'Fiona', 'Gwendolyn', 'Hazel', 'Iris', 'Jenna']
            },
            elf: {
                male: ['Aelindra', 'Caelynn', 'Erevan', 'Galinndan', 'Heian', 'Lamlis', 'Mindartis', 'Nutae', 'Paelynn', 'Quarion'],
                female: ['Adrie', 'Caelynn', 'Dara', 'Enna', 'Galinndan', 'Hadarai', 'Immeral', 'Ivellios', 'Korfel', 'Lamlis']
            },
            dwarf: {
                male: ['Adrik', 'Baern', 'Darrak', 'Eberk', 'Fargrim', 'Gardain', 'Harbek', 'Kildrak', 'Margrim', 'Orsik'],
                female: ['Amber', 'Bardryn', 'Diesa', 'Eldeth', 'Gunnloda', 'Hlin', 'Kathra', 'Kristryd', 'Ilde', 'Liftrasa']
            },
            halfling: {
                male: ['Alton', 'Ander', 'Bernie', 'Bobbin', 'Cade', 'Callus', 'Corrin', 'Dannad', 'Garret', 'Lindal'],
                female: ['Andry', 'Bree', 'Callie', 'Cora', 'Euphemia', 'Jillian', 'Kithri', 'Lavinia', 'Lidda', 'Merla']
            }
        };
    }
    
    initializePersonalityTraits() {
        return {
            values: [
                'honesty', 'loyalty', 'courage', 'compassion', 'wisdom', 'justice', 
                'independence', 'family', 'tradition', 'progress', 'knowledge', 'faith',
                'friendship', 'hard work', 'creativity', 'peace', 'adventure', 'helping others'
            ],
            flaws: [
                'pride', 'greed', 'fear', 'anger', 'impatience', 'stubbornness',
                'jealousy', 'pessimism', 'recklessness', 'secrecy', 'vanity', 'laziness'
            ],
            goals: [
                'protect family', 'gain knowledge', 'become wealthy', 'find love',
                'achieve recognition', 'explore the world', 'master a skill',
                'serve their community', 'seek redemption', 'uncover truth',
                'build something lasting', 'help the needy'
            ],
            speech_patterns: [
                'uses formal language', 'speaks in riddles', 'tells many stories',
                'asks lots of questions', 'uses technical terms', 'speaks very quietly',
                'has a distinctive accent', 'uses outdated expressions', 'very direct speaker',
                'tends to ramble', 'uses metaphors often', 'speaks like a poet'
            ]
        };
    }
    
    initializeQuestHooks() {
        return {
            personal_stakes: [
                "My {family_member} has gone missing in the {dangerous_place}",
                "I need someone to deliver this {important_item} to {person} in {location}",
                "Someone has stolen my {precious_possession} and I saw them head toward {location}",
                "I'm being threatened by {antagonist} and need protection",
                "My {business/shop} is failing because of {problem}"
            ],
            community_need: [
                "Our town is being plagued by {monsters} from {location}",
                "The {important_resource} has been contaminated and we need {solution}",
                "A dangerous {villain} has taken over {location} and threatens everyone",
                "We need someone to negotiate with {faction} about {dispute}",
                "The {sacred_place} has been defiled and needs to be cleansed"
            ],
            mystery_discovery: [
                "Strange {phenomenon} have been occurring near {location}",
                "I found this {mysterious_item} and I think it leads to {place}",
                "There are rumors of {lost_treasure} hidden in {ancient_place}",
                "Someone needs to investigate the disappearances near {location}",
                "Ancient texts speak of {prophecy} that may be coming true"
            ],
            moral_dilemma: [
                "I know {terrible_secret} but revealing it would hurt {innocent_person}",
                "Two groups both deserve {limited_resource} but I can only help one",
                "I must choose between {personal_desire} and {duty_obligation}",
                "Someone wants me to {questionable_action} for a good cause",
                "I have information that could save lives but would ruin {person}"
            ]
        };
    }
    
    initializeRoomDescriptors() {
        return {
            atmospheres: [
                'peaceful', 'eerie', 'bustling', 'abandoned', 'mysterious', 'welcoming',
                'oppressive', 'ancient', 'magical', 'dangerous', 'cozy', 'majestic'
            ],
            lighting: [
                'brightly lit by sunlight', 'dimly illuminated by torches', 'bathed in moonlight',
                'filled with dancing shadows', 'glowing with magical light', 'shrouded in darkness',
                'lit by flickering candles', 'washed in golden light', 'cast in deep twilight'
            ],
            sounds: [
                'birds chirping', 'wind whistling', 'water trickling', 'footsteps echoing',
                'voices murmuring', 'leaves rustling', 'stone grinding', 'magic humming',
                'distant laughter', 'ominous silence', 'crackling fire', 'metal clanging'
            ],
            smells: [
                'fresh flowers', 'old parchment', 'cooking food', 'smoke and ash',
                'damp earth', 'sea salt', 'pine needles', 'magical ozone',
                'decay and mold', 'sweet incense', 'metallic tang', 'lavender and herbs'
            ],
            textures: [
                'smooth stone', 'rough bark', 'soft moss', 'cold metal',
                'warm wood', 'damp air', 'cool breeze', 'thick dust',
                'polished marble', 'worn fabric', 'sharp edges', 'gentle warmth'
            ]
        };
    }
    
    initializeStoryThemes() {
        return {
            main_themes: [
                'redemption', 'discovery', 'friendship', 'sacrifice', 'growth',
                'justice', 'survival', 'love', 'betrayal', 'hope', 'legacy', 'identity'
            ],
            conflicts: [
                'tradition vs progress', 'individual vs community', 'order vs freedom',
                'nature vs civilization', 'past vs future', 'duty vs desire',
                'survival vs morality', 'truth vs peace', 'power vs responsibility'
            ]
        };
    }
    
    // Generate a random NPC with consistent personality
    generateNPC(options = {}) {
        const race = options.race || this.randomChoice(['human', 'elf', 'dwarf', 'halfling']);
        const gender = options.gender || this.randomChoice(['male', 'female']);
        const name = this.randomChoice(this.nameGenerators[race][gender]);
        
        // Generate appearance based on race
        const appearance = this.generateAppearance(race, gender);
        
        // Generate personality using VOICE method
        const personality = this.generatePersonality();
        
        // Generate speech patterns
        const speech = this.generateSpeechPatterns(personality);
        
        // Generate knowledge based on role
        const knowledge = this.generateKnowledge(options.role || 'citizen');
        
        // Generate basic relationships
        const relationships = this.generateBasicRelationships();
        
        return new NPC({
            name: name,
            race: race,
            gender: gender,
            appearance: appearance,
            personality: personality,
            speech: speech,
            knowledge: knowledge,
            relationships: relationships,
            location: options.location || 'town_square',
            ...options
        });
    }
    
    generateAppearance(race, gender) {
        const appearances = {
            human: {
                hair: ['brown', 'black', 'blonde', 'red', 'grey'],
                eyes: ['brown', 'blue', 'green', 'hazel', 'grey'],
                build: ['slender', 'average', 'stocky', 'tall', 'short']
            },
            elf: {
                hair: ['golden', 'silver', 'auburn', 'raven black', 'platinum'],
                eyes: ['emerald', 'sapphire', 'violet', 'amber', 'silver'],
                build: ['tall and graceful', 'lithe', 'elegant', 'willowy']
            },
            dwarf: {
                hair: ['copper', 'iron grey', 'coal black', 'golden bronze'],
                eyes: ['steel grey', 'deep brown', 'forest green', 'dark blue'],
                build: ['stocky and strong', 'broad-shouldered', 'compact', 'sturdy']
            },
            halfling: {
                hair: ['curly brown', 'sandy blonde', 'copper red', 'dark brown'],
                eyes: ['bright brown', 'warm green', 'cheerful blue', 'twinkling hazel'],
                build: ['small and cheerful', 'round and comfortable', 'short but sturdy']
            }
        };
        
        const raceData = appearances[race];
        return {
            hair: this.randomChoice(raceData.hair) + ' hair',
            eyes: this.randomChoice(raceData.eyes) + ' eyes',
            build: this.randomChoice(raceData.build),
            height: race === 'dwarf' || race === 'halfling' ? 'short' : this.randomChoice(['average', 'tall', 'short']),
            clothing: this.generateClothing()
        };
    }
    
    generateClothing() {
        const clothing = [
            'simple merchant clothes', 'worn traveler\'s garb', 'fine noble attire',
            'practical work clothes', 'colorful festival dress', 'sturdy leather armor',
            'flowing robes', 'patched common clothes', 'elegant court dress'
        ];
        return this.randomChoice(clothing);
    }
    
    generatePersonality() {
        const values = this.randomChoices(this.personalityTraits.values, 2, 4);
        const mainGoal = this.randomChoice(this.personalityTraits.goals);
        const flaw = this.randomChoice(this.personalityTraits.flaws);
        
        return {
            values: values,
            objectives: [mainGoal, this.randomChoice(this.personalityTraits.goals)],
            identity: this.generateIdentity(values),
            conflicts: [flaw, this.generateConflict(mainGoal)],
            emotions: this.generateEmotions()
        };
    }
    
    generateIdentity(values) {
        const identities = {
            'helping others': 'community helper',
            'knowledge': 'scholar',
            'family': 'devoted family member',
            'hard work': 'dedicated worker',
            'tradition': 'keeper of traditions',
            'justice': 'seeker of justice'
        };
        
        for (const value of values) {
            if (identities[value]) {
                return identities[value];
            }
        }
        
        return 'common citizen';
    }
    
    generateConflict(goal) {
        const conflicts = {
            'protect family': 'family is in danger',
            'gain knowledge': 'knowledge is forbidden',
            'become wealthy': 'lacks resources',
            'find love': 'is already committed',
            'achieve recognition': 'lives in obscurity',
            'explore the world': 'bound by duty',
            'serve their community': 'community doesn\'t appreciate them'
        };
        
        return conflicts[goal] || 'internal struggle';
    }
    
    generateEmotions() {
        return this.randomChoices(['content', 'worried', 'hopeful', 'frustrated', 'excited', 'melancholy'], 1, 2);
    }
    
    generateSpeechPatterns(personality) {
        const patterns = this.randomChoices(this.personalityTraits.speech_patterns, 1, 3);
        
        return {
            greeting: this.generateGreeting(personality),
            farewell: this.generateFarewell(personality),
            patterns: patterns,
            vocabulary: this.determineVocabulary(personality),
            accent: 'local'
        };
    }
    
    generateGreeting(personality) {
        if (personality.values.includes('helping others')) {
            return "Welcome, friend! How can I help you today?";
        } else if (personality.values.includes('tradition')) {
            return "Greetings and well met, as our ancestors would say.";
        } else if (personality.conflicts.includes('fear')) {
            return "Oh... hello there. Is everything alright?";
        } else {
            return "Good day to you, traveler.";
        }
    }
    
    generateFarewell(personality) {
        if (personality.values.includes('helping others')) {
            return "Take care of yourself out there!";
        } else if (personality.values.includes('tradition')) {
            return "May the old gods watch over your path.";
        } else {
            return "Safe travels, friend.";
        }
    }
    
    determineVocabulary(personality) {
        if (personality.values.includes('knowledge')) {
            return 'educated';
        } else if (personality.identity === 'noble') {
            return 'formal';
        } else {
            return 'common';
        }
    }
    
    generateKnowledge(role) {
        const roleKnowledge = {
            merchant: ['local trade', 'item values', 'market conditions', 'travel routes'],
            guard: ['town security', 'recent crimes', 'suspicious activities', 'patrol routes'],
            scholar: ['ancient history', 'magical theory', 'scholarly research', 'academic gossip'],
            farmer: ['crop conditions', 'weather patterns', 'local wildlife', 'seasonal changes'],
            innkeeper: ['traveler news', 'local gossip', 'room availability', 'regional events'],
            citizen: ['local area', 'town news', 'neighbors', 'daily life']
        };
        
        const topics = roleKnowledge[role] || roleKnowledge.citizen;
        
        return {
            topics: [...topics, 'general conversation'],
            specialties: [topics[0]], // First topic is their specialty
            secrets: this.generateSecrets(role),
            rumors: this.generateRumors()
        };
    }
    
    generateSecrets(role) {
        const secrets = [
            'hidden passage in the old building',
            'merchant overcharging travelers',
            'someone sneaking around at night',
            'strange noises from the forest',
            'missing supplies from the warehouse'
        ];
        
        // 30% chance of having a secret
        return Math.random() < 0.3 ? [this.randomChoice(secrets)] : [];
    }
    
    generateRumors() {
        const rumors = [
            'strange lights seen in the mountains',
            'increased monster activity reported',
            'mysterious stranger asking questions',
            'old ruins discovered nearby',
            'traveling merchant bringing exotic goods'
        ];
        
        return this.randomChoices(rumors, 0, 2);
    }
    
    generateBasicRelationships() {
        return {
            family: Math.random() < 0.4 ? { spouse: 'unnamed spouse' } : {},
            friends: this.randomChoices(['local smith', 'market vendor', 'neighbor'], 0, 2),
            enemies: Math.random() < 0.2 ? [this.randomChoice(['tax collector', 'rival merchant', 'local bully'])] : [],
            professional: []
        };
    }
    
    // Generate a quest with proper narrative structure
    generateQuest(options = {}) {
        const type = options.type || this.randomChoice(['fetch', 'kill', 'delivery', 'social', 'explore']);
        const theme = this.randomChoice(this.storyThemes.main_themes);
        const hook = this.generateQuestHook(type);
        
        const quest = {
            type: type,
            title: this.generateQuestTitle(type, theme),
            narrative: {
                hook: hook,
                background: this.generateQuestBackground(theme),
                stakes: this.generateQuestStakes(type),
                resolution: this.generateQuestResolution(theme)
            },
            difficulty: options.difficulty || this.randomChoice(['easy', 'medium', 'hard']),
            level_requirement: options.level || Math.floor(Math.random() * 10) + 1,
            ...options
        };
        
        // Generate appropriate objectives based on type
        quest.objectives = this.generateQuestObjectives(type);
        
        // Generate appropriate rewards
        quest.rewards = this.generateQuestRewards(quest.difficulty, quest.level_requirement);
        
        return new Quest(quest);
    }
    
    generateQuestHook(type) {
        const hooks = this.questHooks;
        const categories = Object.keys(hooks);
        const category = this.randomChoice(categories);
        const template = this.randomChoice(hooks[category]);
        
        return this.fillTemplate(template);
    }
    
    generateQuestTitle(type, theme) {
        const titles = {
            fetch: ['The Lost {item}', 'Seeking the {item}', 'Recovery of {item}'],
            kill: ['Pest Control', 'The {monster} Problem', 'Hunting {monsters}'],
            delivery: ['Safe Passage', 'Important Delivery', 'The {item} Run'],
            social: ['Diplomatic Mission', 'Peace Talks', 'The Negotiation'],
            explore: ['Into the Unknown', 'Scouting Mission', 'The Lost {place}']
        };
        
        const typeTemplates = titles[type] || titles.fetch;
        const template = this.randomChoice(typeTemplates);
        
        return this.fillTemplate(template);
    }
    
    generateQuestBackground(theme) {
        const backgrounds = {
            redemption: "This task offers a chance to make amends for past wrongs.",
            discovery: "Recent events have revealed something that needs investigation.",
            friendship: "A trusted ally needs assistance with this matter.",
            sacrifice: "Completing this will require giving up something valuable.",
            growth: "This challenge will test your abilities and help you improve.",
            justice: "A wrong has been committed and justice must be served."
        };
        
        return backgrounds[theme] || "There are good reasons why this task is important.";
    }
    
    generateQuestStakes(type) {
        const stakes = {
            fetch: "Without this item, the situation will only get worse.",
            kill: "These creatures threaten the safety of innocent people.",
            delivery: "Time is critical - this must reach its destination soon.",
            social: "The wrong words could lead to conflict and bloodshed.",
            explore: "Unknown dangers may be lurking in unexplored areas."
        };
        
        return stakes[type] || "The outcome matters to many people.";
    }
    
    generateQuestResolution(theme) {
        const resolutions = {
            redemption: "Your actions have helped heal old wounds.",
            discovery: "The truth has been revealed and knowledge gained.",
            friendship: "Your friend is grateful for your loyal assistance.",
            sacrifice: "Your sacrifice has made a meaningful difference.",
            growth: "You've proven yourself capable of great things.",
            justice: "Justice has been served and balance restored."
        };
        
        return resolutions[theme] || "Your efforts have made the world a little better.";
    }
    
    generateQuestObjectives(type) {
        const objectives = {
            fetch: [{
                id: 'collect_item',
                type: 'collect',
                description: 'Find and collect the required item',
                target: 'quest_item',
                quantity: 1,
                current_progress: 0,
                completed: false
            }],
            kill: [{
                id: 'eliminate_threats',
                type: 'kill',
                description: 'Eliminate the dangerous creatures',
                target: 'quest_monster',
                quantity: Math.floor(Math.random() * 5) + 3,
                current_progress: 0,
                completed: false
            }],
            delivery: [
                {
                    id: 'obtain_package',
                    type: 'collect',
                    description: 'Obtain the package to deliver',
                    target: 'delivery_item',
                    quantity: 1,
                    current_progress: 0,
                    completed: false
                },
                {
                    id: 'make_delivery',
                    type: 'deliver',
                    description: 'Deliver the package to the recipient',
                    target: 'delivery_target',
                    quantity: 1,
                    current_progress: 0,
                    completed: false
                }
            ]
        };
        
        return objectives[type] || objectives.fetch;
    }
    
    generateQuestRewards(difficulty, level) {
        const baseXP = level * 50;
        const baseGold = level * 10;
        
        const multipliers = {
            easy: 1,
            medium: 1.5,
            hard: 2.5,
            epic: 4
        };
        
        const mult = multipliers[difficulty] || 1;
        
        return {
            experience: Math.floor(baseXP * mult),
            gold: Math.floor(baseGold * mult),
            items: Math.random() < 0.3 ? ['random_item'] : [],
            reputation: Math.random() < 0.5 ? { local: Math.floor(mult * 10) } : {}
        };
    }
    
    // Generate rich room descriptions
    generateRoomDescription(options = {}) {
        const atmosphere = options.atmosphere || this.randomChoice(this.roomDescriptors.atmospheres);
        const lighting = this.randomChoice(this.roomDescriptors.lighting);
        const sound = this.randomChoice(this.roomDescriptors.sounds);
        const smell = this.randomChoice(this.roomDescriptors.smells);
        
        // Build description using the five senses template
        const descriptions = [];
        
        // Opening hook
        descriptions.push(`This ${atmosphere} chamber is ${lighting}.`);
        
        // Auditory
        if (Math.random() < 0.7) {
            descriptions.push(`You can hear ${sound} in the distance.`);
        }
        
        // Olfactory
        if (Math.random() < 0.6) {
            descriptions.push(`The air carries the scent of ${smell}.`);
        }
        
        // Additional details based on atmosphere
        if (atmosphere === 'ancient') {
            descriptions.push('Dust motes dance in the air, and cobwebs cling to forgotten corners.');
        } else if (atmosphere === 'magical') {
            descriptions.push('Strange symbols glow faintly on the walls, pulsing with arcane energy.');
        } else if (atmosphere === 'dangerous') {
            descriptions.push('Something about this place sets your nerves on edge.');
        }
        
        return descriptions.join(' ');
    }
    
    // Utility methods
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    randomChoices(array, min, max) {
        const count = Math.floor(Math.random() * (max - min + 1)) + min;
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
    
    fillTemplate(template) {
        const replacements = {
            '{family_member}': this.randomChoice(['sister', 'brother', 'father', 'mother', 'cousin', 'uncle']),
            '{dangerous_place}': this.randomChoice(['dark forest', 'abandoned mine', 'haunted ruins', 'mountain pass']),
            '{important_item}': this.randomChoice(['letter', 'package', 'artifact', 'medicine', 'key']),
            '{person}': this.randomChoice(['merchant', 'scholar', 'guard captain', 'elder', 'healer']),
            '{location}': this.randomChoice(['nearby town', 'mountain village', 'forest shrine', 'riverside camp']),
            '{monsters}': this.randomChoice(['goblins', 'wolves', 'bandits', 'undead', 'wild beasts']),
            '{monster}': this.randomChoice(['goblin', 'wolf', 'bandit', 'skeleton', 'spider']),
            '{item}': this.randomChoice(['sword', 'gem', 'scroll', 'potion', 'crown']),
            '{place}': this.randomChoice(['temple', 'library', 'tower', 'cave', 'ruins'])
        };
        
        let result = template;
        for (const [placeholder, replacement] of Object.entries(replacements)) {
            result = result.replace(new RegExp(placeholder, 'g'), replacement);
        }
        
        return result;
    }
}

module.exports = StoryGenerator;