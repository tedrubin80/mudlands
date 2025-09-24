require('dotenv').config();
const { pool } = require('../src/config/database');

const rooms = [
    {
        id: 'town_square',
        name: 'Elden Town Square',
        description: 'The heart of Elden, a bustling town square paved with smooth cobblestones. A magnificent fountain sits at the center, its crystal waters dancing in the light. Colorful banners flutter from lamp posts, and the sound of merchants calling out their wares fills the air. Well-worn paths lead in all directions to different districts of the town.',
        exits: {
            north: 'town_gate_north',
            south: 'town_gate_south', 
            east: 'market_district',
            west: 'residential_district',
            northeast: 'training_grounds',
            northwest: 'temple_district'
        },
        properties: {
            safe: true,
            respawn_point: true,
            landmark: true
        },
        npcs: ['guard_marcus']
    },
    
    // Enhanced Market District
    {
        id: 'market_district',
        name: 'Market District',
        description: 'A lively commercial area where merchants from across the realm gather to trade. Wooden stalls line the wide street, their awnings providing shade for both vendors and customers. The aroma of fresh bread mingles with the scent of leather goods and metal polish. Shop signs creak gently in the breeze.',
        exits: {
            west: 'town_square',
            north: 'weapon_shop',
            south: 'armor_shop', 
            east: 'general_store',
            northeast: 'magic_shop',
            southeast: 'blacksmith'
        },
        properties: {
            safe: true,
            commercial: true
        },
        npcs: ['blacksmith_thorin']
    },
    
    {
        id: 'weapon_shop',
        name: 'The Sharpened Blade',
        description: 'A weapon shop filled with the gleam of polished steel. Swords, axes, and spears line the walls in neat displays. The sound of metal being sharpened echoes from a back room. A burly shopkeeper with calloused hands stands behind a counter displaying daggers and throwing knives.',
        exits: {
            south: 'market_district'
        },
        properties: {
            safe: true,
            shop: true,
            shop_type: 'weapons'
        }
    },
    
    {
        id: 'armor_shop', 
        name: 'Scales and Mail',
        description: 'An armor shop displaying suits of leather and metal protection. Mannequins wear full sets of gear, from simple cloth to gleaming chainmail. Shields of various sizes hang from wall mounts, and helmets sit on shelves like silent guardians.',
        exits: {
            north: 'market_district'
        },
        properties: {
            safe: true,
            shop: true,
            shop_type: 'armor'
        }
    },
    
    {
        id: 'general_store',
        name: 'The Traveler\'s Rest',
        description: 'A well-stocked general store crammed with supplies for adventurers. Shelves hold everything from rope and torches to dried provisions and healing potions. Barrels and sacks are stacked high, creating narrow aisles between the merchandise. The shopkeeper\'s cat lazily watches customers from atop a pile of blankets.',
        exits: {
            west: 'market_district'
        },
        properties: {
            safe: true,
            shop: true,
            shop_type: 'general'
        }
    },
    
    {
        id: 'blacksmith',
        name: 'The Forge',
        description: 'A working blacksmith\'s forge where the heat is intense and sparks fly. The rhythmic pounding of hammer on anvil fills the air. Red-hot metal glows in the furnace while finished pieces cool in water barrels with loud hisses of steam. Tools and raw materials are scattered about the work area.',
        exits: {
            northwest: 'market_district'
        },
        properties: {
            safe: true,
            crafting: true,
            noisy: true
        }
    },
    
    {
        id: 'magic_shop',
        name: 'Mysteries and Marvels',
        description: 'A mystical shop filled with arcane curiosities. Crystals glow softly on shelves, and strange symbols are carved into the wooden beams. The air hums with magical energy, and occasionally a book flutters its pages without any wind. Bottles of swirling liquid line the walls.',
        exits: {
            southwest: 'market_district'
        },
        properties: {
            safe: true,
            shop: true,
            shop_type: 'magic',
            magical: true
        }
    },
    
    // Residential District
    {
        id: 'residential_district',
        name: 'Residential Quarter',
        description: 'A quiet residential area with well-maintained houses lining cobblestone streets. Window boxes overflow with colorful flowers, and laundry flutters on lines between buildings. Children\'s laughter can be heard from nearby yards, and the occasional cat darts between shadowed alleys.',
        exits: {
            east: 'town_square',
            north: 'tavern_inn'
        },
        properties: {
            safe: true,
            quiet: true,
            residential: true
        }
    },
    
    {
        id: 'tavern_inn',
        name: 'The Prancing Pony Inn',
        description: 'A warm and welcoming inn with a crackling fireplace and the rich aroma of hearty stew. Wooden tables are filled with locals sharing stories over frothy ales. A bard in the corner strums a lute while singing tales of adventure. Stairs lead up to guest rooms for weary travelers.',
        exits: {
            south: 'residential_district',
            up: 'inn_rooms'
        },
        properties: {
            safe: true,
            inn: true,
            rest: true,
            social: true
        }
    },
    
    // Training Grounds
    {
        id: 'training_grounds',
        name: 'Elden Training Grounds',
        description: 'An open area dedicated to combat training, with practice dummies, weapon racks, and marked sparring circles. New adventurers learn basic combat techniques here while veterans hone their skills. The ground is packed earth, worn smooth by countless hours of practice.',
        exits: {
            southwest: 'town_square'
        },
        properties: {
            safe: true,
            training: true,
            combat_practice: true
        },
        npcs: ['trainer_gareth']
    },
    
    // Temple District
    {
        id: 'temple_district',
        name: 'Temple of Light',
        description: 'A serene temple dedicated to the forces of light and healing. Tall columns support a vaulted ceiling painted with celestial scenes. Candles flicker on the altar, and the air is filled with the soft sound of prayer and meditation. Healing herbs grow in carefully tended gardens visible through stained glass windows.',
        exits: {
            southeast: 'town_square',
            north: 'mage_tower'
        },
        properties: {
            safe: true,
            holy: true,
            healing: true,
            peaceful: true
        }
    },
    
    {
        id: 'mage_tower',
        name: 'Tower of the Arcane',
        description: 'A tall stone tower filled with the mysterious energies of magic. Ancient tomes line the circular walls from floor to ceiling, and strange crystals hum with power on various shelves. A spiral staircase leads up to the study, while magical symbols carved into the stone floor glow with a soft blue light.',
        exits: {
            south: 'temple_district',
            up: 'mage_tower_study'
        },
        properties: {
            safe: true,
            magical: true
        }
    },
    
    {
        id: 'mage_tower_study',
        name: 'Wizard\'s Study',
        description: 'The private study of the court wizard, filled with arcane instruments, bubbling alchemical apparatus, and scrolls covered in mystical formulas. A large crystal ball sits upon an ornate desk, and star charts cover one entire wall. The air shimmers with barely contained magical energy.',
        exits: {
            down: 'mage_tower'
        },
        properties: {
            safe: true,
            magical: true,
            study: true
        },
        npcs: ['mage_aldric']
    },
    
    // Town Gates
    {
        id: 'town_gate_north',
        name: 'North Gate of Elden',
        description: 'The imposing northern gate of Elden, built from massive stone blocks and reinforced with iron bands. Guards in polished armor stand watch, checking travelers coming and going. Beyond the gate, a well-maintained road leads toward distant forests and mountains.',
        exits: {
            south: 'town_square',
            north: 'north_road'
        },
        properties: {
            safe: true,
            guarded: true,
            checkpoint: true
        }
    },
    
    {
        id: 'town_gate_south',
        name: 'South Gate of Elden', 
        description: 'The southern entrance to Elden, where merchants and travelers arrive from the farming communities to the south. The gate is bustling with activity as wagons loaded with goods wait for inspection. The guards here are more relaxed, knowing the southern roads are generally safer.',
        exits: {
            north: 'town_square',
            south: 'south_road'
        },
        properties: {
            safe: true,
            guarded: true,
            commercial: true
        }
    },
    
    // === FIRST DUNGEON: THE ABANDONED MINES ===
    {
        id: 'north_road',
        name: 'North Road',
        description: 'A well-traveled road leading north from Elden toward the wilderness. Stone mile markers show the distance to various destinations. The road is wide enough for two wagons to pass, with grassy ditches on either side where wildflowers grow.',
        exits: {
            south: 'town_gate_north',
            north: 'forest_entrance',
            northeast: 'mine_entrance'
        },
        properties: {
            safe: false,
            road: true
        }
    },
    
    {
        id: 'mine_entrance',
        name: 'Abandoned Mine Entrance',
        description: 'The entrance to an old mining operation, now long abandoned. Rusted mining carts sit on broken rails, and the wooden support beams show signs of age and decay. A cold draft emanates from the dark tunnel leading deeper into the mountain. Warning signs posted near the entrance are barely legible.',
        exits: {
            southwest: 'north_road',
            down: 'mine_tunnel_1'
        },
        properties: {
            safe: false,
            dungeon_entrance: true,
            ominous: true
        },
        monsters: [
            { type: 'giant_spider', chance: 0.3, respawn: 300000 }
        ]
    },
    
    {
        id: 'mine_tunnel_1',
        name: 'Mine Tunnel - Upper Level',
        description: 'A narrow tunnel carved into solid rock, lit only by the faint light filtering down from the entrance above. Mining tools lie scattered about, abandoned by workers who fled long ago. The air is stale and carries an unsettling echo of distant sounds.',
        exits: {
            up: 'mine_entrance',
            north: 'mine_chamber_1',
            east: 'mine_tunnel_2'
        },
        properties: {
            safe: false,
            dark: true,
            underground: true
        },
        monsters: [
            { type: 'cave_rat', chance: 0.4, respawn: 180000 },
            { type: 'skeleton', chance: 0.2, respawn: 600000 }
        ],
        items: [
            { id: 'torch', chance: 0.3 },
            { id: 'iron_ore', chance: 0.2 }
        ]
    },
    
    {
        id: 'mine_chamber_1',
        name: 'Mining Chamber',
        description: 'A large chamber carved out of the mountain, with pickaxe marks still visible on the walls. An old mining cart filled with ore sits in the center, its contents glinting in whatever light reaches this depth. Support beams creak ominously overhead.',
        exits: {
            south: 'mine_tunnel_1',
            east: 'mine_chamber_2',
            down: 'mine_deep_1'
        },
        properties: {
            safe: false,
            dark: true,
            underground: true,
            treasure_room: true
        },
        monsters: [
            { type: 'skeleton', chance: 0.4, respawn: 480000 },
            { type: 'giant_spider', chance: 0.3, respawn: 360000 }
        ],
        items: [
            { id: 'iron_ore', chance: 0.5 },
            { id: 'health_potion', chance: 0.3 },
            { id: 'silver_sword', chance: 0.05 }
        ]
    },
    
    {
        id: 'mine_tunnel_2',
        name: 'Mine Tunnel - East Branch',
        description: 'This tunnel branches off from the main shaft, leading deeper into unexplored areas of the mine. Strange scratches mar the walls, and the sound of scurrying can be heard from the darkness ahead. A broken lantern lies shattered on the floor.',
        exits: {
            west: 'mine_tunnel_1',
            north: 'mine_chamber_2',
            east: 'mine_dead_end'
        },
        properties: {
            safe: false,
            dark: true,
            underground: true
        },
        monsters: [
            { type: 'cave_rat', chance: 0.6, respawn: 120000 },
            { type: 'dark_sprite', chance: 0.3, respawn: 300000 }
        ]
    },
    
    {
        id: 'mine_chamber_2',
        name: 'Crystal Chamber',
        description: 'A magnificent chamber where the miners discovered a vein of magical crystals. The walls sparkle with embedded gems that provide a faint, ethereal light. However, the beauty is marred by signs of a hasty evacuation - tools dropped mid-use and overturned carts.',
        exits: {
            west: 'mine_chamber_1',
            south: 'mine_tunnel_2',
            down: 'mine_deep_2'
        },
        properties: {
            safe: false,
            underground: true,
            magical: true,
            treasure_room: true
        },
        monsters: [
            { type: 'dark_sprite', chance: 0.5, respawn: 240000 },
            { type: 'crystal_golem', chance: 0.2, respawn: 900000 }
        ],
        items: [
            { id: 'mana_potion', chance: 0.4 },
            { id: 'silver_amulet', chance: 0.2 },
            { id: 'magic_crystal', chance: 0.1 }
        ]
    },
    
    {
        id: 'mine_dead_end',
        name: 'Collapsed Tunnel',
        description: 'This tunnel ends abruptly in a wall of fallen rocks and timber. The cave-in appears recent, and loose stones continue to fall occasionally. A skeleton in miner\'s clothing lies pinned beneath the rubble, a warning of the dangers within.',
        exits: {
            west: 'mine_tunnel_2'
        },
        properties: {
            safe: false,
            dark: true,
            underground: true,
            dead_end: true
        },
        monsters: [
            { type: 'skeleton', chance: 0.8, respawn: 300000 }
        ],
        items: [
            { id: 'lockpick', chance: 0.3 },
            { id: 'iron_helmet', chance: 0.15 }
        ]
    },
    
    {
        id: 'mine_deep_1',
        name: 'Deep Mine Shaft',
        description: 'The deepest part of the mine, where the air grows thick and oppressive. Strange fungi glow faintly on the walls, providing the only source of light in this forgotten depth. The sound of dripping water echoes from unseen chambers.',
        exits: {
            up: 'mine_chamber_1',
            east: 'mine_deep_2',
            south: 'mine_boss_chamber'
        },
        properties: {
            safe: false,
            dark: true,
            underground: true,
            deep: true
        },
        monsters: [
            { type: 'skeleton', chance: 0.6, respawn: 240000 },
            { type: 'shadow_wraith', chance: 0.3, respawn: 600000 }
        ]
    },
    
    {
        id: 'mine_deep_2',
        name: 'Underground Pool',
        description: 'A natural chamber where groundwater has formed a dark, still pool. The water reflects the faint fungal light like a black mirror. Strange ripples occasionally disturb the surface, suggesting something dwells beneath.',
        exits: {
            up: 'mine_chamber_2',
            west: 'mine_deep_1'
        },
        properties: {
            safe: false,
            dark: true,
            underground: true,
            water: true
        },
        monsters: [
            { type: 'cave_lurker', chance: 0.7, respawn: 180000 },
            { type: 'dark_sprite', chance: 0.4, respawn: 300000 }
        ],
        items: [
            { id: 'greater_health_potion', chance: 0.2 },
            { id: 'water', chance: 0.6 }
        ]
    },
    
    {
        id: 'mine_boss_chamber',
        name: 'The Mine Overseer\'s Office',
        description: 'A large chamber that once served as the mine overseer\'s office and final resting place. Ancient mining equipment lies scattered about, and a massive desk sits covered in dust and old mining reports. But something far more sinister now occupies this space - the corrupted spirit of the mine\'s last overseer, bound to this place by greed and dark magic.',
        exits: {
            north: 'mine_deep_1'
        },
        properties: {
            safe: false,
            dark: true,
            underground: true,
            boss_room: true,
            one_time_loot: true
        },
        monsters: [
            { type: 'mine_overseer_ghost', chance: 1.0, respawn: 3600000, boss: true }
        ],
        items: [
            { id: 'overseer_key', chance: 1.0, unique: true },
            { id: 'mine_overseer_sword', chance: 0.8 },
            { id: 'bag_of_gold', chance: 1.0 }
        ]
    },
    
    // === OVERWORLD AREAS: FIELDS AND COUNTRYSIDE ===
    {
        id: 'south_road',
        name: 'South Road',
        description: 'A peaceful country road leading south through farmland. Golden wheat fields stretch to the horizon, dotted with windmills and farmhouses. The road is well-maintained and relatively safe during daylight hours.',
        exits: {
            north: 'town_gate_south',
            south: 'farming_village',
            east: 'eastern_fields',
            west: 'western_pastures'
        },
        properties: {
            safe: true,
            road: true,
            pastoral: true
        }
    },
    
    {
        id: 'eastern_fields',
        name: 'Eastern Wheat Fields',
        description: 'Vast fields of golden wheat swaying gently in the breeze. Farm workers can be seen in the distance, tending to their crops. A wooden scarecrow stands guard over the harvest, its weathered face watching over the peaceful countryside.',
        exits: {
            west: 'south_road',
            north: 'old_mill',
            south: 'riverside_meadow',
            east: 'field_edge'
        },
        properties: {
            safe: true,
            farmland: true,
            peaceful: true
        },
        monsters: [
            { type: 'field_mouse', chance: 0.2, respawn: 120000 },
            { type: 'scarecrow_spirit', chance: 0.05, respawn: 1800000 }
        ],
        items: [
            { id: 'wheat_grain', chance: 0.4 },
            { id: 'bread', chance: 0.2 }
        ]
    },
    
    {
        id: 'western_pastures',
        name: 'Western Pastures',
        description: 'Rolling green pastures where cattle and sheep graze peacefully. A babbling brook runs through the middle of the field, providing fresh water for the livestock. Wild flowers dot the landscape with splashes of color.',
        exits: {
            east: 'south_road',
            north: 'old_barn',
            south: 'shepherd_hut',
            west: 'forest_edge_west'
        },
        properties: {
            safe: true,
            pastoral: true,
            water: true
        },
        monsters: [
            { type: 'wild_sheep', chance: 0.3, respawn: 300000 },
            { type: 'wolf', chance: 0.1, respawn: 900000 }
        ],
        items: [
            { id: 'wool', chance: 0.3 },
            { id: 'milk', chance: 0.2 }
        ]
    },
    
    {
        id: 'old_mill',
        name: 'Abandoned Windmill',
        description: 'An old stone windmill stands on a hill overlooking the fields. Its wooden blades creak slowly in the wind, though it has not ground grain in many years. The door hangs open, revealing dusty millstones and empty grain sacks within.',
        exits: {
            south: 'eastern_fields',
            down: 'mill_cellar'
        },
        properties: {
            safe: false,
            abandoned: true,
            elevated: true
        },
        monsters: [
            { type: 'giant_spider', chance: 0.4, respawn: 240000 },
            { type: 'barn_owl', chance: 0.3, respawn: 180000 }
        ],
        items: [
            { id: 'old_grain_sack', chance: 0.3 },
            { id: 'rusty_key', chance: 0.1 }
        ]
    },
    
    {
        id: 'mill_cellar',
        name: 'Mill Cellar',
        description: 'The cellar beneath the windmill is damp and filled with the remnants of grain storage. Large wooden barrels line the walls, most now empty or filled with stagnant water. Something moves in the shadows between the containers.',
        exits: {
            up: 'old_mill'
        },
        properties: {
            safe: false,
            dark: true,
            underground: true
        },
        monsters: [
            { type: 'cave_rat', chance: 0.6, respawn: 180000 },
            { type: 'cellar_spider', chance: 0.4, respawn: 240000 }
        ],
        items: [
            { id: 'health_potion', chance: 0.2 },
            { id: 'torch', chance: 0.3 }
        ]
    },
    
    {
        id: 'farming_village',
        name: 'Millhaven Village',
        description: 'A small farming village with thatched-roof cottages and well-tended gardens. Smoke rises from chimneys, and the sound of daily farm life fills the air. Villagers go about their work, tending gardens and caring for animals.',
        exits: {
            north: 'south_road',
            east: 'village_outskirts',
            west: 'village_square'
        },
        properties: {
            safe: true,
            village: true,
            populated: true
        },
        npcs: [
            {
                id: 'village_elder',
                name: 'Elder Hartwell',
                description: 'The wise village elder with kind eyes and weathered hands.'
            }
        ]
    },
    
    {
        id: 'village_square',
        name: 'Millhaven Village Square',
        description: 'The heart of the farming village, centered around an old well and a small market. Villagers gather here to trade goods and share news. A notice board displays local announcements and requests for help.',
        exits: {
            east: 'farming_village',
            north: 'village_shop'
        },
        properties: {
            safe: true,
            village: true,
            market: true
        },
        items: [
            {
                id: 'village_notice_board',
                name: 'Village Notice Board',
                description: 'A wooden board with various village announcements and requests for help.',
                type: 'fixture',
                permanent: true
            }
        ]
    },
    
    {
        id: 'riverside_meadow',
        name: 'Riverside Meadow',
        description: 'A peaceful meadow alongside a gently flowing river. Wildflowers bloom in abundance, and butterflies dance among the blossoms. The sound of flowing water creates a soothing atmosphere perfect for rest and reflection.',
        exits: {
            north: 'eastern_fields',
            south: 'river_crossing',
            east: 'flower_grove'
        },
        properties: {
            safe: true,
            peaceful: true,
            water: true,
            beautiful: true
        },
        monsters: [
            { type: 'butterfly', chance: 0.8, respawn: 60000 },
            { type: 'river_sprite', chance: 0.2, respawn: 600000 }
        ],
        items: [
            { id: 'wild_flowers', chance: 0.5 },
            { id: 'river_stone', chance: 0.3 }
        ]
    },
    
    {
        id: 'river_crossing',
        name: 'Old Stone Bridge',
        description: 'An ancient stone bridge crosses the river at its narrowest point. The stonework is weathered but solid, having stood for centuries. Moss grows on the sides, and small fish can be seen swimming in the clear water below.',
        exits: {
            north: 'riverside_meadow',
            south: 'southern_marsh',
            east: 'bridge_approach',
            west: 'river_bank'
        },
        properties: {
            safe: true,
            bridge: true,
            water: true,
            ancient: true
        },
        monsters: [
            { type: 'bridge_troll', chance: 0.1, respawn: 1200000 }
        ]
    },
    
    {
        id: 'field_edge',
        name: 'Edge of Cultivation',
        description: 'The eastern edge of the farmland, where cultivated fields meet wild grassland. The neat rows of crops gradually give way to untamed prairie grass and wildflowers. A wooden fence marks the boundary between civilization and wilderness.',
        exits: {
            west: 'eastern_fields',
            north: 'wild_grassland',
            south: 'flower_grove',
            east: 'prairie_path'
        },
        properties: {
            safe: false,
            boundary: true,
            transitional: true
        },
        monsters: [
            { type: 'wild_rabbit', chance: 0.4, respawn: 180000 },
            { type: 'grass_snake', chance: 0.3, respawn: 240000 }
        ]
    },
    
    {
        id: 'wild_grassland',
        name: 'Wild Grassland',
        description: 'Endless waves of tall prairie grass stretch toward the horizon. The wind creates rippling patterns across the landscape, and the grass whispers secrets as it sways. Occasional clusters of wildflowers add splashes of color to the golden expanse.',
        exits: {
            south: 'field_edge',
            north: 'prairie_hill',
            east: 'deep_grassland'
        },
        properties: {
            safe: false,
            wild: true,
            grassland: true,
            vast: true
        },
        monsters: [
            { type: 'prairie_wolf', chance: 0.3, respawn: 480000 },
            { type: 'wild_horse', chance: 0.1, respawn: 1800000 },
            { type: 'grass_spirit', chance: 0.2, respawn: 720000 }
        ],
        items: [
            { id: 'prairie_herb', chance: 0.4 },
            { id: 'wild_root', chance: 0.2 }
        ]
    },
    
    {
        id: 'prairie_hill',
        name: 'Prairie Hilltop',
        description: 'A solitary hill rising above the grassland, offering a commanding view of the surrounding countryside. An ancient oak tree provides shade at the summit, its gnarled branches reaching toward the sky. From here, you can see for miles in every direction.',
        exits: {
            south: 'wild_grassland',
            down: 'hill_cave'
        },
        properties: {
            safe: true,
            elevated: true,
            scenic: true,
            landmark: true
        },
        items: [
            { id: 'hawk_feather', chance: 0.3 },
            { id: 'scenic_view', chance: 1.0 }
        ]
    },
    
    {
        id: 'flower_grove',
        name: 'Enchanted Flower Grove',
        description: 'A magical grove where flowers of every color bloom in impossible profusion. The air shimmers with pollen and magic, and the flowers seem to glow with their own inner light. Bees and butterflies work busily among the blossoms.',
        exits: {
            west: 'riverside_meadow',
            north: 'field_edge'
        },
        properties: {
            safe: true,
            magical: true,
            beautiful: true,
            enchanted: true
        },
        monsters: [
            { type: 'flower_fairy', chance: 0.4, respawn: 300000 },
            { type: 'magic_bee', chance: 0.6, respawn: 120000 }
        ],
        items: [
            { id: 'magic_pollen', chance: 0.3 },
            { id: 'enchanted_flower', chance: 0.2 },
            { id: 'fairy_dust', chance: 0.1 }
        ]
    },
    
    // === FOREST AREAS WITH VARIETY ===
    {
        id: 'forest_entrance',
        name: 'Forest Entrance',
        description: 'The edge of a vast woodland, where the well-traveled road gives way to winding forest paths. Ancient trees tower overhead, their canopy filtering sunlight into dappled patterns on the forest floor. The air is fresh and filled with the sounds of birdsong.',
        exits: {
            south: 'north_road',
            north: 'deep_forest',
            east: 'eastern_woods',
            west: 'western_woods'
        },
        properties: {
            safe: false,
            forest: true,
            natural: true
        },
        monsters: [
            { type: 'forest_wolf', chance: 0.2, respawn: 600000 },
            { type: 'deer', chance: 0.4, respawn: 300000 }
        ],
        items: [
            { id: 'mushroom', chance: 0.3 },
            { id: 'wooden_branch', chance: 0.4 }
        ]
    },
    
    {
        id: 'eastern_woods',
        name: 'Eastern Woods',
        description: 'A bright section of forest where deciduous trees create a lighter canopy. Squirrels chatter in the branches above, and wildflowers grow in sunny clearings between the trees. A babbling brook winds through the area.',
        exits: {
            west: 'forest_entrance',
            north: 'sunny_clearing',
            south: 'brook_crossing',
            east: 'deep_eastern_woods'
        },
        properties: {
            safe: false,
            forest: true,
            bright: true,
            water: true
        },
        monsters: [
            { type: 'squirrel', chance: 0.6, respawn: 120000 },
            { type: 'forest_sprite', chance: 0.3, respawn: 480000 },
            { type: 'brown_bear', chance: 0.1, respawn: 1200000 }
        ],
        items: [
            { id: 'acorn', chance: 0.5 },
            { id: 'healing_herb', chance: 0.3 }
        ]
    },
    
    {
        id: 'western_woods',
        name: 'Western Woods',
        description: 'A darker, more mysterious part of the forest dominated by towering evergreen trees. Thick pine needles carpet the ground, muffling all sound. Shafts of sunlight pierce the canopy here and there, creating dramatic lighting effects.',
        exits: {
            east: 'forest_entrance',
            north: 'pine_grove',
            south: 'shadowed_path',
            west: 'dark_thicket'
        },
        properties: {
            safe: false,
            forest: true,
            dark: true,
            evergreen: true
        },
        monsters: [
            { type: 'shadow_wolf', chance: 0.3, respawn: 720000 },
            { type: 'owl', chance: 0.4, respawn: 240000 },
            { type: 'pine_guardian', chance: 0.1, respawn: 1800000 }
        ],
        items: [
            { id: 'pine_cone', chance: 0.6 },
            { id: 'resin', chance: 0.2 }
        ]
    },
    
    {
        id: 'deep_forest',
        name: 'Deep Forest',
        description: 'The heart of the ancient woodland, where massive trees have stood for centuries. Their trunks are so wide that several people holding hands could not encircle them. The canopy is so thick that only filtered green light reaches the forest floor.',
        exits: {
            south: 'forest_entrance',
            north: 'ancient_grove',
            east: 'forest_heart',
            west: 'twisted_trees'
        },
        properties: {
            safe: false,
            forest: true,
            ancient: true,
            dark: true,
            mystical: true
        },
        monsters: [
            { type: 'treant', chance: 0.1, respawn: 2400000 },
            { type: 'forest_spirit', chance: 0.3, respawn: 900000 },
            { type: 'wild_boar', chance: 0.4, respawn: 480000 }
        ],
        items: [
            { id: 'ancient_bark', chance: 0.2 },
            { id: 'mystic_moss', chance: 0.3 }
        ]
    },
    
    {
        id: 'sunny_clearing',
        name: 'Sunny Forest Clearing',
        description: 'A beautiful natural clearing where sunlight streams down unobstructed. Wildflowers bloom in profusion, and butterflies dance in the warm air. A circle of ancient standing stones suggests this place was once sacred to forest dwellers.',
        exits: {
            south: 'eastern_woods',
            west: 'stone_circle',
            north: 'hidden_glade'
        },
        properties: {
            safe: true,
            forest: true,
            bright: true,
            sacred: true,
            peaceful: true
        },
        monsters: [
            { type: 'butterfly', chance: 0.8, respawn: 60000 },
            { type: 'forest_fairy', chance: 0.3, respawn: 720000 }
        ],
        items: [
            { id: 'sunflower', chance: 0.4 },
            { id: 'blessed_flower', chance: 0.1 }
        ]
    },
    
    {
        id: 'stone_circle',
        name: 'Ancient Stone Circle',
        description: 'A mysterious circle of weathered standing stones deep in the forest. The stones are covered with moss and carved with indecipherable runes that seem to shimmer in certain light. The area hums with ancient magic.',
        exits: {
            east: 'sunny_clearing',
            down: 'underground_chamber'
        },
        properties: {
            safe: false,
            forest: true,
            ancient: true,
            magical: true,
            sacred: true
        },
        monsters: [
            { type: 'stone_guardian', chance: 0.2, respawn: 1800000 },
            { type: 'ancient_spirit', chance: 0.1, respawn: 3600000 }
        ],
        items: [
            { id: 'rune_stone', chance: 0.2 },
            { id: 'ancient_artifact', chance: 0.05 }
        ]
    },
    
    {
        id: 'pine_grove',
        name: 'Whispering Pine Grove',
        description: 'A serene grove of towering pine trees whose needles whisper secrets in the wind. The ground is soft with decades of fallen pine needles, and the air is thick with the rich scent of pine resin. Somewhere in the distance, a woodpecker drums against ancient bark.',
        exits: {
            south: 'western_woods',
            east: 'forest_path',
            north: 'tall_pines'
        },
        properties: {
            safe: false,
            forest: true,
            evergreen: true,
            peaceful: true
        },
        monsters: [
            { type: 'woodpecker', chance: 0.5, respawn: 180000 },
            { type: 'pine_marten', chance: 0.3, respawn: 360000 }
        ],
        items: [
            { id: 'pine_needle_tea', chance: 0.3 },
            { id: 'pine_sap', chance: 0.4 }
        ]
    },
    
    {
        id: 'dark_thicket',
        name: 'Dark Thicket',
        description: 'A dense, almost impenetrable thicket where thorny bushes and twisted vines create a natural maze. The canopy is so thick that it is perpetually twilight here. Strange sounds echo from deep within the undergrowth.',
        exits: {
            east: 'western_woods',
            north: 'briar_maze'
        },
        properties: {
            safe: false,
            forest: true,
            dark: true,
            dangerous: true,
            maze_like: true
        },
        monsters: [
            { type: 'thorn_wolf', chance: 0.4, respawn: 480000 },
            { type: 'shadow_lurker', chance: 0.3, respawn: 720000 },
            { type: 'briar_beast', chance: 0.2, respawn: 900000 }
        ],
        items: [
            { id: 'dark_berry', chance: 0.3 },
            { id: 'thorn_vine', chance: 0.2 }
        ]
    },
    
    {
        id: 'ancient_grove',
        name: 'Grove of the Ancients',
        description: 'The most sacred part of the forest, where the oldest and largest trees dwell. These ancient giants have witnessed the rise and fall of civilizations. Their massive trunks seem to pulse with life, and their roots intertwine in complex patterns beneath the earth.',
        exits: {
            south: 'deep_forest',
            down: 'root_chamber'
        },
        properties: {
            safe: false,
            forest: true,
            ancient: true,
            sacred: true,
            mystical: true,
            powerful: true
        },
        monsters: [
            { type: 'elder_treant', chance: 0.05, respawn: 7200000 },
            { type: 'ancient_guardian', chance: 0.1, respawn: 3600000 },
            { type: 'spirit_of_nature', chance: 0.2, respawn: 1800000 }
        ],
        items: [
            { id: 'heartwood', chance: 0.1 },
            { id: 'essence_of_nature', chance: 0.05 },
            { id: 'ancient_seed', chance: 0.03 }
        ],
        npcs: ['hermit_oldoak']
    },
    
    {
        id: 'brook_crossing',
        name: 'Forest Brook Crossing',
        description: 'Where a crystal-clear forest brook winds through the trees, creating a natural ford. Smooth stones make crossing easy, and the sound of flowing water provides a peaceful backdrop. Fish can be seen darting through the clear water.',
        exits: {
            north: 'eastern_woods',
            south: 'downstream',
            east: 'beaver_dam',
            west: 'fishing_spot'
        },
        properties: {
            safe: true,
            forest: true,
            water: true,
            crossing: true
        },
        monsters: [
            { type: 'trout', chance: 0.6, respawn: 120000 },
            { type: 'water_sprite', chance: 0.2, respawn: 600000 }
        ],
        items: [
            { id: 'fresh_water', chance: 0.8 },
            { id: 'river_pebble', chance: 0.5 }
        ]
    },
    
    {
        id: 'twisted_trees',
        name: 'Grove of Twisted Trees',
        description: 'An unsettling part of the forest where the trees grow in impossible spiral patterns, their branches intertwining in complex knots. The bark appears to have faces and figures carved into it, though whether by nature or design is unclear.',
        exits: {
            east: 'deep_forest',
            north: 'corrupted_grove'
        },
        properties: {
            safe: false,
            forest: true,
            twisted: true,
            unnatural: true,
            ominous: true
        },
        monsters: [
            { type: 'twisted_dryad', chance: 0.3, respawn: 900000 },
            { type: 'bark_horror', chance: 0.2, respawn: 1200000 },
            { type: 'forest_wraith', chance: 0.4, respawn: 720000 }
        ],
        items: [
            { id: 'cursed_bark', chance: 0.3 },
            { id: 'twisted_branch', chance: 0.2 }
        ]
    },
    
    {
        id: 'hidden_glade',
        name: 'Hidden Fairy Glade',
        description: 'A secret glade known only to the forest fairies, where mushrooms grow in perfect rings and flowers bloom out of season. The air sparkles with fairy dust, and tiny lights dance between the leaves. This is a place of pure magic and wonder.',
        exits: {
            south: 'sunny_clearing'
        },
        properties: {
            safe: true,
            forest: true,
            magical: true,
            hidden: true,
            fairy: true,
            enchanted: true
        },
        monsters: [
            { type: 'fairy_queen', chance: 0.1, respawn: 2400000 },
            { type: 'pixie', chance: 0.8, respawn: 180000 },
            { type: 'unicorn', chance: 0.01, respawn: 10800000 }
        ],
        items: [
            { id: 'fairy_ring_mushroom', chance: 0.4 },
            { id: 'pixie_dust', chance: 0.3 },
            { id: 'unicorn_hair', chance: 0.01 }
        ]
    },
    
    // === MOUNTAIN PATHS AND ELEVATED AREAS ===
    {
        id: 'mountain_foothills',
        name: 'Mountain Foothills',
        description: 'Rolling hills at the base of towering mountains, where the flat farmland gives way to steep rocky terrain. Hardy mountain flowers grow between scattered boulders, and the air grows noticeably cooler as elevation increases.',
        exits: {
            south: 'hill_cave',
            north: 'mountain_path',
            east: 'rocky_slope',
            west: 'foothill_meadow'
        },
        properties: {
            safe: false,
            mountain: true,
            elevated: true,
            rocky: true
        },
        monsters: [
            { type: 'mountain_goat', chance: 0.4, respawn: 360000 },
            { type: 'rock_lizard', chance: 0.3, respawn: 240000 },
            { type: 'hill_giant', chance: 0.1, respawn: 1800000 }
        ],
        items: [
            { id: 'mountain_flower', chance: 0.3 },
            { id: 'stone_shard', chance: 0.4 }
        ]
    },
    
    {
        id: 'mountain_path',
        name: 'Winding Mountain Path',
        description: 'A narrow, winding path carved into the mountainside by countless travelers over the centuries. Steep drops fall away on one side while sheer rock walls rise on the other. The path is treacherous but offers breathtaking views of the valley below.',
        exits: {
            south: 'mountain_foothills',
            north: 'high_pass',
            up: 'rocky_ledge',
            down: 'canyon_floor'
        },
        properties: {
            safe: false,
            mountain: true,
            elevated: true,
            dangerous: true,
            path: true
        },
        monsters: [
            { type: 'mountain_wolf', chance: 0.3, respawn: 600000 },
            { type: 'rock_eagle', chance: 0.2, respawn: 480000 },
            { type: 'bandit', chance: 0.2, respawn: 720000 }
        ],
        items: [
            { id: 'climbing_rope', chance: 0.2 },
            { id: 'hardy_ration', chance: 0.3 }
        ]
    },
    
    {
        id: 'high_pass',
        name: 'Windswept High Pass',
        description: 'A high mountain pass where fierce winds howl through the peaks. Snow lingers here even in warmer seasons, and the air is thin and cold. Ancient cairns mark the path, built by travelers to guide others through this treacherous terrain.',
        exits: {
            south: 'mountain_path',
            north: 'mountain_peak',
            east: 'ice_cave',
            west: 'cliff_overlook'
        },
        properties: {
            safe: false,
            mountain: true,
            elevated: true,
            cold: true,
            windy: true
        },
        monsters: [
            { type: 'frost_wolf', chance: 0.3, respawn: 720000 },
            { type: 'ice_elemental', chance: 0.2, respawn: 900000 },
            { type: 'yeti', chance: 0.1, respawn: 1800000 }
        ],
        items: [
            { id: 'ice_crystal', chance: 0.2 },
            { id: 'frozen_herb', chance: 0.1 }
        ]
    },
    
    {
        id: 'mountain_peak',
        name: 'Skyreach Peak',
        description: 'The highest accessible peak in the mountain range, where the world spreads out below like a vast map. The air is so thin that breathing is difficult, and snow caps the rocky summit year-round. A ancient shrine to mountain spirits stands at the very top.',
        exits: {
            south: 'high_pass',
            down: 'hidden_cave'
        },
        properties: {
            safe: false,
            mountain: true,
            summit: true,
            sacred: true,
            scenic: true,
            extreme_elevation: true
        },
        monsters: [
            { type: 'mountain_spirit', chance: 0.2, respawn: 1800000 },
            { type: 'sky_dragon', chance: 0.05, respawn: 7200000 }
        ],
        items: [
            { id: 'summit_crystal', chance: 0.3 },
            { id: 'eagle_feather', chance: 0.2 },
            { id: 'blessing_of_heights', chance: 0.1 }
        ]
    },
    
    {
        id: 'rocky_slope',
        name: 'Treacherous Rocky Slope',
        description: 'A steep slope covered in loose rocks and scree that shift and slide with every step. Mountain climbers use ropes and pitons to navigate this dangerous terrain. Occasional landslides send cascades of stone tumbling down the mountainside.',
        exits: {
            west: 'mountain_foothills',
            up: 'cliff_face',
            down: 'boulder_field'
        },
        properties: {
            safe: false,
            mountain: true,
            dangerous: true,
            unstable: true,
            climbing_required: true
        },
        monsters: [
            { type: 'rock_spider', chance: 0.4, respawn: 240000 },
            { type: 'stone_giant', chance: 0.1, respawn: 2400000 }
        ],
        items: [
            { id: 'climbing_gear', chance: 0.2 },
            { id: 'loose_stone', chance: 0.6 }
        ]
    },
    
    {
        id: 'cliff_face',
        name: 'Sheer Cliff Face',
        description: 'A vertical wall of solid rock that rises hundreds of feet into the sky. Only the most skilled climbers dare attempt this ascent. Nests of mountain birds dot the cliff face, and hardy alpine plants cling to cracks in the stone.',
        exits: {
            down: 'rocky_slope',
            up: 'eagles_nest'
        },
        properties: {
            safe: false,
            mountain: true,
            vertical: true,
            expert_climbing: true,
            dangerous: true
        },
        monsters: [
            { type: 'cliff_racer', chance: 0.5, respawn: 300000 },
            { type: 'mountain_harpy', chance: 0.2, respawn: 900000 }
        ],
        items: [
            { id: 'rare_mineral', chance: 0.1 },
            { id: 'bird_egg', chance: 0.3 }
        ]
    },
    
    {
        id: 'eagles_nest',
        name: 'Giant Eagle\'s Nest',
        description: 'A massive nest built on a precarious ledge high on the cliff face. Constructed from branches, bones, and shiny objects, it offers an unparalleled view of the surrounding landscape. The nest is home to a family of giant eagles who fiercely protect their territory.',
        exits: {
            down: 'cliff_face'
        },
        properties: {
            safe: false,
            mountain: true,
            nest: true,
            extreme_height: true,
            windy: true
        },
        monsters: [
            { type: 'giant_eagle', chance: 0.8, respawn: 1200000 },
            { type: 'storm_eagle', chance: 0.3, respawn: 1800000 }
        ],
        items: [
            { id: 'giant_eagle_feather', chance: 0.4 },
            { id: 'shiny_trinket', chance: 0.3 },
            { id: 'eagle_egg', chance: 0.1 }
        ]
    },
    
    {
        id: 'ice_cave',
        name: 'Glacial Ice Cave',
        description: 'A cave carved from solid ice deep within a mountain glacier. The walls shimmer with blue-white ice that never melts, and icicles hang like crystal spears from the ceiling. The temperature here is far below freezing, and your breath creates clouds of vapor.',
        exits: {
            west: 'high_pass',
            down: 'ice_chamber'
        },
        properties: {
            safe: false,
            mountain: true,
            ice: true,
            cold: true,
            cave: true
        },
        monsters: [
            { type: 'ice_troll', chance: 0.3, respawn: 900000 },
            { type: 'frost_spider', chance: 0.4, respawn: 360000 },
            { type: 'ice_wraith', chance: 0.2, respawn: 720000 }
        ],
        items: [
            { id: 'eternal_ice', chance: 0.2 },
            { id: 'frost_gem', chance: 0.1 }
        ]
    },
    
    {
        id: 'cliff_overlook',
        name: 'Dramatic Cliff Overlook',
        description: 'A jutting promontory that extends out over a vast canyon, providing a spectacular panoramic view of the surrounding mountains and valleys. Strong winds whip across the exposed platform, and the drop below is dizzying.',
        exits: {
            east: 'high_pass',
            down: 'canyon_depths'
        },
        properties: {
            safe: false,
            mountain: true,
            overlook: true,
            windy: true,
            scenic: true,
            dangerous: true
        },
        monsters: [
            { type: 'wind_elemental', chance: 0.3, respawn: 720000 },
            { type: 'cliff_swallow', chance: 0.6, respawn: 180000 }
        ],
        items: [
            { id: 'wind_crystal', chance: 0.2 },
            { id: 'panoramic_view', chance: 1.0 }
        ]
    },
    
    {
        id: 'canyon_floor',
        name: 'Deep Canyon Floor',
        description: 'The bottom of a deep mountain canyon where little sunlight penetrates. A swift mountain stream flows through the canyon, carving the rocks ever deeper. The walls rise steeply on all sides, creating an enclosed, echoing environment.',
        exits: {
            up: 'mountain_path',
            north: 'stream_source',
            south: 'narrow_gorge'
        },
        properties: {
            safe: false,
            mountain: true,
            canyon: true,
            water: true,
            enclosed: true
        },
        monsters: [
            { type: 'canyon_lizard', chance: 0.5, respawn: 240000 },
            { type: 'flash_flood', chance: 0.1, respawn: 1800000 },
            { type: 'hermit_crab', chance: 0.4, respawn: 180000 }
        ],
        items: [
            { id: 'stream_stone', chance: 0.5 },
            { id: 'canyon_echo_shell', chance: 0.2 }
        ]
    },
    
    {
        id: 'boulder_field',
        name: 'Ancient Boulder Field',
        description: 'A field of massive boulders, some as large as houses, scattered across a high mountain plateau. These ancient stones were deposited here by glaciers long ago and now provide shelter and hiding places for various mountain creatures.',
        exits: {
            up: 'rocky_slope',
            west: 'stone_circle_mountain',
            north: 'hidden_valley'
        },
        properties: {
            safe: false,
            mountain: true,
            rocky: true,
            maze_like: true,
            ancient: true
        },
        monsters: [
            { type: 'rock_golem', chance: 0.2, respawn: 1200000 },
            { type: 'mountain_troll', chance: 0.1, respawn: 1800000 },
            { type: 'stone_worm', chance: 0.3, respawn: 600000 }
        ],
        items: [
            { id: 'ancient_fossil', chance: 0.1 },
            { id: 'granite_chunk', chance: 0.4 }
        ]
    },
    
    {
        id: 'hidden_valley',
        name: 'Secret Mountain Valley',
        description: 'A hidden valley nestled between towering peaks, accessible only through narrow passes. This sheltered area has its own microclimate, with lush grass, wildflowers, and a crystal-clear mountain lake. It feels like a paradise hidden from the world.',
        exits: {
            south: 'boulder_field'
        },
        properties: {
            safe: true,
            mountain: true,
            hidden: true,
            valley: true,
            beautiful: true,
            peaceful: true,
            water: true
        },
        monsters: [
            { type: 'mountain_deer', chance: 0.5, respawn: 300000 },
            { type: 'valley_sprite', chance: 0.3, respawn: 600000 }
        ],
        items: [
            { id: 'pure_mountain_water', chance: 0.6 },
            { id: 'valley_flower', chance: 0.4 },
            { id: 'peace_crystal', chance: 0.1 }
        ]
    },
    {
        id: 'town_inn',
        name: 'The Sleeping Dragon Inn',
        description: 'A cozy inn with a warm fireplace. The smell of hearty stew fills the air, and weary travelers rest at wooden tables. A staircase leads up to the guest rooms.',
        exits: {
            east: 'town_square',
            up: 'inn_rooms'
        },
        properties: {
            safe: true,
            heal: true
        },
        npcs: ['innkeeper_sarah', 'bard_lyanna']
    },
    {
        id: 'inn_rooms',
        name: 'Inn Guest Rooms',
        description: 'A hallway lined with doors to private rooms. Soft snoring can be heard from behind some of them. A window at the end offers a view of the town square below.',
        exits: {
            down: 'town_inn'
        },
        properties: {
            safe: true
        }
    },
    {
        id: 'town_market',
        name: 'Town Market',
        description: 'A busy marketplace filled with vendors selling all manner of goods. The air is filled with the sounds of haggling and the smells of exotic spices and fresh bread.',
        exits: {
            west: 'town_square',
            north: 'market_alley'
        },
        properties: {
            safe: true,
            shop: true
        },
        npcs: ['merchant_elena']
    },
    {
        id: 'market_alley',
        name: 'Market Alley',
        description: 'A narrow alley between market stalls. Shadows dance in the flickering torchlight, and the sounds of the main market echo off the walls.',
        exits: {
            south: 'town_market',
            north: 'old_warehouse'
        },
        properties: {}
    },
    {
        id: 'old_warehouse',
        name: 'Old Warehouse',
        description: 'A dusty old warehouse filled with crates and barrels. Cobwebs hang from the rafters, and the air smells of age and neglect. This might be a good place to find abandoned treasures.',
        exits: {
            south: 'market_alley'
        },
        properties: {
            loot_spawn: true
        }
    },
    {
        id: 'town_north_gate',
        name: 'North Town Gate',
        description: 'The sturdy north gate of the town. Guards stand watch here, keeping an eye on travelers coming and going. Beyond the gate, a road leads north into the wilderness.',
        exits: {
            south: 'town_square',
            north: 'forest_entrance'
        },
        properties: {
            safe: true
        }
    },
    {
        id: 'forest_entrance',
        name: 'Forest Entrance',
        description: 'The edge of a dark forest. Ancient trees tower overhead, their branches blocking out most of the sunlight. Strange sounds echo from deep within the woods.',
        exits: {
            south: 'town_north_gate',
            north: 'forest_path',
            east: 'forest_clearing'
        },
        properties: {
            monster_spawn: true
        }
    },
    {
        id: 'forest_path',
        name: 'Forest Path',
        description: 'A winding path through the dense forest. Roots and fallen branches make walking treacherous. You can hear the rustling of unseen creatures in the underbrush.',
        exits: {
            south: 'forest_entrance',
            north: 'deep_forest',
            east: 'spider_lair'
        },
        properties: {
            monster_spawn: true
        }
    },
    {
        id: 'forest_clearing',
        name: 'Forest Clearing',
        description: 'A peaceful clearing in the forest where sunlight filters through the canopy. Wildflowers grow here, and a small stream babbles nearby.',
        exits: {
            west: 'forest_entrance',
            north: 'hidden_cave'
        },
        properties: {
            rest: true
        }
    },
    {
        id: 'hidden_cave',
        name: 'Hidden Cave',
        description: 'A mysterious cave hidden behind a curtain of vines. Strange crystals embedded in the walls glow with an otherworldly light. This place feels ancient and magical.',
        exits: {
            south: 'forest_clearing'
        },
        properties: {
            magical: true,
            treasure: true
        }
    },
    {
        id: 'spider_lair',
        name: 'Spider Lair',
        description: 'A dark, web-filled lair where giant spiders make their home. Sticky webs hang everywhere, and you can see the wrapped remains of previous victims.',
        exits: {
            west: 'forest_path'
        },
        properties: {
            dangerous: true,
            monster_spawn: true,
            boss_room: true
        }
    },
    {
        id: 'deep_forest',
        name: 'Deep Forest',
        description: 'The heart of the ancient forest. The trees here are massive and old, their trunks wider than houses. An eerie silence pervades this place.',
        exits: {
            south: 'forest_path',
            east: 'ancient_grove'
        },
        properties: {
            monster_spawn: true,
            rare_spawns: true
        }
    },
    {
        id: 'ancient_grove',
        name: 'Ancient Grove',
        description: 'A sacred grove where druids once performed their rituals. A stone circle stands in the center, covered in mysterious runes. The air hums with residual magic.',
        exits: {
            west: 'deep_forest'
        },
        properties: {
            sacred: true,
            magical: true,
            quest_location: true
        }
    },
    {
        id: 'town_south_gate',
        name: 'South Town Gate',
        description: 'The southern gate leading out of town. A well-traveled road stretches south toward distant mountains. Merchant caravans often rest here before beginning their journeys.',
        exits: {
            north: 'town_square',
            south: 'crossroads'
        },
        properties: {
            safe: true
        }
    },
    {
        id: 'crossroads',
        name: 'Crossroads',
        description: 'A junction where several roads meet. A weathered signpost points in different directions, and travelers often stop here to decide their path.',
        exits: {
            north: 'town_south_gate',
            south: 'mountain_trail',
            east: 'river_crossing',
            west: 'abandoned_farm'
        },
        properties: {}
    },
    {
        id: 'mountain_trail',
        name: 'Mountain Trail',
        description: 'A steep trail winding up into the mountains. The air grows thinner here, and the path becomes more treacherous with each step.',
        exits: {
            north: 'crossroads',
            up: 'mountain_peak'
        },
        properties: {
            monster_spawn: true
        }
    },
    {
        id: 'mountain_peak',
        name: 'Mountain Peak',
        description: 'The summit of the mountain. From here you can see for miles in every direction. A small shrine dedicated to the mountain spirits stands here.',
        exits: {
            down: 'mountain_trail'
        },
        properties: {
            sacred: true,
            treasure: true
        }
    }
];

async function populateRooms() {
    console.log('Populating rooms database...');
    
    try {
        for (const room of rooms) {
            const query = `
                INSERT INTO rooms (id, name, description, exits, properties, npcs)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (id) DO UPDATE SET
                    name = $2,
                    description = $3,
                    exits = $4,
                    properties = $5,
                    npcs = $6
            `;
            
            await pool.query(query, [
                room.id,
                room.name,
                room.description,
                JSON.stringify(room.exits),
                JSON.stringify(room.properties),
                JSON.stringify(room.npcs || [])
            ]);
        }
        
        console.log(`Successfully populated ${rooms.length} rooms!`);
        process.exit(0);
    } catch (error) {
        console.error('Error populating rooms:', error);
        process.exit(1);
    }
}

populateRooms();