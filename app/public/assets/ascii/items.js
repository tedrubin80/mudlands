/**
 * MUDlands ASCII Art - Item Icons and Decorations
 * Small inline icons for items and inventory display
 */

const ASCII_ITEMS = {
    // ============================================
    // Weapons
    // ============================================
    weapon: {
        sword: '🗡️',
        rusty_sword: '⚔️',
        iron_sword: '🗡️',
        silver_sword: '⚔️✨',
        staff: '🪄',
        wooden_staff: '|🔮',
        dagger: '🔪',
        axe: '🪓',
        bow: '🏹',
        hammer: '🔨',
        icon: '⚔️',
        ascii: `
  /|
 /_|__
   |
   |`
    },

    // ============================================
    // Armor
    // ============================================
    armor: {
        cloth_shirt: '👕',
        leather_armor: '🥋',
        chainmail: '🛡️',
        plate: '🛡️✨',
        icon: '🛡️',
        ascii: `
  ___
 /   \\
|_____|
 \\   /`
    },

    // ============================================
    // Helmets
    // ============================================
    helmet: {
        leather_cap: '🧢',
        iron_helmet: '⛑️',
        icon: '⛑️',
        ascii: `
  ___
 /###\\
|_____|`
    },

    // ============================================
    // Boots
    // ============================================
    boots: {
        cloth_shoes: '👟',
        leather_boots: '🥾',
        icon: '🥾',
        ascii: `
  __
 /  |
|___|`
    },

    // ============================================
    // Accessories
    // ============================================
    accessory: {
        wooden_ring: '💍',
        silver_amulet: '📿✨',
        ring: '💍',
        amulet: '📿',
        icon: '💍',
        ascii: `
  o
 /O\\`
    },

    // ============================================
    // Consumables
    // ============================================
    consumable: {
        bread: '🍞',
        water: '💧',
        health_potion: '❤️🧪',
        mana_potion: '💙🧪',
        greater_health_potion: '❤️🧪✨',
        potion: '🧪',
        food: '🍖',
        icon: '🧪',
        ascii: `
  _
 / \\
|   |
|___|`
    },

    // ============================================
    // Materials
    // ============================================
    material: {
        wolf_pelt: '🐺',
        wolf_fang: '🦷',
        iron_ore: '�ite',
        spider_silk: '🕸️',
        leather: '🟤',
        cloth: '🧵',
        gem: '💎',
        icon: '📦',
        ascii: `
 ____
|    |
|____|`
    },

    // ============================================
    // Tools
    // ============================================
    tool: {
        torch: '🔦',
        lockpick: '🔑',
        rope: '🪢',
        pickaxe: '⛏️',
        icon: '🔧',
        ascii: `
   |
  /|\\
   |`
    },

    // ============================================
    // Quest Items
    // ============================================
    quest: {
        mysterious_key: '🔑✨',
        training_manual: '📖',
        letter: '📜',
        artifact: '🏺',
        icon: '📜',
        ascii: `
  ___
 /   \\
|=====|
 \\___/`
    },

    // ============================================
    // Currency
    // ============================================
    currency: {
        gold_coin: '🪙',
        gold: '🪙',
        silver: '⚪',
        copper: '🟤',
        icon: '🪙',
        ascii: `
  ___
 /   \\
| $ $ |
 \\___/`
    },

    // ============================================
    // Default
    // ============================================
    default: {
        icon: '📦',
        ascii: `
  ___
 |   |
 |___|`
    }
};

// ============================================
// Rarity Colors/Decorations
// ============================================
const RARITY_DECORATIONS = {
    common: {
        prefix: '',
        suffix: '',
        color: '#888888'
    },
    uncommon: {
        prefix: '✦ ',
        suffix: ' ✦',
        color: '#00ff00'
    },
    rare: {
        prefix: '★ ',
        suffix: ' ★',
        color: '#0088ff'
    },
    epic: {
        prefix: '✧ ',
        suffix: ' ✧',
        color: '#aa00ff'
    },
    legendary: {
        prefix: '⚜ ',
        suffix: ' ⚜',
        color: '#ffaa00'
    }
};

// ============================================
// Item Icon Functions
// ============================================

/**
 * Get item icon by type and name
 */
function getItemIcon(itemType, itemName) {
    const type = itemType?.toLowerCase() || 'default';
    const name = itemName?.toLowerCase().replace(/[^a-z0-9_]/g, '_') || '';

    // Check type category
    const category = ASCII_ITEMS[type] || ASCII_ITEMS.default;

    // Try specific item first
    if (category[name]) {
        return category[name];
    }

    // Try partial match
    for (const [key, icon] of Object.entries(category)) {
        if (typeof icon === 'string' && name.includes(key)) {
            return icon;
        }
    }

    // Return category icon
    return category.icon || ASCII_ITEMS.default.icon;
}

/**
 * Get ASCII art for item type
 */
function getItemAscii(itemType) {
    const type = itemType?.toLowerCase() || 'default';
    const category = ASCII_ITEMS[type] || ASCII_ITEMS.default;
    return category.ascii || ASCII_ITEMS.default.ascii;
}

/**
 * Format item name with rarity decoration
 */
function formatItemName(itemName, rarity = 'common') {
    const decoration = RARITY_DECORATIONS[rarity] || RARITY_DECORATIONS.common;
    return `${decoration.prefix}${itemName}${decoration.suffix}`;
}

/**
 * Create item display box
 */
function formatItemBox(item) {
    const icon = getItemIcon(item.type, item.name);
    const rarity = item.rarity || 'common';
    const name = formatItemName(item.name, rarity);

    return `
┌────────────────────────┐
│ ${icon} ${name.padEnd(19)}│
│ Type: ${(item.type || 'Unknown').padEnd(15)}│
│ ${(item.description || '').substring(0, 22).padEnd(22)}│
└────────────────────────┘`;
}

/**
 * Create compact inventory line
 */
function formatInventoryLine(item, quantity = 1) {
    const icon = getItemIcon(item.type, item.name);
    const qtyStr = quantity > 1 ? ` x${quantity}` : '';
    return `${icon} ${item.name}${qtyStr}`;
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.ASCII_ITEMS = ASCII_ITEMS;
    window.RARITY_DECORATIONS = RARITY_DECORATIONS;
    window.getItemIcon = getItemIcon;
    window.getItemAscii = getItemAscii;
    window.formatItemName = formatItemName;
    window.formatItemBox = formatItemBox;
    window.formatInventoryLine = formatInventoryLine;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ASCII_ITEMS,
        RARITY_DECORATIONS,
        getItemIcon,
        getItemAscii,
        formatItemName,
        formatItemBox,
        formatInventoryLine
    };
}
