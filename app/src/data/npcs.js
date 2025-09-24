const NPC = require('../models/NPC');

const npcs = {
    town_guard: new NPC({
        id: 'guard_marcus',
        name: 'Marcus',
        title: 'Town Guard',
        race: 'human',
        gender: 'male',
        age: 'adult',
        appearance: {
            height: 'tall',
            build: 'muscular build',
            hair: 'short brown hair',
            eyes: 'stern brown eyes',
            clothing: 'leather armor and a guard\'s tabard',
            distinguishing: ['scar across left cheek', 'silver badge of office']
        },
        personality: {
            values: ['duty', 'law and order', 'protecting citizens'],
            objectives: ['maintain peace', 'protect the town'],
            identity: 'dedicated town guard',
            conflicts: ['balancing mercy with justice'],
            emotions: ['serious', 'watchful', 'protective']
        },
        speech: {
            greeting: "Greetings, citizen. All is well in the town today.",
            farewell: "Stay out of trouble, and the peace will be kept.",
            patterns: ['formal speech', 'authoritative tone'],
            vocabulary: 'formal',
            accent: 'none'
        },
        knowledge: {
            topics: ['town security', 'local laws', 'recent crimes', 'town layout'],
            secrets: ['knows about smuggling operation'],
            rumors: ['heard about strange lights in the forest'],
            specialties: ['law enforcement', 'combat tactics']
        },
        location: 'town_square',
        mood: 'alert',
        trust_level: 25
    }),

    innkeeper: new NPC({
        id: 'innkeeper_sarah',
        name: 'Sarah',
        title: 'Innkeeper',
        race: 'human',
        gender: 'female',
        age: 'middle-aged',
        appearance: {
            height: 'average height',
            build: 'stout build',
            hair: 'graying auburn hair in a bun',
            eyes: 'warm hazel eyes',
            clothing: 'practical dress with an apron',
            distinguishing: ['flour-dusted hands', 'welcoming smile']
        },
        personality: {
            values: ['hospitality', 'hard work', 'community'],
            objectives: ['keep guests comfortable', 'maintain the inn'],
            identity: 'caring innkeeper',
            conflicts: ['financial pressures'],
            emotions: ['cheerful', 'motherly', 'tired']
        },
        speech: {
            greeting: "Welcome to the Sleeping Dragon Inn, dear! How can I help you?",
            farewell: "Come back anytime, and tell your friends about us!",
            patterns: ['warm and friendly', 'uses terms of endearment'],
            vocabulary: 'common',
            accent: 'slight regional'
        },
        knowledge: {
            topics: ['local gossip', 'travelers\' stories', 'inn services', 'cooking'],
            secrets: ['knows who owes money to whom'],
            rumors: ['latest news from traveling merchants'],
            specialties: ['cooking', 'hospitality', 'local knowledge']
        },
        location: 'inn_common',
        mood: 'cheerful',
        trust_level: 40
    }),

    blacksmith: new NPC({
        id: 'blacksmith_thorin',
        name: 'Thorin',
        title: 'Master Blacksmith',
        race: 'dwarf',
        gender: 'male',
        age: 'adult',
        appearance: {
            height: 'short and stocky',
            build: 'powerfully built',
            hair: 'thick black beard with gray streaks',
            eyes: 'intense dark eyes',
            clothing: 'leather apron over simple clothes',
            distinguishing: ['burn scars on forearms', 'calloused hands', 'soot-stained']
        },
        personality: {
            values: ['craftsmanship', 'honesty', 'tradition'],
            objectives: ['create quality weapons', 'maintain forge'],
            identity: 'master craftsman',
            conflicts: ['perfectionist tendencies'],
            emotions: ['focused', 'proud', 'gruff but kind']
        },
        speech: {
            greeting: "Aye, what brings ye to my forge? Need something forged or repaired?",
            farewell: "May your blade stay sharp and your armor strong!",
            patterns: ['gruff but friendly', 'uses dwarven expressions'],
            vocabulary: 'technical crafting terms',
            accent: 'dwarven'
        },
        knowledge: {
            topics: ['metalworking', 'weapons', 'armor', 'mining'],
            secrets: ['location of rare ore deposits'],
            rumors: ['heard about ancient dwarven ruins'],
            specialties: ['blacksmithing', 'weapon crafting', 'metallurgy']
        },
        location: 'blacksmith_forge',
        mood: 'focused',
        trust_level: 20
    }),

    merchant: new NPC({
        id: 'merchant_elena',
        name: 'Elena',
        title: 'Traveling Merchant',
        race: 'human',
        gender: 'female',
        age: 'adult',
        appearance: {
            height: 'average height',
            build: 'slender build',
            hair: 'long black hair with silver streaks',
            eyes: 'sharp green eyes',
            clothing: 'fine traveling clothes with many pockets',
            distinguishing: ['silver rings on every finger', 'calculating gaze']
        },
        personality: {
            values: ['profit', 'opportunity', 'information'],
            objectives: ['make successful trades', 'gather valuable information'],
            identity: 'shrewd merchant',
            conflicts: ['balancing ethics with profit'],
            emotions: ['ambitious', 'curious', 'cautious']
        },
        speech: {
            greeting: "Ah, a potential customer! I have many fine wares from distant lands.",
            farewell: "Remember, I always have the best prices for quality goods!",
            patterns: ['persuasive', 'mentions exotic origins'],
            vocabulary: 'business terminology',
            accent: 'cosmopolitan'
        },
        knowledge: {
            topics: ['trade routes', 'market prices', 'exotic goods', 'distant lands'],
            secrets: ['knows about lucrative but dangerous trade routes'],
            rumors: ['latest news from major cities'],
            specialties: ['appraisal', 'negotiation', 'market knowledge']
        },
        location: 'general_store',
        mood: 'eager',
        trust_level: 15
    }),

    old_mage: new NPC({
        id: 'mage_aldric',
        name: 'Aldric',
        title: 'Court Wizard',
        race: 'human',
        gender: 'male',
        age: 'elderly',
        appearance: {
            height: 'average height',
            build: 'thin and frail',
            hair: 'long white beard and hair',
            eyes: 'wise blue eyes behind spectacles',
            clothing: 'deep blue robes with silver embroidery',
            distinguishing: ['gnarled wooden staff', 'various pouches and scrolls']
        },
        personality: {
            values: ['knowledge', 'wisdom', 'magical research'],
            objectives: ['preserve ancient knowledge', 'guide younger mages'],
            identity: 'wise old wizard',
            conflicts: ['torn between sharing and guarding knowledge'],
            emotions: ['contemplative', 'patient', 'sometimes absent-minded']
        },
        speech: {
            greeting: "Ah, young one. The threads of fate have brought you to me.",
            farewell: "May your path be illuminated by wisdom and protected by magic.",
            patterns: ['speaks in metaphors', 'references magical theory'],
            vocabulary: 'archaic and mystical',
            accent: 'educated'
        },
        knowledge: {
            topics: ['magic theory', 'ancient history', 'magical creatures', 'spell crafting'],
            secrets: ['location of powerful magical artifacts'],
            rumors: ['disturbances in magical energy'],
            specialties: ['arcane lore', 'spell research', 'magical identification']
        },
        location: 'mage_tower_study',
        mood: 'contemplative',
        trust_level: 30
    }),

    training_master: new NPC({
        id: 'trainer_gareth',
        name: 'Gareth',
        title: 'Training Master',
        race: 'human',
        gender: 'male',
        age: 'middle-aged',
        appearance: {
            height: 'tall',
            build: 'athletic and scarred',
            hair: 'short graying hair',
            eyes: 'keen gray eyes',
            clothing: 'practical training gear',
            distinguishing: ['numerous battle scars', 'confident bearing']
        },
        personality: {
            values: ['discipline', 'improvement', 'fair competition'],
            objectives: ['train new warriors', 'maintain readiness'],
            identity: 'experienced trainer',
            conflicts: ['pushing students vs. keeping them safe'],
            emotions: ['stern', 'encouraging', 'demanding']
        },
        speech: {
            greeting: "Ready to test your mettle? The training grounds await.",
            farewell: "Remember: practice makes perfect, but perfect practice makes permanent!",
            patterns: ['motivational', 'uses combat metaphors'],
            vocabulary: 'military terminology',
            accent: 'slight regional'
        },
        knowledge: {
            topics: ['combat techniques', 'weapon maintenance', 'physical conditioning'],
            secrets: ['knows advanced combat techniques'],
            rumors: ['heard about talented warriors passing through'],
            specialties: ['combat training', 'weapon mastery', 'tactical instruction']
        },
        location: 'training_grounds',
        mood: 'focused',
        trust_level: 25
    }),

    bard: new NPC({
        id: 'bard_lyanna',
        name: 'Lyanna',
        title: 'Wandering Bard',
        race: 'half-elf',
        gender: 'female',
        age: 'young adult',
        appearance: {
            height: 'graceful and tall',
            build: 'lithe build',
            hair: 'flowing golden hair',
            eyes: 'expressive violet eyes',
            clothing: 'colorful traveling clothes with musical instrument',
            distinguishing: ['elaborate lute', 'silver voice', 'enchanting smile']
        },
        personality: {
            values: ['art', 'storytelling', 'freedom'],
            objectives: ['share stories and songs', 'preserve cultural heritage'],
            identity: 'romantic storyteller',
            conflicts: ['desire for adventure vs. need for audience'],
            emotions: ['passionate', 'whimsical', 'empathetic']
        },
        speech: {
            greeting: "Greetings, fellow traveler! Have you any tales to trade?",
            farewell: "Until our paths cross again, may your story be one worth telling!",
            patterns: ['poetic', 'asks about stories', 'dramatic flair'],
            vocabulary: 'artistic and romantic',
            accent: 'melodic'
        },
        knowledge: {
            topics: ['legends and folklore', 'distant lands', 'famous heroes', 'musical arts'],
            secrets: ['knows embarrassing stories about nobles'],
            rumors: ['latest gossip from the road'],
            specialties: ['storytelling', 'music', 'performance', 'lore']
        },
        location: 'inn_common',
        mood: 'inspired',
        trust_level: 35
    }),

    forest_hermit: new NPC({
        id: 'hermit_oldoak',
        name: 'Old Oak',
        title: 'Forest Hermit',
        race: 'human',
        gender: 'male',
        age: 'elderly',
        appearance: {
            height: 'average height',
            build: 'wiry and weathered',
            hair: 'long unkempt gray hair and beard',
            eyes: 'piercing green eyes',
            clothing: 'rough-hewn clothes and animal furs',
            distinguishing: ['walks with gnarled staff', 'speaks to animals', 'smells of herbs']
        },
        personality: {
            values: ['nature', 'solitude', 'ancient wisdom'],
            objectives: ['protect the forest', 'maintain balance'],
            identity: 'nature guardian',
            conflicts: ['isolation vs. helping others'],
            emotions: ['wise', 'reclusive', 'protective of nature']
        },
        speech: {
            greeting: "Hmm... city folk in my forest. What brings you to these ancient paths?",
            farewell: "The forest will remember your presence. Try to leave only footprints.",
            patterns: ['cryptic', 'references nature', 'speaks slowly'],
            vocabulary: 'nature terminology',
            accent: 'rustic'
        },
        knowledge: {
            topics: ['forest lore', 'herbal medicine', 'animal behavior', 'natural magic'],
            secrets: ['location of hidden groves and sacred places'],
            rumors: ['disturbances in natural balance'],
            specialties: ['herbalism', 'animal communication', 'forest survival']
        },
        location: 'deep_forest_grove',
        mood: 'wary',
        trust_level: 10
    })
};

module.exports = npcs;