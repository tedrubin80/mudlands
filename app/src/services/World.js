const Room = require('../models/Room');
const Monster = require('../models/Monster');
const Item = require('../models/Item');
const Shop = require('../models/Shop');
const NPC = require('../models/NPC');
const itemTemplates = require('../data/items');
const npcTemplates = require('../data/npcs');
const db = require('../config/database');
const fs = require('fs');
const path = require('path');
const GameLogger = require('../utils/logger');

class World {
    constructor() {
        this.rooms = new Map();
        this.monsters = new Map();
        this.items = new Map();
        this.shops = new Map();
        this.npcs = new Map();
        this.respawnTimers = new Map();
        this.worldData = null;
        this.initializeShops();
    }

    async loadRooms() {
        try {
            // Try to load from world.json first
            await this.loadFromWorldFile();
            GameLogger.gameEvent('world_loaded_from_file', { 
                roomCount: this.rooms.size,
                monsterCount: this.monsters.size,
                itemCount: this.items.size 
            });
        } catch (error) {
            GameLogger.warn('Failed to load world from file, trying database', { error: error.message });
            
            try {
                // Fallback to database
                const result = await db.pool.query('SELECT * FROM rooms ORDER BY id');
                
                result.rows.forEach(roomData => {
                    const room = new Room({
                        id: roomData.id,
                        name: roomData.name,
                        description: roomData.description,
                        exits: roomData.exits,
                        properties: roomData.properties
                    });
                    
                    // Load NPCs for this room
                    if (roomData.npcs && roomData.npcs.length > 0) {
                        room.npcs = roomData.npcs.map(npcId => {
                            if (npcTemplates[npcId]) {
                                const npc = Object.assign(Object.create(Object.getPrototypeOf(npcTemplates[npcId])), npcTemplates[npcId]);
                                this.npcs.set(npc.id, npc);
                                return npc;
                            }
                            return null;
                        }).filter(npc => npc !== null);
                    }
                    
                    this.rooms.set(room.id, room);
                });

                GameLogger.gameEvent('world_loaded_from_database', { roomCount: this.rooms.size });
            } catch (dbError) {
                GameLogger.error('Failed to load world from database, using fallback', dbError);
                // Final fallback to hardcoded rooms
                this.loadFallbackRooms();
            }
        }
    }

    async loadFromWorldFile() {
        const worldPath = path.join(__dirname, '../data/world.json');
        
        if (!fs.existsSync(worldPath)) {
            throw new Error('World file not found');
        }

        const worldContent = fs.readFileSync(worldPath, 'utf8');
        this.worldData = JSON.parse(worldContent);

        // Load rooms
        if (this.worldData.rooms) {
            this.worldData.rooms.forEach(roomData => {
                const room = new Room(roomData);
                this.rooms.set(room.id, room);
            });
        }

        // Load monster templates
        if (this.worldData.monsters) {
            this.worldData.monsters.forEach(monsterData => {
                this.monsters.set(monsterData.id, monsterData);
            });
        }

        // Load item templates
        if (this.worldData.items) {
            this.worldData.items.forEach(itemData => {
                this.items.set(itemData.id, itemData);
            });
        }
    }
    
    loadFallbackRooms() {
        console.log('Loading fallback rooms...');
        const startingRooms = this.getStartingRooms();
        
        startingRooms.forEach(roomData => {
            const room = new Room(roomData);
            
            // Load NPCs for this room
            if (roomData.npcs && roomData.npcs.length > 0) {
                room.npcs = roomData.npcs.map(npcId => {
                    if (npcTemplates[npcId]) {
                        const npc = Object.assign(Object.create(Object.getPrototypeOf(npcTemplates[npcId])), npcTemplates[npcId]);
                        this.npcs.set(npc.id, npc);
                        return npc;
                    }
                    return null;
                }).filter(npc => npc !== null);
            }
            
            this.rooms.set(room.id, room);
        });

        console.log(`Loaded ${this.rooms.size} fallback rooms`);
    }

