/**
 * MUDlands ASCII Art Renderer
 * Handles rendering of ASCII art in the text client
 */

class ASCIIArtRenderer {
    constructor() {
        this.roomsLoaded = false;
        this.npcsLoaded = false;
        this.itemsLoaded = false;
    }

    /**
     * Initialize the renderer (load data files if not already loaded)
     */
    init() {
        // Data is loaded via script tags, check if available
        this.roomsLoaded = typeof window.ASCII_ROOMS !== 'undefined';
        this.npcsLoaded = typeof window.ASCII_NPCS !== 'undefined';
        this.itemsLoaded = typeof window.ASCII_ITEMS !== 'undefined';
    }

    // ============================================
    // Room Art Methods
    // ============================================

    /**
     * Get room header art
     */
    getRoomHeader(roomId, roomName, description = '') {
        if (typeof window.getRoomHeader === 'function') {
            return window.getRoomHeader(roomId, roomName, description);
        }
        // Fallback if data not loaded
        return this.createSimpleRoomHeader(roomName, description);
    }

    /**
     * Create simple fallback room header
     */
    createSimpleRoomHeader(roomName, description) {
        const line = '═'.repeat(50);
        return `
${line}
  ${roomName}
  ${description.substring(0, 48)}
${line}`;
    }

    /**
     * Get room type for styling
     */
    getRoomType(roomId, roomName) {
        if (typeof window.detectRoomType === 'function') {
            return window.detectRoomType(roomId, roomName);
        }
        return 'default';
    }

    // ============================================
    // NPC Art Methods
    // ============================================

    /**
     * Get NPC portrait
     */
    getNPCPortrait(npcId) {
        if (typeof window.getNPCPortrait === 'function') {
            return window.getNPCPortrait(npcId);
        }
        return this.createSimpleNPCPortrait(npcId);
    }

    /**
     * Get formatted NPC portrait with frame
     */
    getFormattedNPCPortrait(npc) {
        if (typeof window.formatNPCPortrait === 'function') {
            return window.formatNPCPortrait(npc);
        }
        return this.createSimpleNPCPortrait(npc.name || npc.id || 'Unknown');
    }

    /**
     * Create simple fallback NPC portrait
     */
    createSimpleNPCPortrait(name) {
        return `
┌──────────────┐
│    (• •)     │
│     \\│/      │
│ ${(name || 'NPC').padEnd(12)} │
└──────────────┘`;
    }

    /**
     * Get compact NPC portrait (3 lines)
     */
    getCompactNPCPortrait(npcId) {
        if (typeof window.getCompactPortrait === 'function') {
            return window.getCompactPortrait(npcId);
        }
        return `  (• •)
   \\│/`;
    }

    // ============================================
    // Item Art Methods
    // ============================================

    /**
     * Get item icon
     */
    getItemIcon(itemType, itemName) {
        if (typeof window.getItemIcon === 'function') {
            return window.getItemIcon(itemType, itemName);
        }
        return '📦';
    }

    /**
     * Get item ASCII art
     */
    getItemAscii(itemType) {
        if (typeof window.getItemAscii === 'function') {
            return window.getItemAscii(itemType);
        }
        return `
  ___
 |   |
 |___|`;
    }

    /**
     * Format item name with rarity decoration
     */
    formatItemName(itemName, rarity = 'common') {
        if (typeof window.formatItemName === 'function') {
            return window.formatItemName(itemName, rarity);
        }
        return itemName;
    }

    /**
     * Format item as box display
     */
    formatItemBox(item) {
        if (typeof window.formatItemBox === 'function') {
            return window.formatItemBox(item);
        }
        const icon = this.getItemIcon(item.type, item.name);
        return `
┌─────────────────────┐
│ ${icon} ${(item.name || 'Unknown').padEnd(17)}│
│ ${(item.description || '').substring(0, 19).padEnd(19)}│
└─────────────────────┘`;
    }

    /**
     * Format inventory line
     */
    formatInventoryLine(item, quantity = 1) {
        if (typeof window.formatInventoryLine === 'function') {
            return window.formatInventoryLine(item, quantity);
        }
        const icon = this.getItemIcon(item.type, item.name);
        const qtyStr = quantity > 1 ? ` x${quantity}` : '';
        return `${icon} ${item.name}${qtyStr}`;
    }

    // ============================================
    // Monster Art Methods
    // ============================================

    /**
     * Get monster ASCII art by type
     */
    getMonsterArt(monsterType) {
        const monsters = {
            wolf: `
    /\\___/\\
   (  o o  )
   (  =^=  )
    (---)`,
            spider: `
   /\\ /\\
  /  V  \\
 / ° ° \\
 \\(===)/`,
            skeleton: `
    ___
   /o o\\
   | - |
  /|   |\\
   |   |`,
            goblin: `
   /\\
  (oo)
  /|\\
  /|\\`,
            rat: `
  ,_,
 (o.o)
 c(")(")`,
            troll: `
   ___
  (O O)
  /| |\\
 / | | \\`,
            dragon: `
    /\\_/\\
   ( o.o )
   />  \\<
  /|    |\\`,
            default: `
   ???
  (o o)
   | |
  /   \\`
        };

        return monsters[monsterType?.toLowerCase()] || monsters.default;
    }

