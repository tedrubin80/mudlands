/**
 * MUDlands Room Renderer
 * Dynamic room visualization for Phaser.js graphical client
 */

class RoomRenderer {
    constructor(scene) {
        this.scene = scene;
        this.currentRoomId = null;
        this.roomContainer = null;
        this.furnitureObjects = [];
    }

    // ============================================
    // Area Color Mapping
    // ============================================
    static AREA_COLORS = {
        // Town/Urban - Warm browns
        town: { base: 0x3a2a1a, accent: 0x5a4a3a, glow: 0xffaa66 },
        guild: { base: 0x2a2a4e, accent: 0x4a4a6e, glow: 0x6688ff },
        market: { base: 0x4a3a2a, accent: 0x6a5a4a, glow: 0xffcc88 },
        inn: { base: 0x3a2a1a, accent: 0x5a3a2a, glow: 0xff8844 },

        // Nature - Greens
        forest: { base: 0x1a3a1a, accent: 0x2a4a2a, glow: 0x44ff66 },
        grove: { base: 0x2a4a2a, accent: 0x3a5a3a, glow: 0x66ff88 },
        meadow: { base: 0x3a4a2a, accent: 0x4a5a3a, glow: 0x88ff66 },
        farm: { base: 0x4a4a2a, accent: 0x5a5a3a, glow: 0xaaff44 },

        // Underground - Dark blues/purples
        dungeon: { base: 0x1a1a2e, accent: 0x2a2a3e, glow: 0x4466ff },
        cave: { base: 0x2a2a2a, accent: 0x3a3a3a, glow: 0x666688 },
        sewer: { base: 0x1a2a1a, accent: 0x2a3a2a, glow: 0x448844 },
        crypt: { base: 0x1a1a1a, accent: 0x2a2a2a, glow: 0x884488 },

        // Mountain - Grays
        mountain: { base: 0x3a3a4a, accent: 0x4a4a5a, glow: 0x8888aa },
        cliff: { base: 0x4a4a4a, accent: 0x5a5a5a, glow: 0xaaaaaa },
        rocky: { base: 0x3a3a3a, accent: 0x4a4a4a, glow: 0x888888 },

        // Water - Blues
        water: { base: 0x0a2a3a, accent: 0x1a3a4a, glow: 0x44aaff },
        dock: { base: 0x2a3a3a, accent: 0x3a4a4a, glow: 0x66bbff },
        beach: { base: 0x4a4a3a, accent: 0x5a5a4a, glow: 0xffdd88 },

        // Magical - Purples
        magical: { base: 0x2a1a3a, accent: 0x3a2a4a, glow: 0xaa66ff },
        temple: { base: 0x3a2a3a, accent: 0x4a3a4a, glow: 0xffaaff },
        shrine: { base: 0x2a2a3a, accent: 0x3a3a4a, glow: 0x8888ff },
        spirit: { base: 0x1a2a3a, accent: 0x2a3a4a, glow: 0x66aaff },

        // Elemental
        fire: { base: 0x3a1a0a, accent: 0x4a2a1a, glow: 0xff4400 },
        lava: { base: 0x4a1a0a, accent: 0x5a2a1a, glow: 0xff6600 },
        volcanic: { base: 0x3a0a0a, accent: 0x4a1a1a, glow: 0xff2200 },

        ice: { base: 0x1a2a3a, accent: 0x2a3a4a, glow: 0x88ddff },
        frozen: { base: 0x0a1a2a, accent: 0x1a2a3a, glow: 0x66ccff },
        glacier: { base: 0x1a3a4a, accent: 0x2a4a5a, glow: 0xaaeeff },

        crystal: { base: 0x2a2a4a, accent: 0x3a3a5a, glow: 0xaa88ff },

        // Default
        default: { base: 0x2a2a3e, accent: 0x3a3a4e, glow: 0x6688aa }
    };

