// MUDlands Online Item Database
const itemTemplates = {
    // === WEAPONS ===
    'rusty_sword': {
        id: 'rusty_sword',
        name: 'Rusty Sword',
        description: 'An old, worn sword with patches of rust. Despite its condition, it can still cut through enemies.',
        type: 'weapon',
        rarity: 'common',
        slot: 'weapon',
        stats: { str: 2 },
        damage: { min: 3, max: 7 },
        attackSpeed: 1.0,
        durability: 100,
        maxDurability: 100,
        requirements: { level: 1 },
        value: 15
    },
    
    'iron_sword': {
        id: 'iron_sword',
        name: 'Iron Sword',
        description: 'A well-crafted iron sword with a sharp edge. A reliable weapon for any adventurer.',
        type: 'weapon',
        rarity: 'common',
        slot: 'weapon',
        stats: { str: 5 },
        damage: { min: 8, max: 12 },
        attackSpeed: 1.0,
        durability: 150,
        maxDurability: 150,
        requirements: { level: 5 },
        value: 50
    },
    
    'silver_sword': {
        id: 'silver_sword',
        name: 'Silver Sword',
        description: 'A gleaming silver blade that seems to hum with inner power. Particularly effective against undead creatures.',
        type: 'weapon',
        rarity: 'uncommon',
        slot: 'weapon',
        stats: { str: 8, luk: 2 },
        damage: { min: 12, max: 18 },
        attackSpeed: 1.1,
        criticalChance: 0.05,
        durability: 200,
        maxDurability: 200,
        requirements: { level: 10 },
        value: 150,
        customProperties: { undeadBonus: 1.5 }
    },

    'wooden_staff': {
        id: 'wooden_staff',
        name: 'Wooden Staff',
        description: 'A simple wooden staff topped with a small crystal. Perfect for beginning mages.',
        type: 'weapon',
        rarity: 'common',
        slot: 'weapon',
        stats: { int: 3, mp: 10 },
        damage: { min: 2, max: 5 },
        attackSpeed: 0.8,
        durability: 80,
        maxDurability: 80,
        requirements: { level: 1, int: 5 },
        value: 25
    },

    // === ARMOR ===
    'cloth_shirt': {
        id: 'cloth_shirt',
        name: 'Cloth Shirt',
        description: 'A simple cloth shirt made from rough fabric. Provides minimal protection but is comfortable to wear.',
        type: 'armor',
        rarity: 'common',
        slot: 'armor',
        stats: { vit: 1 },
        defense: 2,
        durability: 50,
        maxDurability: 50,
        requirements: { level: 1 },
        value: 10
    },
    
    'leather_armor': {
        id: 'leather_armor',
        name: 'Leather Armor',
        description: 'Well-tanned leather armor that provides decent protection while maintaining flexibility.',
        type: 'armor',
        rarity: 'common',
        slot: 'armor',
        stats: { vit: 3, agi: 1 },
        defense: 8,
        durability: 100,
        maxDurability: 100,
        requirements: { level: 3 },
        value: 35
    },
    
    'chainmail': {
        id: 'chainmail',
        name: 'Chainmail',
        description: 'Interlocking metal rings form this sturdy armor. Heavy but provides excellent protection.',
        type: 'armor',
        rarity: 'uncommon',
        slot: 'armor',
        stats: { vit: 6, str: 1 },
        defense: 15,
        durability: 150,
        maxDurability: 150,
        requirements: { level: 8, str: 12 },
        value: 80
    },

    // === HELMETS ===
    'leather_cap': {
        id: 'leather_cap',
        name: 'Leather Cap',
        description: 'A simple leather cap that protects your head from minor bumps and scrapes.',
        type: 'helmet',
        rarity: 'common',
        slot: 'helmet',
        stats: { vit: 1 },
        defense: 3,
        durability: 60,
        maxDurability: 60,
        requirements: { level: 2 },
        value: 20
    },

    'iron_helmet': {
        id: 'iron_helmet',
        name: 'Iron Helmet',
        description: 'A sturdy iron helmet that covers most of your head. Provides solid protection in battle.',
        type: 'helmet',
        rarity: 'common',
        slot: 'helmet',
        stats: { vit: 3 },
        defense: 6,
        durability: 100,
        maxDurability: 100,
        requirements: { level: 6 },
        value: 45
    },

    // === BOOTS ===
    'cloth_shoes': {
        id: 'cloth_shoes',
        name: 'Cloth Shoes',
        description: 'Simple cloth shoes that are comfortable for walking long distances.',
        type: 'boots',
        rarity: 'common',
        slot: 'boots',
        stats: { agi: 1 },
        defense: 1,
        durability: 40,
        maxDurability: 40,
        requirements: { level: 1 },
        value: 8
    },

    'leather_boots': {
        id: 'leather_boots',
        name: 'Leather Boots',
        description: 'Sturdy leather boots that protect your feet and provide good traction.',
        type: 'boots',
        rarity: 'common',
        slot: 'boots',
        stats: { agi: 2, vit: 1 },
        defense: 4,
        durability: 80,
        maxDurability: 80,
        requirements: { level: 4 },
        value: 30
    },

    // === ACCESSORIES ===
    'wooden_ring': {
        id: 'wooden_ring',
        name: 'Wooden Ring',
        description: 'A simple ring carved from oak wood. Somehow it makes you feel slightly more fortunate.',
        type: 'accessory',
        rarity: 'common',
        slot: 'accessory',
        stats: { luk: 2 },
        durability: 200,
        maxDurability: 200,
        requirements: { level: 1 },
        value: 25
    },

    'silver_amulet': {
        id: 'silver_amulet',
        name: 'Silver Amulet',
        description: 'A beautiful silver amulet that glows faintly with magical energy.',
        type: 'accessory',
        rarity: 'uncommon',
        slot: 'accessory',
        stats: { int: 4, mp: 15 },
        durability: 300,
        maxDurability: 300,
        requirements: { level: 7 },
        value: 120
    },

    // === CONSUMABLES ===
    'bread': {
        id: 'bread',
        name: 'Bread',
        description: 'A simple loaf of bread. Fresh and filling, it restores some health when eaten.',
        type: 'consumable',
        rarity: 'common',
        stackable: true,
        maxStack: 20,
        effects: { heal: 25 },
        value: 5
    },

    'water': {
        id: 'water',
        name: 'Water',
        description: 'Clean drinking water in a simple bottle. Refreshes the mind and restores mana.',
        type: 'consumable',
        rarity: 'common',
        stackable: true,
        maxStack: 15,
        effects: { restoreMana: 15 },
        value: 3
    },

    'health_potion': {
        id: 'health_potion',
        name: 'Health Potion',
        description: 'A red liquid that glows with healing energy. Instantly restores a moderate amount of health.',
        type: 'consumable',
        rarity: 'common',
        stackable: true,
        maxStack: 10,
        effects: { heal: 75 },
        cooldown: 3,
        value: 20
    },

    'mana_potion': {
        id: 'mana_potion',
        name: 'Mana Potion',
        description: 'A blue liquid that sparkles with arcane power. Restores magical energy when consumed.',
        type: 'consumable',
        rarity: 'common',
        stackable: true,
        maxStack: 10,
        effects: { restoreMana: 50 },
        cooldown: 3,
        value: 25
    },

    'greater_health_potion': {
        id: 'greater_health_potion',
        name: 'Greater Health Potion',
        description: 'A deep red potion that radiates powerful healing magic. Restores significant health.',
        type: 'consumable',
        rarity: 'uncommon',
        stackable: true,
        maxStack: 5,
        effects: { heal: 150 },
        cooldown: 5,
        value: 60
    },

    // === CRAFTING MATERIALS ===
    'wolf_pelt': {
        id: 'wolf_pelt',
        name: 'Wolf Pelt',
        description: 'A thick, warm pelt from a grey wolf. Could be useful for crafting leather armor.',
        type: 'material',
        rarity: 'common',
        stackable: true,
        maxStack: 50,
        value: 8
    },

    'wolf_fang': {
        id: 'wolf_fang',
        name: 'Wolf Fang',
        description: 'A sharp fang from a grey wolf. Could be used to craft weapons or accessories.',
        type: 'material',
        rarity: 'common',
        stackable: true,
        maxStack: 99,
        value: 5
    },

    'iron_ore': {
        id: 'iron_ore',
        name: 'Iron Ore',
        description: 'A chunk of raw iron ore. Needs to be smelted before it can be used for crafting.',
        type: 'material',
        rarity: 'common',
        stackable: true,
        maxStack: 50,
        value: 12
    },

    'spider_silk': {
        id: 'spider_silk',
        name: 'Spider Silk',
        description: 'Strong, flexible silk from a giant spider. Highly valued by tailors and enchanters.',
        type: 'material',
        rarity: 'uncommon',
        stackable: true,
        maxStack: 25,
        value: 20
    },

    // === QUEST ITEMS ===
    'training_manual': {
        id: 'training_manual',
        name: 'Training Manual',
        description: 'A worn leather-bound book filled with basic combat techniques and survival tips for new adventurers.',
        type: 'book',
        rarity: 'common',
        questItem: true,
        tradeable: false,
        value: 10
    },

    'mysterious_key': {
        id: 'mysterious_key',
        name: 'Mysterious Key',
        description: 'An ornate key made of an unknown metal. It seems to pulse with a faint magical aura.',
        type: 'key',
        rarity: 'rare',
        unique: true,
        questItem: true,
        tradeable: false,
        value: 0
    },

    // === MISC ITEMS ===
    'gold_coin': {
        id: 'gold_coin',
        name: 'Gold Coin',
        description: 'A shiny gold coin stamped with the seal of the realm. Standard currency.',
        type: 'currency',
        rarity: 'common',
        stackable: true,
        maxStack: 9999,
        value: 1
    },

    'torch': {
        id: 'torch',
        name: 'Torch',
        description: 'A wooden torch wrapped with oil-soaked cloth. Provides light in dark places.',
        type: 'tool',
        rarity: 'common',
        stackable: true,
        maxStack: 20,
        durability: 30,
        maxDurability: 30,
        value: 2,
        customProperties: { lightSource: true }
    },

    'lockpick': {
        id: 'lockpick',
        name: 'Lockpick',
        description: 'A set of thin metal tools used for picking locks. Requires skill to use effectively.',
        type: 'tool',
        rarity: 'common',
        stackable: true,
        maxStack: 10,
        durability: 5,
        maxDurability: 5,
        requirements: { dex: 8 },
        value: 15
    }
};

module.exports = itemTemplates;