    // ============================================
    // Combat Display Methods
    // ============================================

    /**
     * Create combat encounter header
     */
    createCombatHeader(monsterName, monsterLevel) {
        return `
╔═══════════════════════════════════════╗
║  ⚔️  COMBAT ENCOUNTER  ⚔️             ║
║  ${(monsterName + ' (Lv.' + monsterLevel + ')').padEnd(35)}║
╚═══════════════════════════════════════╝`;
    }

    /**
     * Create health bar ASCII
     */
    createHealthBar(current, max, width = 20, label = 'HP') {
        const percentage = Math.max(0, Math.min(100, (current / max) * 100));
        const filledWidth = Math.round((percentage / 100) * width);
        const filled = '█'.repeat(filledWidth);
        const empty = '░'.repeat(width - filledWidth);

        return `${label}: [${filled}${empty}] ${current}/${max}`;
    }

    /**
     * Create combat action display
     */
    createCombatAction(attacker, action, target, damage) {
        const icon = action === 'attack' ? '⚔️' : action === 'spell' ? '✨' : '🛡️';
        return `${icon} ${attacker} ${action}s ${target} for ${damage} damage!`;
    }

    // ============================================
    // UI Element Methods
    // ============================================

    /**
     * Create a text box with border
     */
    createTextBox(title, content, width = 40) {
        const line = '─'.repeat(width - 2);
        const titlePadded = title.padStart((width + title.length) / 2).padEnd(width - 2);
        const lines = content.split('\n').map(l =>
            '│ ' + l.substring(0, width - 4).padEnd(width - 4) + ' │'
        );

        return `
┌${line}┐
│${titlePadded}│
├${line}┤
${lines.join('\n')}
└${line}┘`;
    }

    /**
     * Create separator line
     */
    createSeparator(width = 50, char = '─') {
        return char.repeat(width);
    }

    /**
     * Create direction indicator
     */
    createDirectionIndicator(exits) {
        const directions = {
            north: '↑N', south: '↓S', east: 'E→', west: '←W',
            up: '⬆', down: '⬇'
        };

        let indicator = '    ';
        if (exits.north) indicator = '  ' + directions.north + ' ';

        indicator += '\n';
        if (exits.west) indicator += directions.west;
        else indicator += '   ';
        indicator += ' ◆ ';
        if (exits.east) indicator += directions.east;
        else indicator += '   ';

        indicator += '\n    ';
        if (exits.south) indicator += directions.south + ' ';

        return indicator;
    }

    // ============================================
    // Message Formatting
    // ============================================

    /**
     * Format message with appropriate styling class
     */
    formatMessage(text, type = 'game') {
        const div = document.createElement('div');
        div.className = `message ${type}`;
        div.textContent = text;
        return div;
    }

    /**
     * Format ASCII art message (preserves whitespace)
     */
    formatAsciiMessage(asciiArt, cssClass = 'ascii-art') {
        const div = document.createElement('div');
        div.className = `message ${cssClass}`;
        div.style.whiteSpace = 'pre';
        div.style.fontFamily = 'monospace';
        div.textContent = asciiArt;
        return div;
    }

    /**
     * Display room with ASCII header
     */
    displayRoom(outputElement, roomData) {
        // Get room header
        const header = this.getRoomHeader(
            roomData.id,
            roomData.name,
            roomData.description || ''
        );

        // Create and append header element
        const headerEl = this.formatAsciiMessage(header, 'ascii-room');
        outputElement.appendChild(headerEl);

        // Add description
        if (roomData.description) {
            const descEl = this.formatMessage(roomData.description, 'room-description');
            outputElement.appendChild(descEl);
        }

        // Add exits
        if (roomData.exits && Object.keys(roomData.exits).length > 0) {
            const exitsList = Object.keys(roomData.exits).join(', ');
            const exitsEl = this.formatMessage(`Exits: ${exitsList}`, 'system');
            outputElement.appendChild(exitsEl);
        }

        // Scroll to bottom
        outputElement.scrollTop = outputElement.scrollHeight;
    }

    /**
     * Display NPC with portrait
     */
    displayNPC(outputElement, npc) {
        const portrait = this.getFormattedNPCPortrait(npc);
        const el = this.formatAsciiMessage(portrait, 'ascii-npc');
        outputElement.appendChild(el);
        outputElement.scrollTop = outputElement.scrollHeight;
    }

    /**
     * Display monster encounter
     */
    displayMonsterEncounter(outputElement, monster) {
        const header = this.createCombatHeader(monster.name, monster.level || 1);
        const art = this.getMonsterArt(monster.type || monster.name);

        const headerEl = this.formatAsciiMessage(header, 'ascii-header');
        outputElement.appendChild(headerEl);

        const artEl = this.formatAsciiMessage(art, 'ascii-monster');
        outputElement.appendChild(artEl);

        outputElement.scrollTop = outputElement.scrollHeight;
    }
}

// Create singleton instance
const asciiRenderer = new ASCIIArtRenderer();

// Export for use in browser
if (typeof window !== 'undefined') {
    window.ASCIIArtRenderer = ASCIIArtRenderer;
    window.asciiRenderer = asciiRenderer;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ASCIIArtRenderer, asciiRenderer };
}