    // ============================================
    // Furniture Definitions
    // ============================================
    static FURNITURE = {
        // Town furniture
        fountain: {
            draw: (graphics, x, y) => {
                graphics.fillStyle(0x4a6a8a, 1);
                graphics.fillCircle(x, y, 45);
                graphics.fillStyle(0x2a4a6a, 1);
                graphics.fillCircle(x, y, 35);
                graphics.fillStyle(0x6a8aaa, 0.5);
                graphics.fillCircle(x, y - 5, 20);
            },
            glow: { color: 0x4488ff, radius: 60 }
        },
        bench: {
            draw: (graphics, x, y) => {
                graphics.fillStyle(0x5a4a3a, 1);
                graphics.fillRect(x - 35, y - 8, 70, 16);
                graphics.fillStyle(0x3a2a1a, 1);
                graphics.fillRect(x - 30, y + 8, 10, 15);
                graphics.fillRect(x + 20, y + 8, 10, 15);
            }
        },
        desk: {
            draw: (graphics, x, y) => {
                graphics.fillStyle(0x4a3a2a, 1);
                graphics.fillRect(x - 60, y - 30, 120, 60);
                graphics.fillStyle(0x2a1a0a, 0.5);
                graphics.fillRect(x - 55, y - 25, 110, 50);
            }
        },
        fireplace: {
            draw: (graphics, x, y) => {
                graphics.fillStyle(0x3a2a2a, 1);
                graphics.fillRect(x - 45, y - 65, 90, 85);
                graphics.fillStyle(0x1a1a1a, 1);
                graphics.fillRect(x - 35, y - 30, 70, 50);
            },
            glow: { color: 0xff6600, radius: 80, intensity: 0.6 }
        },
        board: {
            draw: (graphics, x, y) => {
                graphics.fillStyle(0x4a3a2a, 1);
                graphics.fillRect(x - 55, y - 75, 110, 110);
                graphics.fillStyle(0xccaa66, 0.4);
                graphics.fillRect(x - 50, y - 70, 100, 100);
            }
        },
        table: {
            draw: (graphics, x, y) => {
                graphics.fillStyle(0x5a4a3a, 1);
                graphics.fillRect(x - 40, y - 25, 80, 50);
                graphics.fillStyle(0x3a2a1a, 1);
                graphics.fillRect(x - 35, y + 25, 10, 20);
                graphics.fillRect(x + 25, y + 25, 10, 20);
            }
        },
        chair: {
            draw: (graphics, x, y) => {
                graphics.fillStyle(0x4a3a2a, 1);
                graphics.fillRect(x - 12, y - 20, 24, 30);
                graphics.fillRect(x - 10, y - 45, 20, 25);
            }
        },
        barrel: {
            draw: (graphics, x, y) => {
                graphics.fillStyle(0x5a4a3a, 1);
                graphics.fillEllipse(x, y, 20, 12);
                graphics.fillRect(x - 20, y - 25, 40, 25);
                graphics.fillEllipse(x, y - 25, 20, 12);
            }
        },
        crate: {
            draw: (graphics, x, y) => {
                graphics.fillStyle(0x5a4a2a, 1);
                graphics.fillRect(x - 18, y - 18, 36, 36);
                graphics.lineStyle(2, 0x3a2a1a);
                graphics.strokeRect(x - 18, y - 18, 36, 36);
            }
        },
        chest: {
            draw: (graphics, x, y) => {
                graphics.fillStyle(0x6a5a3a, 1);
                graphics.fillRect(x - 20, y - 15, 40, 25);
                graphics.fillStyle(0x8a7a5a, 1);
                graphics.fillRect(x - 20, y - 20, 40, 10);
                graphics.fillStyle(0xccaa44, 1);
                graphics.fillRect(x - 5, y - 10, 10, 8);
            },
            glow: { color: 0xffcc00, radius: 30 }
        },
        anvil: {
            draw: (graphics, x, y) => {
                graphics.fillStyle(0x4a4a4a, 1);
                graphics.fillRect(x - 25, y - 10, 50, 20);
                graphics.fillRect(x - 15, y - 25, 30, 15);
                graphics.fillStyle(0x3a3a3a, 1);
                graphics.fillRect(x - 20, y + 10, 40, 15);
            }
        },
        forge: {
            draw: (graphics, x, y) => {
                graphics.fillStyle(0x3a2a2a, 1);
                graphics.fillRect(x - 40, y - 40, 80, 60);
                graphics.fillStyle(0x1a0a0a, 1);
                graphics.fillRect(x - 30, y - 20, 60, 30);
            },
            glow: { color: 0xff4400, radius: 100, intensity: 0.7 }
        },
        altar: {
            draw: (graphics, x, y) => {
                graphics.fillStyle(0x6a6a7a, 1);
                graphics.fillRect(x - 35, y - 20, 70, 40);
                graphics.fillStyle(0x8a8a9a, 1);
                graphics.fillRect(x - 30, y - 30, 60, 15);
            },
            glow: { color: 0xaa88ff, radius: 50 }
        },
        tree: {
            draw: (graphics, x, y) => {
                graphics.fillStyle(0x3a2a1a, 1);
                graphics.fillRect(x - 10, y, 20, 50);
                graphics.fillStyle(0x2a4a2a, 1);
                graphics.fillCircle(x, y - 20, 40);
                graphics.fillCircle(x - 25, y, 30);
                graphics.fillCircle(x + 25, y, 30);
            }
        },
        rock: {
            draw: (graphics, x, y) => {
                graphics.fillStyle(0x5a5a5a, 1);
                graphics.fillCircle(x, y, 25);
                graphics.fillStyle(0x4a4a4a, 1);
                graphics.fillCircle(x - 5, y - 5, 20);
            }
        },
        campfire: {
            draw: (graphics, x, y) => {
                graphics.fillStyle(0x3a2a1a, 1);
                graphics.fillCircle(x - 15, y + 5, 8);
                graphics.fillCircle(x + 15, y + 5, 8);
                graphics.fillCircle(x, y + 10, 8);
            },
            glow: { color: 0xff6600, radius: 70, intensity: 0.5 }
        },
        torch: {
            draw: (graphics, x, y) => {
                graphics.fillStyle(0x4a3a2a, 1);
                graphics.fillRect(x - 3, y - 20, 6, 40);
            },
            glow: { color: 0xff8800, radius: 40, intensity: 0.4 }
        },
        pillar: {
            draw: (graphics, x, y) => {
                graphics.fillStyle(0x6a6a7a, 1);
                graphics.fillRect(x - 15, y - 80, 30, 160);
                graphics.fillStyle(0x7a7a8a, 1);
                graphics.fillRect(x - 20, y - 85, 40, 15);
                graphics.fillRect(x - 20, y + 70, 40, 15);
            }
        },
        statue: {
            draw: (graphics, x, y) => {
                graphics.fillStyle(0x6a6a7a, 1);
                graphics.fillRect(x - 20, y + 20, 40, 30);
                graphics.fillCircle(x, y - 30, 15);
                graphics.fillEllipse(x, y, 18, 40);
            }
        },
        well: {
            draw: (graphics, x, y) => {
                graphics.fillStyle(0x5a5a5a, 1);
                graphics.fillCircle(x, y, 30);
                graphics.fillStyle(0x2a2a3a, 1);
                graphics.fillCircle(x, y, 22);
            }
        }
    };