    getStartingRooms() {
        return [
            {
                id: 'town_square',
                name: 'Town Square',
                description: 'The bustling center of town. A large fountain stands in the middle, its crystal-clear water sparkling in the light. Merchants hawk their wares from colorful stalls, and adventurers gather to share tales of their journeys.',
                exits: {
                    north: 'town_north_gate',
                    south: 'town_south_gate',
                    east: 'town_market',
                    west: 'town_inn'
                },
                npcs: ['guard_marcus']
            },
            {
                id: 'town_inn',
                name: 'The Sleeping Dragon Inn',
                description: 'A cozy inn with a warm fireplace. The smell of hearty stew fills the air, and weary travelers rest at wooden tables. A staircase leads up to the guest rooms.',
                exits: {
                    east: 'town_square',
                    up: 'inn_rooms'
                }
            },
            {
                id: 'inn_rooms',
                name: 'Inn Guest Rooms',
                description: 'A hallway lined with doors to private rooms. Soft snoring can be heard from behind some of them. A window at the end offers a view of the town square below.',
                exits: {
                    down: 'town_inn'
                }
            },
            {
                id: 'town_market',
                name: 'Market District',
                description: 'Rows of shops and stalls line the cobblestone streets. The air is filled with the scents of fresh bread, exotic spices, and leather goods. Shopkeepers call out their daily specials.',
                exits: {
                    west: 'town_square',
                    north: 'weapon_shop',
                    south: 'armor_shop',
                    east: 'general_store'
                }
            },
            {
                id: 'weapon_shop',
                name: 'Ironforge Weapons',
                description: 'Weapons of all kinds line the walls - swords, axes, bows, and staves. The rhythmic sound of hammer on anvil echoes from the back room where the blacksmith works.',
                exits: {
                    south: 'town_market'
                }
            },
            {
                id: 'armor_shop',
                name: 'Shield & Scale Armory',
                description: 'Suits of armor stand like silent sentinels throughout the shop. Shields bearing various crests hang on the walls, and the shopkeeper polishes a particularly ornate breastplate.',
                exits: {
                    north: 'town_market'
                }
            },
            {
                id: 'general_store',
                name: 'Adventurer\'s Supply',
                description: 'Shelves packed with potions, scrolls, rope, torches, and every conceivable item an adventurer might need. A mysterious locked chest sits in the corner.',
                exits: {
                    west: 'town_market'
                }
            },
            {
                id: 'town_north_gate',
                name: 'Northern Gate',
                description: 'The northern exit of town. Guards in chainmail stand watch, checking travelers as they pass. Beyond the gate, a dirt road leads into the wilderness.',
                exits: {
                    south: 'town_square',
                    north: 'northern_road'
                }
            },
            {
                id: 'northern_road',
                name: 'Northern Road',
                description: 'A well-traveled dirt road stretching north from town. Trees line both sides, their branches creating a natural canopy overhead. You can hear birds chirping and small animals rustling in the underbrush.',
                exits: {
                    south: 'town_north_gate',
                    north: 'crossroads',
                    east: 'forest_entrance'
                }
            },
            {
                id: 'forest_entrance',
                name: 'Forest Entrance',
                description: 'The edge of a dark forest. Tall trees block out much of the sunlight, creating an eerie atmosphere. Strange sounds echo from deeper within.',
                exits: {
                    west: 'northern_road',
                    east: 'dark_forest'
                },
                monsters: ['wolf', 'goblin']
            },
            {
                id: 'dark_forest',
                name: 'Dark Forest',
                description: 'Deep within the forest, visibility is limited. Gnarled roots threaten to trip the unwary, and glowing eyes peer from the shadows. An unnatural chill hangs in the air.',
                exits: {
                    west: 'forest_entrance',
                    north: 'forest_clearing',
                    east: 'spider_grove'
                },
                monsters: ['wolf', 'goblin', 'dark_sprite']
            },
            {
                id: 'spider_grove',
                name: 'Spider Grove',
                description: 'Thick webs stretch between the trees, glistening with dew. Wrapped bundles hang ominously from branches, and you try not to think about what might be inside them.',
                exits: {
                    west: 'dark_forest'
                },
                monsters: ['giant_spider']
            },
            {
                id: 'forest_clearing',
                name: 'Forest Clearing',
                description: 'A peaceful clearing in the forest. Sunlight streams down, illuminating a circle of soft grass. An ancient stone altar stands in the center, covered in mysterious runes.',
                exits: {
                    south: 'dark_forest'
                }
            },
            {
                id: 'crossroads',
                name: 'The Crossroads',
                description: 'Four roads meet here, marked by an old wooden signpost. The signs point to Town (south), Mountains (north), Forest (east), and Plains (west).',
                exits: {
                    south: 'northern_road',
                    north: 'mountain_path',
                    east: 'deep_forest',
                    west: 'grassy_plains'
                }
            },
            {
                id: 'town_south_gate',
                name: 'Southern Gate',
                description: 'The southern exit of town. This gate sees less traffic than the northern one. A few guards lean against the wall, looking bored.',
                exits: {
                    north: 'town_square',
                    south: 'southern_fields'
                }
            },
            {
                id: 'southern_fields',
                name: 'Southern Fields',
                description: 'Rolling fields of grain stretch as far as the eye can see. A gentle breeze causes waves to ripple through the golden crops. Farmhouses dot the landscape.',
                exits: {
                    north: 'town_south_gate',
                    south: 'abandoned_farm'
                },
                monsters: ['scarecrow', 'field_rat']
            },
            {
                id: 'abandoned_farm',
                name: 'Abandoned Farm',
                description: 'A rundown farmhouse with broken windows and a collapsed roof. The fields are overgrown with weeds. Something about this place feels wrong.',
                exits: {
                    north: 'southern_fields',
                    down: 'farm_cellar'
                },
                monsters: ['zombie', 'skeleton']
            },
            {
                id: 'farm_cellar',
                name: 'Farm Cellar',
                description: 'A dank, musty cellar beneath the farmhouse. Broken barrels and rotting sacks line the walls. Strange scratching sounds come from the darkness.',
                exits: {
                    up: 'abandoned_farm'
                },
                monsters: ['skeleton', 'zombie', 'necromancer']
            }
        ];
    }

