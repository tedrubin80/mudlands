/**
 * MUDlands Mini-Map System
 * Tracks discovered rooms and renders navigation map
 */

class MiniMap {
    constructor() {
        this.discoveredRooms = new Map();
        this.currentRoomId = null;
        this.roomPositions = new Map();
        this.gridSize = 15; // Grid spacing for room positions
    }

    // ============================================
    // Room Discovery
    // ============================================

    /**
     * Discover a room and its connections
     */
    discoverRoom(roomId, roomData) {
        if (!roomId) return;

        const existing = this.discoveredRooms.get(roomId);

        this.discoveredRooms.set(roomId, {
            id: roomId,
            name: roomData.name || roomId,
            exits: roomData.exits || {},
            properties: roomData.properties || {},
            visitCount: (existing?.visitCount || 0) + 1,
            lastVisited: Date.now()
        });

        // Calculate position if not already set
        if (!this.roomPositions.has(roomId)) {
            this.calculateRoomPosition(roomId, roomData.exits || {});
        }
    }

    /**
     * Set current room
     */
    setCurrentRoom(roomId) {
        this.currentRoomId = roomId;
    }

    /**
     * Calculate grid position for room
     */
    calculateRoomPosition(roomId, exits) {
        // If first room, place at center
        if (this.roomPositions.size === 0) {
            this.roomPositions.set(roomId, { x: 0, y: 0 });
            return;
        }

        // Try to find position based on connected rooms
        const directionOffsets = {
            north: { x: 0, y: -1 },
            south: { x: 0, y: 1 },
            east: { x: 1, y: 0 },
            west: { x: -1, y: 0 },
            northeast: { x: 1, y: -1 },
            northwest: { x: -1, y: -1 },
            southeast: { x: 1, y: 1 },
            southwest: { x: -1, y: 1 },
            up: { x: 0, y: 0 },
            down: { x: 0, y: 0 }
        };

        // Check if any connected room has a position
        for (const [direction, targetRoom] of Object.entries(exits)) {
            const targetId = typeof targetRoom === 'string' ? targetRoom : targetRoom?.room;
            if (targetId && this.roomPositions.has(targetId)) {
                const targetPos = this.roomPositions.get(targetId);
                const offset = directionOffsets[direction] || { x: 0, y: 0 };

                // Our position is opposite of the exit direction
                this.roomPositions.set(roomId, {
                    x: targetPos.x - offset.x,
                    y: targetPos.y - offset.y
                });
                return;
            }
        }

        // Fallback: find empty position near existing rooms
        let x = 0, y = 0;
        let found = false;

        for (let radius = 1; radius <= 10 && !found; radius++) {
            for (let dx = -radius; dx <= radius && !found; dx++) {
                for (let dy = -radius; dy <= radius && !found; dy++) {
                    const testX = dx;
                    const testY = dy;
                    let occupied = false;

                    for (const pos of this.roomPositions.values()) {
                        if (pos.x === testX && pos.y === testY) {
                            occupied = true;
                            break;
                        }
                    }

                    if (!occupied) {
                        x = testX;
                        y = testY;
                        found = true;
                    }
                }
            }
        }

        this.roomPositions.set(roomId, { x, y });
    }

    // ============================================
    // ASCII Mini-Map Rendering
    // ============================================

    /**
     * Render ASCII mini-map for text client
     */
    renderAscii(width = 15, height = 9) {
        if (this.discoveredRooms.size === 0) {
            return this.renderEmptyMap(width, height);
        }

        // Find current room position
        const currentPos = this.roomPositions.get(this.currentRoomId) || { x: 0, y: 0 };

        // Calculate viewport
        const halfWidth = Math.floor(width / 2);
        const halfHeight = Math.floor(height / 2);

        // Create grid
        const grid = [];
        for (let y = 0; y < height; y++) {
            grid[y] = [];
            for (let x = 0; x < width; x++) {
                grid[y][x] = ' ';
            }
        }

        // Place rooms on grid
        for (const [roomId, room] of this.discoveredRooms) {
            const pos = this.roomPositions.get(roomId);
            if (!pos) continue;

            // Convert to grid coordinates (centered on current room)
            const gridX = (pos.x - currentPos.x) + halfWidth;
            const gridY = (pos.y - currentPos.y) + halfHeight;

            // Check bounds
            if (gridX < 0 || gridX >= width || gridY < 0 || gridY >= height) continue;

            // Draw room
            if (roomId === this.currentRoomId) {
                grid[gridY][gridX] = '@'; // Current room
            } else {
                grid[gridY][gridX] = this.getRoomSymbol(room);
            }

            // Draw connections
            for (const direction of Object.keys(room.exits)) {
                this.drawConnection(grid, gridX, gridY, direction, width, height);
            }
        }

        // Build output string with border
        const horizontalBorder = '─'.repeat(width);
        let output = `┌${horizontalBorder}┐\n`;

        for (const row of grid) {
            output += '│' + row.join('') + '│\n';
        }

        output += `└${horizontalBorder}┘`;
        output += '\n@ = You';

        return output;
    }