    // ============================================
    // Room Type Keywords for Detection
    // ============================================
    static ROOM_TYPE_KEYWORDS = {
        forest: ['forest', 'grove', 'woods', 'clearing', 'tree', 'woodland'],
        dungeon: ['cave', 'dungeon', 'tunnel', 'crypt', 'tomb', 'underground'],
        mountain: ['mountain', 'peak', 'cliff', 'highland', 'ridge', 'rocky'],
        water: ['river', 'lake', 'ocean', 'sea', 'beach', 'dock', 'pier', 'harbor'],
        magical: ['magic', 'mystic', 'enchant', 'spirit', 'shrine'],
        temple: ['temple', 'cathedral', 'monastery', 'church'],
        fire: ['volcano', 'lava', 'fire', 'flame', 'inferno', 'burning', 'volcanic'],
        ice: ['ice', 'frozen', 'frost', 'snow', 'glacier', 'cold', 'winter'],
        crystal: ['crystal', 'gem', 'jewel'],
        cave: ['cave', 'cavern', 'grotto'],
        sewer: ['sewer', 'drain', 'tunnel'],
        guild: ['guild', 'hall'],
        market: ['market', 'shop', 'store', 'merchant'],
        inn: ['inn', 'tavern', 'bar'],
        town: ['town', 'city', 'village', 'square', 'street'],
        farm: ['farm', 'field', 'orchard', 'mill'],
        dock: ['dock', 'pier', 'harbor', 'port', 'wharf']
    };