    getRoom(roomId) {
        return this.rooms.get(roomId);
    }

    spawnMonsters() {
        GameLogger.gameEvent('spawning_monsters_start');
        let totalSpawned = 0;

        for (const [roomId, room] of this.rooms) {
            if (room.monsterSpawns && room.monsterSpawns.length > 0) {
                const spawned = this.spawnRoomMonsters(room);
                totalSpawned += spawned;
            }
        }

        GameLogger.gameEvent('spawning_monsters_complete', { totalSpawned });
    }

    spawnRoomItems() {
        GameLogger.gameEvent('spawning_room_items_start');
        let totalSpawned = 0;

        for (const [roomId, room] of this.rooms) {
            if (room.itemSpawns && room.itemSpawns.length > 0) {
                room.itemSpawns.forEach(itemId => {
                    const item = this.createItem(itemId);
                    if (item) {
                        room.addItem(item);
                        totalSpawned++;
                    }
                });
            }
        }

        GameLogger.gameEvent('spawning_room_items_complete', { totalSpawned });
    }

    spawnRoomMonsters(room) {
        if (!room.monsterSpawns || room.monsterSpawns.length === 0) return 0;
        let spawnedCount = 0;

        room.monsterSpawns.forEach(monsterTypeId => {
            const monsterTemplate = this.monsters.get(monsterTypeId);
            if (monsterTemplate) {
                const monster = new Monster({
                    ...monsterTemplate,
                    currentHp: monsterTemplate.hp || monsterTemplate.maxHp,
                    currentMp: monsterTemplate.mp || monsterTemplate.maxMp || 0,
                    location: room.id
                });
                room.addMonster(monster);
                spawnedCount++;
            } else {
                GameLogger.warn('Monster template not found', { monsterTypeId, roomId: room.id });
            }
        });

        return spawnedCount;
    }

