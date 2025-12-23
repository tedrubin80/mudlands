/**
 * MUDlands ASCII Art - NPC Portraits
 * Compact 5-7 line portraits for each NPC
 */

const ASCII_NPCS = {
    // ============================================
    // Named NPCs (from game data)
    // ============================================

    marcus: {
        name: 'Marcus',
        title: 'Town Guard',
        portrait: `
   .---.
  / ⚔️  \\
 |[o  o]|
 | \\__/ |
  \\====/
 [GUARD]`
    },

    sarah: {
        name: 'Sarah',
        title: 'Innkeeper',
        portrait: `
   .~~~.
  ( o o )
   \\   /
  __|___|__
 |  SARAH |
 |INNKEEPER|`
    },

    thorin: {
        name: 'Thorin',
        title: 'Master Blacksmith',
        portrait: `
   _===_
  /@   @\\
 (| ### |)
  | === |
  |_⚒️_|
 [THORIN]`
    },

    elena: {
        name: 'Elena',
        title: 'Traveling Merchant',
        portrait: `
    ,_,
   (o.o)
   />💰<\\
  /|   |\\
   ELENA
 [MERCHANT]`
    },

    aldric: {
        name: 'Aldric',
        title: 'Court Wizard',
        portrait: `
    /\\
   /✨\\
  | 👴 |
  | ~~ |
  |_||_|
 [WIZARD]`
    },

    gareth: {
        name: 'Gareth',
        title: 'Training Master',
        portrait: `
   (💪)
  /|⚔️|\\
   |  |
  /|  |\\
 GARETH
[TRAINER]`
    },

    lyanna: {
        name: 'Lyanna',
        title: 'Wandering Bard',
        portrait: `
   ~♪~
  (◕‿◕)
   )🎵(
  /|  |\\
  LYANNA
  [BARD]`
    },

    old_oak: {
        name: 'Old Oak',
        title: 'Forest Hermit',
        portrait: `
  🌿_🌿
  |o o|
  | ~ |
  /| |\\
 OLD OAK
 [HERMIT]`
    },

    aldric_stoneheart: {
        name: 'Aldric Stoneheart',
        title: 'Guild Master',
        portrait: `
  ╔═══╗
  ║👨‍💼║
  ║ ⚔️ ║
  ╚═══╝
  GUILD
 MASTER`
    },

    elara_swift: {
        name: 'Elara Swift',
        title: 'Quest Clerk',
        portrait: `
   📜
  (•‿•)
  |📋|
  |__|
  ELARA
 [CLERK]`
    },

    // ============================================
    // Generic NPC Types
    // ============================================

    guard: {
        name: 'Guard',
        title: 'Town Guard',
        portrait: `
  .---.
 /⚔️   \\
|[■  ■]|
 \\====/
[GUARD]`
    },

    merchant: {
        name: 'Merchant',
        title: 'Shopkeeper',
        portrait: `
   ___
  ($ $)
   )💰(
  |___|
[MERCHANT]`
    },

    soldier: {
        name: 'Soldier',
        title: 'Royal Soldier',
        portrait: `
  ⚔️
 /|▓|\\
  |▓|
 /   \\
[SOLDIER]`
    },

    priest: {
        name: 'Priest',
        title: 'Temple Priest',
        portrait: `
   ✝️
  /   \\
 | ☮️  |
  \\_|_/
 [PRIEST]`
    },

    mage: {
        name: 'Mage',
        title: 'Arcane Mage',
        portrait: `
   /\\
  /✨\\
 | 👁️ |
  |~~|
 [MAGE]`
    },

    thief: {
        name: 'Thief',
        title: 'Shady Figure',
        portrait: `
   ___
  /👀\\
 |    |
  \\🗡️/
 [THIEF]`
    },

    farmer: {
        name: 'Farmer',
        title: 'Local Farmer',
        portrait: `
   🌾
  (• •)
  /|🌽|\\
   | |
[FARMER]`
    },

    fisherman: {
        name: 'Fisherman',
        title: 'Dock Fisherman',
        portrait: `
   🎣
  (• •)
  /|🐟|\\
   ~~~
[FISHER]`
    },

    noble: {
        name: 'Noble',
        title: 'Aristocrat',
        portrait: `
   👑
  (◔◔)
  |💎|
  |__|
 [NOBLE]`
    },

    beggar: {
        name: 'Beggar',
        title: 'Poor Soul',
        portrait: `
   ~~~
  (;_;)
   )🍞(
  _|_|_
[BEGGAR]`
    },

    // ============================================
    // Default/Unknown
    // ============================================

    default: {
        name: 'Stranger',
        title: 'Unknown',
        portrait: `
   ?
  (• •)
   | |
  /   \\
[UNKNOWN]`
    }
};

// ============================================
// Portrait Rendering Functions
// ============================================

/**
 * Get NPC portrait by ID or type
 */
function getNPCPortrait(npcId) {
    // Normalize ID
    const id = npcId.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    // Try exact match first
    if (ASCII_NPCS[id]) {
        return ASCII_NPCS[id];
    }

    // Try partial matches
    for (const [key, npc] of Object.entries(ASCII_NPCS)) {
        if (id.includes(key) || key.includes(id)) {
            return npc;
        }
    }

    // Return default
    return ASCII_NPCS.default;
}

/**
 * Get formatted portrait with name and title
 */
function formatNPCPortrait(npc) {
    const portrait = getNPCPortrait(npc.id || npc.name || 'default');
    const name = npc.name || portrait.name;
    const title = npc.title || portrait.title;

    return `
┌──────────────────┐
│ ${name.padEnd(16)} │
│ ${title.padEnd(16)} │
├──────────────────┤
${portrait.portrait}
└──────────────────┘`;
}

/**
 * Get compact inline portrait
 */
function getCompactPortrait(npcId) {
    const portrait = getNPCPortrait(npcId);
    // Return just the core 3-line portrait
    const lines = portrait.portrait.trim().split('\n');
    return lines.slice(0, 3).join('\n');
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.ASCII_NPCS = ASCII_NPCS;
    window.getNPCPortrait = getNPCPortrait;
    window.formatNPCPortrait = formatNPCPortrait;
    window.getCompactPortrait = getCompactPortrait;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ASCII_NPCS, getNPCPortrait, formatNPCPortrait, getCompactPortrait };
}