    /**
     * Detect room type from room ID and name
     */
    detectRoomType(roomId, roomName) {
        const searchText = ((roomId || '') + ' ' + (roomName || '')).toLowerCase();

        for (const [type, keywords] of Object.entries(RoomRenderer.ROOM_TYPE_KEYWORDS)) {
            for (const keyword of keywords) {
                if (searchText.includes(keyword)) {
                    return type;
                }
            }
        }
        return 'default';
    }

    /**
     * Get colors for a room
     */
    getRoomColors(roomId, roomName, properties = {}) {
        const roomType = this.detectRoomType(roomId, roomName);
        return RoomRenderer.AREA_COLORS[roomType] || RoomRenderer.AREA_COLORS.default;
    }

    /**
     * Generate furniture layout for room
     */
    generateFurnitureLayout(roomId, roomName, properties = {}) {
        const furniture = [];
        const roomType = this.detectRoomType(roomId, roomName);

        // Common furniture by room type
        const layouts = {
            guild: [
                { type: 'desk', x: 600, y: 250 },
                { type: 'fireplace', x: 200, y: 150 },
                { type: 'board', x: 1000, y: 200 }
            ],
            town: [
                { type: 'fountain', x: 600, y: 300 },
                { type: 'bench', x: 350, y: 400 },
                { type: 'bench', x: 850, y: 400 }
            ],
            market: [
                { type: 'crate', x: 300, y: 300 },
                { type: 'barrel', x: 350, y: 350 },
                { type: 'crate', x: 900, y: 300 },
                { type: 'barrel', x: 850, y: 350 }
            ],
            inn: [
                { type: 'table', x: 400, y: 300 },
                { type: 'table', x: 700, y: 300 },
                { type: 'fireplace', x: 200, y: 200 },
                { type: 'barrel', x: 1000, y: 400 }
            ],
            forest: [
                { type: 'tree', x: 200, y: 200 },
                { type: 'tree', x: 1000, y: 200 },
                { type: 'rock', x: 400, y: 400 }
            ],
            dungeon: [
                { type: 'pillar', x: 300, y: 300 },
                { type: 'pillar', x: 900, y: 300 },
                { type: 'torch', x: 200, y: 200 },
                { type: 'torch', x: 1000, y: 200 }
            ],
            temple: [
                { type: 'altar', x: 600, y: 200 },
                { type: 'pillar', x: 300, y: 300 },
                { type: 'pillar', x: 900, y: 300 }
            ],
            fire: [
                { type: 'rock', x: 300, y: 350 },
                { type: 'rock', x: 800, y: 350 }
            ],
            ice: [
                { type: 'rock', x: 350, y: 300 },
                { type: 'rock', x: 750, y: 300 }
            ],
            cave: [
                { type: 'rock', x: 250, y: 350 },
                { type: 'rock', x: 850, y: 350 },
                { type: 'torch', x: 400, y: 200 }
            ],
            farm: [
                { type: 'well', x: 600, y: 300 },
                { type: 'barrel', x: 400, y: 400 },
                { type: 'crate', x: 800, y: 400 }
            ]
        };

        return layouts[roomType] || [];
    }

