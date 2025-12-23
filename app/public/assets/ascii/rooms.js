/**
 * MUDlands ASCII Art - Room Headers and Decorations
 * Medium-detail ASCII art for room types and specific locations
 */

const ASCII_ROOMS = {
    // ============================================
    // Room Type Headers (by area/theme)
    // ============================================

    // Town/Urban areas
    town: {
        header: `
╔══════════════════════════════════════════════════════════════╗
║  ⚔  %NAME%
║  %DESC%
╚══════════════════════════════════════════════════════════════╝`,
        border: '═'
    },

    // Forest/Nature areas
    forest: {
        header: `
 /\\  /\\     /\\  /\\     /\\  /\\
/  \\/  \\   /  \\/  \\   /  \\/  \\
────────────────────────────────────
  🌲 %NAME% 🌲
  %DESC%
────────────────────────────────────`,
        border: '~'
    },

    // Dungeon/Underground areas
    dungeon: {
        header: `
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
▓  ☠ %NAME%
▓  %DESC%
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓`,
        border: '▓'
    },

    // Mountain areas
    mountain: {
        header: `
      /\\
     /  \\        /\\
    /    \\      /  \\
───/──────\\────/────\\───────────────
  ⛰ %NAME%
  %DESC%
────────────────────────────────────`,
        border: '-'
    },

    // Water/Coastal areas
    water: {
        header: `
~.~" ~.~" ~.~" ~.~" ~.~" ~.~" ~.~"
  🌊 %NAME%
  %DESC%
~.~" ~.~" ~.~" ~.~" ~.~" ~.~" ~.~"`,
        border: '~'
    },

    // Magical/Mystical areas
    magical: {
        header: `
✦ · ˚ * . ✧ · ˚ * . ✦ · ˚ * . ✧
  ✨ %NAME% ✨
  %DESC%
✧ . * ˚ · ✦ . * ˚ · ✧ . * ˚ · ✦`,
        border: '✦'
    },

    // Fire/Volcanic areas
    fire: {
        header: `
🔥~^~🔥~^~🔥~^~🔥~^~🔥~^~🔥~^~🔥
  ⚡ %NAME% ⚡
  %DESC%
🔥~^~🔥~^~🔥~^~🔥~^~🔥~^~🔥~^~🔥`,
        border: '^'
    },

    // Ice/Frozen areas
    ice: {
        header: `
❄ · * ❄ · * ❄ · * ❄ · * ❄ · * ❄
  ❄ %NAME% ❄
  %DESC%
❄ · * ❄ · * ❄ · * ❄ · * ❄ · * ❄`,
        border: '*'
    },

    // Default fallback
    default: {
        header: `
════════════════════════════════════
  %NAME%
  %DESC%
════════════════════════════════════`,
        border: '═'
    },

    // ============================================
    // Specific Room Art (by room ID)
    // ============================================

    specific: {
        town_square: `
                    .
                   /|\\
                  / | \\
              ___/__|__\\___
             |  TOWN SQUARE |
         ____| ~~~~~~~~~~~~ |____
        |    |   ⛲ ⛲ ⛲  |    |
        | 🏪 |             | 🏪 |
        |____|_____________|____|
            |      👤      |
            |   Merchants  |
            |______________|`,

        guild_hall: `
         _____________________
        |  ADVENTURER'S GUILD |
        |_____________________|
        |  📜  |  ⚔️  |  🛡️  |
        | Quest| Arms | Armor|
        |______|______|______|
        |                    |
        |   🔥 Fireplace 🔥  |
        |____________________|`,

        market_street: `
    🏪━━━━━━🏪━━━━━━🏪━━━━━━🏪
    ┃ FISH ┃ BREAD ┃ CLOTH ┃
    ┃  🐟  ┃  🍞   ┃  🧵   ┃
    ┗━━━━━━┻━━━━━━━┻━━━━━━━┛
       ═══ MARKET STREET ═══
    ┏━━━━━━┳━━━━━━━┳━━━━━━━┓
    ┃ GEMS ┃ POTIONS┃ TOOLS ┃
    ┃  💎  ┃   🧪   ┃  🔧   ┃
    🏪━━━━━━🏪━━━━━━🏪━━━━━━🏪`,

        training_grounds: `
    ╔════════════════════════════╗
    ║    TRAINING GROUNDS        ║
    ╠════════════════════════════╣
    ║  🎯    🗡️    🎯    🗡️    🎯  ║
    ║  Target  Dummy  Target     ║
    ║                            ║
    ║    ░░░░░░░░░░░░░░░░░░     ║
    ║    ░  SPARRING RING  ░     ║
    ║    ░░░░░░░░░░░░░░░░░░     ║
    ╚════════════════════════════╝`,

        forest_entrance: `
       🌲      🌲      🌲      🌲
      /||\\    /||\\    /||\\    /||\\
     / || \\  / || \\  / || \\  / || \\
    ───||────/  ||  \\────||───────
      /  \\  🌿  ||   🌿  ||
     Path leads into darkness...
    ─────────────────────────────`,

        deep_forest: `
    🌲🌲🌲   DANGER   🌲🌲🌲
     ║║║   ~~~~~~~   ║║║
     ║║║  Shadows    ║║║
     ║║║   lurk      ║║║
     ║║║   here...   ║║║
    🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲`,

        blacksmith_forge: `
    ╔═══════════════════════════╗
    ║   ⚒️ BLACKSMITH FORGE ⚒️   ║
    ╠═══════════════════════════╣
    ║  🔥🔥🔥  │  ⚔️ 🗡️ 🔪    ║
    ║  FORGE   │  WEAPONS     ║
    ║  ░░░░░   │  ═════       ║
    ║  ANVIL   │  🛡️ ARMOR 🛡️  ║
    ╚═══════════════════════════╝`,

        inn_common: `
    ╔═════════════════════════════╗
    ║  🍺 THE RUSTY TANKARD 🍺   ║
    ╠═════════════════════════════╣
    ║ ┌─────┐  🔥    ┌─────┐    ║
    ║ │TABLE│  Fire  │TABLE│    ║
    ║ └─────┘  place └─────┘    ║
    ║                            ║
    ║ ═══════ BAR ═══════════   ║
    ║  🍺  🍺  🍺  🍺  🍺      ║
    ╚═════════════════════════════╝`,

        temple_district: `
           ⛪
          /||\\
         / || \\
        /  ||  \\
    ───/───||───\\───────────
      TEMPLE DISTRICT
    ════════════════════════
     Prayers echo softly...`,

        crystal_caves: `
    💎  ·  💎  ·  💎  ·  💎
    ╔════════════════════════╗
    ║  CRYSTAL CAVES         ║
    ║  ✧ Crystals shimmer ✧  ║
    ║     in the darkness    ║
    ╚════════════════════════╝
    💎  ·  💎  ·  💎  ·  💎`,

        frozen_wasteland: `
    ❄️ ═══════════════════ ❄️
    ║  FROZEN WASTELAND     ║
    ║  ~~~~~~~~~~~~~~~~~~~  ║
    ║   ❄️ Bitter cold ❄️   ║
    ║   winds howl...       ║
    ❄️ ═══════════════════ ❄️`
    }
};

