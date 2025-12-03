// MUDlands Online Monster Database
const monsterTemplates = {
    "goblin_scout": {
        "type": "goblin_scout",
        "name": "Goblin Scout",
        "description": "A small, green-skinned creature with beady eyes and sharp teeth. It wears tattered leather armor and carries a crude dagger.",
        "level": 1,
        "stats": {
            "str": 6,
            "agi": 8,
            "vit": 5,
            "int": 4,
            "dex": 7,
            "luk": 5
        },
        "experience": 15,
        "aggressive": true,
        "respawnTime": 60000,
        "attackSpeed": 2000,
        "drops": [
            {
                "item": "wolf_pelt",
                "chance": 0.3
            },
            {
                "item": "rusty_sword",
                "chance": 0.1
            }
        ]
    },
    "grey_wolf": {
        "type": "grey_wolf",
        "name": "Grey Wolf",
        "description": "A fierce grey wolf with matted fur and sharp fangs. Its eyes gleam with predatory intelligence.",
        "level": 3,
        "stats": {
            "str": 10,
            "agi": 12,
            "vit": 8,
            "int": 3,
            "dex": 10,
            "luk": 5
        },
        "experience": 35,
        "aggressive": true,
        "respawnTime": 90000,
        "attackSpeed": 1800,
        "drops": [
            {
                "item": "wolf_pelt",
                "chance": 0.6
            },
            {
                "item": "wolf_fang",
                "chance": 0.4
            }
        ]
    },
    "forest_spider": {
        "type": "forest_spider",
        "name": "Forest Spider",
        "description": "A large spider with hairy legs and multiple glowing eyes. Venom drips from its fangs.",
        "level": 5,
        "stats": {
            "str": 8,
            "agi": 14,
            "vit": 6,
            "int": 5,
            "dex": 12,
            "luk": 6
        },
        "experience": 50,
        "aggressive": true,
        "respawnTime": 120000,
        "attackSpeed": 2200,
        "drops": [
            {
                "item": "spider_silk",
                "chance": 0.5
            }
        ]
    },
    "skeleton_warrior": {
        "type": "skeleton_warrior",
        "name": "Skeleton Warrior",
        "description": "An animated skeleton clad in rusty armor, wielding a chipped sword. Its bones clatter with each movement.",
        "level": 7,
        "stats": {
            "str": 12,
            "agi": 6,
            "vit": 10,
            "int": 4,
            "dex": 8,
            "luk": 4
        },
        "experience": 75,
        "aggressive": true,
        "respawnTime": 150000,
        "attackSpeed": 2500,
        "drops": [
            {
                "item": "iron_sword",
                "chance": 0.15
            },
            {
                "item": "iron_ore",
                "chance": 0.3
            }
        ]
    },
    "bandit": {
        "type": "bandit",
        "name": "Bandit",
        "description": "A rough-looking outlaw in leather armor. Their eyes dart around, looking for easy targets.",
        "level": 10,
        "stats": {
            "str": 14,
            "agi": 12,
            "vit": 12,
            "int": 8,
            "dex": 14,
            "luk": 10
        },
        "experience": 120,
        "aggressive": true,
        "respawnTime": 180000,
        "attackSpeed": 2000,
        "drops": [
            {
                "item": "leather_armor",
                "chance": 0.2
            },
            {
                "item": "health_potion",
                "chance": 0.3
            },
            {
                "item": "gold_coin",
                "chance": 0.8
            }
        ]
    }
};

module.exports = monsterTemplates;