    /**
     * Render a complete room
     */
    render(roomData) {
        if (!this.scene || !roomData) return;

        const roomId = roomData.id || 'default';
        const roomName = roomData.name || 'Unknown';
        const properties = roomData.properties || {};

        // Get room colors
        const colors = this.getRoomColors(roomId, roomName, properties);

        // Create or clear room container
        if (!this.roomContainer) {
            this.roomContainer = this.scene.add.container(0, 0);
        }
        this.roomContainer.removeAll(true);

        // Draw room background
        const roomBg = this.scene.add.graphics();

        // Background gradient based on room type
        roomBg.fillStyle(colors.base, 1);
        roomBg.fillRoundedRect(100, 100, 1000, 400, 20);

        // Add ambient lighting overlay
        const ambient = this.scene.add.graphics();
        ambient.fillStyle(colors.glow, 0.1);
        ambient.fillRoundedRect(100, 100, 1000, 400, 20);
        ambient.setBlendMode(Phaser.BlendModes.ADD);

        // Shadow for depth
        const shadow = this.scene.add.graphics();
        shadow.fillStyle(0x000000, 0.3);
        shadow.fillRoundedRect(105, 105, 1000, 400, 20);
        shadow.setBlendMode(Phaser.BlendModes.MULTIPLY);

        this.roomContainer.add([shadow, roomBg, ambient]);

        // Draw furniture
        const furniture = this.generateFurnitureLayout(roomId, roomName, properties);
        furniture.forEach(item => {
            this.drawFurniture(item);
        });

        // Draw exits
        if (roomData.exits) {
            Object.keys(roomData.exits).forEach(direction => {
                this.drawExit(direction);
            });
        }

        this.currentRoomId = roomId;
        return this.roomContainer;
    }

    /**
     * Draw a furniture piece
     */
    drawFurniture(item) {
        const furnitureType = RoomRenderer.FURNITURE[item.type];
        if (!furnitureType) return;

        const graphics = this.scene.add.graphics();
        furnitureType.draw(graphics, item.x, item.y);
        this.roomContainer.add(graphics);

        // Add glow effect if defined
        if (furnitureType.glow) {
            const glow = this.scene.add.circle(
                item.x,
                item.y,
                furnitureType.glow.radius,
                furnitureType.glow.color,
                furnitureType.glow.intensity || 0.3
            );
            glow.setBlendMode(Phaser.BlendModes.ADD);
            this.roomContainer.add(glow);
        }
    }

    /**
     * Draw an exit indicator
     */
    drawExit(direction) {
        const exitPositions = {
            north: { x: 600, y: 110 },
            south: { x: 600, y: 490 },
            east: { x: 1090, y: 300 },
            west: { x: 110, y: 300 },
            up: { x: 1050, y: 150 },
            down: { x: 1050, y: 450 }
        };

        const pos = exitPositions[direction];
        if (!pos) return;

        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0x1a1a3e, 0.8);

        // Draw exit shape based on direction
        if (direction === 'north' || direction === 'south') {
            graphics.fillRect(pos.x - 35, pos.y - 10, 70, 20);
        } else if (direction === 'east' || direction === 'west') {
            graphics.fillRect(pos.x - 10, pos.y - 35, 20, 70);
        } else {
            graphics.fillCircle(pos.x, pos.y, 20);
        }

        // Arrow indicators
        const arrows = {
            north: '↑', south: '↓', east: '→', west: '←',
            up: '⬆', down: '⬇',
            northeast: '↗', northwest: '↖',
            southeast: '↘', southwest: '↙'
        };

        const arrow = this.scene.add.text(pos.x, pos.y, arrows[direction] || '○', {
            fontSize: '24px',
            fill: '#666',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.roomContainer.add([graphics, arrow]);
    }

    /**
     * Get room container for scene management
     */
    getContainer() {
        return this.roomContainer;
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.RoomRenderer = RoomRenderer;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoomRenderer;
}