// ============================================
// Room Type Detection
// ============================================
const ROOM_TYPE_KEYWORDS = {
    forest: ['forest', 'grove', 'woods', 'clearing', 'tree', 'woodland'],
    dungeon: ['cave', 'dungeon', 'tunnel', 'crypt', 'tomb', 'sewer', 'underground'],
    mountain: ['mountain', 'peak', 'cliff', 'highland', 'ridge', 'rocky'],
    water: ['river', 'lake', 'ocean', 'sea', 'beach', 'dock', 'pier', 'harbor'],
    magical: ['magic', 'mystic', 'enchant', 'wizard', 'mage', 'temple', 'shrine', 'spirit'],
    fire: ['volcano', 'lava', 'fire', 'flame', 'inferno', 'burning'],
    ice: ['ice', 'frozen', 'frost', 'snow', 'glacier', 'cold', 'winter'],
    town: ['town', 'city', 'village', 'market', 'square', 'street', 'shop', 'inn', 'guild', 'hall']
};

/**
 * Detect room type from room ID and name
 */
function detectRoomType(roomId, roomName) {
    const searchText = (roomId + ' ' + roomName).toLowerCase();

    for (const [type, keywords] of Object.entries(ROOM_TYPE_KEYWORDS)) {
        for (const keyword of keywords) {
            if (searchText.includes(keyword)) {
                return type;
            }
        }
    }
    return 'default';
}

/**
 * Get ASCII header for a room
 */
function getRoomHeader(roomId, roomName, description = '') {
    // Check for specific room art first
    if (ASCII_ROOMS.specific[roomId]) {
        return ASCII_ROOMS.specific[roomId];
    }

    // Get type-based header
    const roomType = detectRoomType(roomId, roomName);
    const template = ASCII_ROOMS[roomType] || ASCII_ROOMS.default;

    // Short description (truncate if needed)
    const shortDesc = description.length > 50
        ? description.substring(0, 47) + '...'
        : description;

    return template.header
        .replace('%NAME%', roomName)
        .replace('%DESC%', shortDesc);
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.ASCII_ROOMS = ASCII_ROOMS;
    window.getRoomHeader = getRoomHeader;
    window.detectRoomType = detectRoomType;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ASCII_ROOMS, getRoomHeader, detectRoomType };
}