    /**
     * Render empty map placeholder
     */
    renderEmptyMap(width, height) {
        const horizontalBorder = '─'.repeat(width);
        let output = `┌${horizontalBorder}┐\n`;

        for (let y = 0; y < height; y++) {
            if (y === Math.floor(height / 2)) {
                const msg = 'Explore!';
                const padding = Math.floor((width - msg.length) / 2);
                output += '│' + ' '.repeat(padding) + msg + ' '.repeat(width - padding - msg.length) + '│\n';
            } else {
                output += '│' + ' '.repeat(width) + '│\n';
            }
        }

        output += `└${horizontalBorder}┘`;
        return output;
    }

    /**
     * Get room symbol based on type
     */
    getRoomSymbol(room) {
        const name = (room.name || '').toLowerCase();

        if (name.includes('guild')) return 'G';
        if (name.includes('market') || name.includes('shop')) return 'M';
        if (name.includes('inn') || name.includes('tavern')) return 'I';
        if (name.includes('temple') || name.includes('shrine')) return 'T';
        if (name.includes('forest') || name.includes('grove')) return 'F';
        if (name.includes('cave') || name.includes('dungeon')) return 'D';
        if (name.includes('gate') || name.includes('entrance')) return 'E';
        if (room.properties?.safe) return '○';
        if (room.properties?.dangerous) return '!';

        return '·';
    }

    /**
     * Draw connection line between rooms
     */
    drawConnection(grid, x, y, direction, width, height) {
        const connectors = {
            north: { dx: 0, dy: -1, char: '│' },
            south: { dx: 0, dy: 1, char: '│' },
            east: { dx: 1, dy: 0, char: '─' },
            west: { dx: -1, dy: 0, char: '─' },
            northeast: { dx: 1, dy: -1, char: '/' },
            northwest: { dx: -1, dy: -1, char: '\\' },
            southeast: { dx: 1, dy: 1, char: '\\' },
            southwest: { dx: -1, dy: 1, char: '/' }
        };

        const conn = connectors[direction];
        if (!conn) return;

        const cx = x + conn.dx;
        const cy = y + conn.dy;

        if (cx >= 0 && cx < width && cy >= 0 && cy < height) {
            if (grid[cy][cx] === ' ') {
                grid[cy][cx] = conn.char;
            }
        }
    }

    // ============================================
    // Data Export
    // ============================================

    /**
     * Get all discovered room data
     */
    getDiscoveredRooms() {
        return Array.from(this.discoveredRooms.values());
    }

    /**
     * Get room count
     */
    getRoomCount() {
        return this.discoveredRooms.size;
    }

    /**
     * Check if room is discovered
     */
    isDiscovered(roomId) {
        return this.discoveredRooms.has(roomId);
    }

    /**
     * Save map data to localStorage
     */
    save() {
        const data = {
            rooms: Array.from(this.discoveredRooms.entries()),
            positions: Array.from(this.roomPositions.entries()),
            currentRoom: this.currentRoomId
        };
        localStorage.setItem('mudlands_minimap', JSON.stringify(data));
    }

    /**
     * Load map data from localStorage
     */
    load() {
        try {
            const data = JSON.parse(localStorage.getItem('mudlands_minimap'));
            if (data) {
                this.discoveredRooms = new Map(data.rooms || []);
                this.roomPositions = new Map(data.positions || []);
                this.currentRoomId = data.currentRoom || null;
            }
        } catch (e) {
            console.error('Failed to load minimap data:', e);
        }
    }

    /**
     * Clear all map data
     */
    clear() {
        this.discoveredRooms.clear();
        this.roomPositions.clear();
        this.currentRoomId = null;
        localStorage.removeItem('mudlands_minimap');
    }
}

// ============================================
// Text Client Mini-Map Integration
// ============================================

class TextClientMiniMap extends MiniMap {
    constructor(containerElement) {
        super();
        this.container = containerElement;
        this.load(); // Load saved data
    }

    /**
     * Update and render the minimap
     */
    update(roomData) {
        if (roomData) {
            this.discoverRoom(roomData.id, roomData);
            this.setCurrentRoom(roomData.id);
            this.save();
        }
        this.render();
    }

    /**
     * Render to container element
     */
    render() {
        if (!this.container) return;

        const mapAscii = this.renderAscii(13, 7);
        this.container.innerHTML = `<pre class="minimap-display">${mapAscii}</pre>`;
    }
}

// Create instances
const miniMap = new MiniMap();

// Export for use in browser
if (typeof window !== 'undefined') {
    window.MiniMap = MiniMap;
    window.TextClientMiniMap = TextClientMiniMap;
    window.miniMap = miniMap;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MiniMap, TextClientMiniMap, miniMap };
}