    respawnMonster(roomId, monsterTypeId, delay = 60000) {
        if (this.respawnTimers.has(`${roomId}-${monsterTypeId}`)) {
            return; // Already scheduled to respawn
        }

        const timerId = setTimeout(() => {
            const room = this.rooms.get(roomId);
            const monsterTemplate = this.monsters.get(monsterTypeId);
            
            if (room && monsterTemplate) {
                const monster = new Monster({
                    ...monsterTemplate,
                    currentHp: monsterTemplate.hp,
                    currentMp: monsterTemplate.mp || 0,
                    location: roomId
                });
                
                room.addMonster(monster);
                GameLogger.gameEvent('monster_respawned', { 
                    monsterName: monster.name,
                    roomId,
                    roomName: room.name 
                });
            }
            
            this.respawnTimers.delete(`${roomId}-${monsterTypeId}`);
        }, delay);

        this.respawnTimers.set(`${roomId}-${monsterTypeId}`, timerId);
    }

    getItemTemplate(itemId) {
        // First try to get from loaded world data
        const worldTemplate = this.items.get(itemId);
        if (worldTemplate) {
            return worldTemplate;
        }
        
        // Fallback to static item templates
        return itemTemplates[itemId] || null;
    }

    createItem(itemId, quantity = 1) {
        const template = this.getItemTemplate(itemId);
        if (!template) {
            GameLogger.warn('Item template not found', { itemId });
            return null;
        }

        // Create new Item instance with template data
        const item = new Item({
            ...template,
            quantity: template.stackable ? Math.min(quantity, template.maxStack || 99) : 1
        });

        return item;
    }

    getMonsterData(type) {
        // Use loaded monster templates from world.json
        const template = this.monsters.get(type);
        if (template) {
            return template;
        }
        
        // Fallback for hardcoded monsters if not found in world.json
        const monsterTemplates = {
            wolf: {
                name: 'Gray Wolf',
                description: 'A lean, hungry wolf with gleaming yellow eyes.',
                level: 2,
                maxHp: 30,
                maxMp: 0,
                stats: { str: 8, agi: 10, vit: 6, int: 2, dex: 8, luk: 4 },
                experience: 15,
                gold: 5,
                loot: [
                    { id: 'wolf_pelt', chance: 0.3 },
                    { id: 'wolf_fang', chance: 0.1 }
                ]
            },
            goblin: {
                name: 'Goblin Scout',
                description: 'A small, green-skinned creature with pointed ears and sharp teeth.',
                level: 1,
                maxHp: 20,
                maxMp: 5,
                stats: { str: 5, agi: 8, vit: 4, int: 3, dex: 6, luk: 4 },
                experience: 10,
                gold: 3,
                loot: [
                    { id: 'goblin_ear', chance: 0.5 },
                    { id: 'rusty_dagger', chance: 0.1 }
                ]
            },
            giant_spider: {
                name: 'Giant Spider',
                description: 'A massive arachnid with hairy legs and multiple gleaming eyes.',
                level: 4,
                maxHp: 50,
                maxMp: 0,
                stats: { str: 10, agi: 12, vit: 8, int: 2, dex: 10, luk: 6 },
                experience: 30,
                drops: [
                    { item: 'spider_silk', chance: 0.4 },
                    { item: 'spider_venom', chance: 0.2 }
                ]
            },
            dark_sprite: {
                name: 'Dark Sprite',
                description: 'A shadowy fairy-like creature surrounded by dark mist.',
                level: 3,
                maxHp: 25,
                maxMp: 20,
                stats: { str: 3, agi: 12, vit: 4, int: 10, dex: 8, luk: 8 },
                experience: 20,
                drops: [
                    { item: 'sprite_dust', chance: 0.3 },
                    { item: 'dark_essence', chance: 0.1 }
                ]
            },
            skeleton: {
                name: 'Skeleton Warrior',
                description: 'An animated skeleton wielding a rusty sword.',
                level: 3,
                maxHp: 35,
                maxMp: 0,
                stats: { str: 9, agi: 6, vit: 10, int: 1, dex: 7, luk: 3 },
                experience: 25,
                drops: [
                    { item: 'bone', chance: 0.6 },
                    { item: 'rusty_sword', chance: 0.15 }
                ]
            },
            zombie: {
                name: 'Zombie',
                description: 'A shambling corpse with rotting flesh and vacant eyes.',
                level: 2,
                maxHp: 40,
                maxMp: 0,
                stats: { str: 7, agi: 3, vit: 12, int: 1, dex: 3, luk: 2 },
                experience: 18,
                drops: [
                    { item: 'rotten_flesh', chance: 0.7 },
                    { item: 'tattered_cloth', chance: 0.3 }
                ]
            },
            necromancer: {
                name: 'Necromancer Apprentice',
                description: 'A hooded figure radiating dark energy.',
                level: 5,
                maxHp: 60,
                maxMp: 40,
                stats: { str: 5, agi: 7, vit: 8, int: 15, dex: 10, luk: 7 },
                experience: 50,
                drops: [
                    { item: 'dark_tome', chance: 0.2 },
                    { item: 'necromancer_staff', chance: 0.1 },
                    { item: 'soul_gem', chance: 0.05 }
                ]
            },
            scarecrow: {
                name: 'Animated Scarecrow',
                description: 'A possessed scarecrow with glowing red eyes.',
                level: 1,
                maxHp: 25,
                maxMp: 0,
                stats: { str: 6, agi: 4, vit: 8, int: 1, dex: 4, luk: 3 },
                experience: 12,
                drops: [
                    { item: 'straw', chance: 0.8 },
                    { item: 'old_hat', chance: 0.2 }
                ]
            },
            field_rat: {
                name: 'Giant Field Rat',
                description: 'An oversized rat with sharp teeth and beady eyes.',
                level: 1,
                maxHp: 15,
                maxMp: 0,
                stats: { str: 4, agi: 9, vit: 3, int: 2, dex: 7, luk: 6 },
                experience: 8,
                drops: [
                    { item: 'rat_tail', chance: 0.6 },
                    { item: 'cheese', chance: 0.1 }
                ]
            }
        };

        return monsterTemplates[type] || null;
    }

    respawnMonster(roomId, monsterType) {
        const room = this.getRoom(roomId);
        if (!room) return;

        const monsterData = this.getMonsterData(monsterType);
        if (monsterData) {
            const monster = new Monster(monsterData);
            room.addMonster(monster);
            this.monsters.set(monster.id, monster);
        }
    }

    update() {
        for (const [id, room] of this.rooms) {
            room.update();
        }
    }

    // Shop system methods
    initializeShops() {
        // Initialize all shops
        const shopDefinitions = [
            {
                id: 'weapon_shop',
                name: 'The Sharpened Blade',
                type: 'weapons',
                description: 'A weapon shop specializing in swords, axes, and other combat gear.',
                shopkeeper: 'Marcus the Weaponsmith',
                buyMultiplier: 1.3,
                sellMultiplier: 0.6
            },
            {
                id: 'armor_shop', 
                name: 'Scales and Mail',
                type: 'armor',
                description: 'An armor shop offering protection for adventurers.',
                shopkeeper: 'Elena the Armorsmith',
                buyMultiplier: 1.2,
                sellMultiplier: 0.5
            },
            {
                id: 'general_store',
                name: 'The Traveler\'s Rest',
                type: 'general',
                description: 'A general store with supplies for adventurers.',
                shopkeeper: 'Grimsby the Merchant',
                buyMultiplier: 1.1,
                sellMultiplier: 0.4
            },
            {
                id: 'magic_shop',
                name: 'Mysteries and Marvels',
                type: 'magic',
                description: 'A mystical shop dealing in magical items and potions.',
                shopkeeper: 'Lysandra the Enchantress',
                buyMultiplier: 1.5,
                sellMultiplier: 0.7,
                acceptedTypes: ['magic', 'consumable', 'material']
            }
        ];

        shopDefinitions.forEach(shopData => {
            const shop = new Shop(shopData);
            shop.restock(); // Initial stock
            this.shops.set(shopData.id, shop);
        });

        GameLogger.info('Shops initialized', { shopCount: this.shops.size });
    }

    getShop(roomId) {
        return this.shops.get(roomId);
    }

    isShop(roomId) {
        return this.shops.has(roomId);
    }
}

module.exports = World;