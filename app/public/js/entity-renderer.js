/**
 * MUDlands Entity Renderer
 * Procedural sprite generation for NPCs, monsters, and players
 */

class EntityRenderer {
    constructor(scene) {
        this.scene = scene;
        this.entityContainers = new Map();
    }

    // ============================================
    // Color Palettes
    // ============================================
    static COLORS = {
        // Player colors
        player: {
            body: 0x00ff88,
            glow: 0x00ff88,
            outline: 0x00aa55
        },

        // NPC colors by type
        npc: {
            guard: { body: 0x4466aa, accent: 0x888899, glow: 0x4466aa },
            merchant: { body: 0x886644, accent: 0xccaa66, glow: 0xffcc00 },
            innkeeper: { body: 0x885544, accent: 0xaa8866, glow: 0xff8844 },
            blacksmith: { body: 0x444444, accent: 0x666666, glow: 0xff6600 },
            wizard: { body: 0x4444aa, accent: 0x8888ff, glow: 0xaa88ff },
            priest: { body: 0xdddddd, accent: 0xffdd88, glow: 0xffffaa },
            bard: { body: 0x885588, accent: 0xaa66aa, glow: 0xff88ff },
            trainer: { body: 0x668844, accent: 0x88aa66, glow: 0xaaff66 },
            hermit: { body: 0x556644, accent: 0x778855, glow: 0x88aa66 },
            noble: { body: 0xaa6688, accent: 0xffaacc, glow: 0xffccdd },
            default: { body: 0x4a6a8a, accent: 0x6a8aaa, glow: 0x88aacc }
        },

        // Monster colors by type
        monster: {
            wolf: { body: 0x666666, accent: 0x888888, glow: 0x888888 },
            spider: { body: 0x333333, accent: 0x222222, glow: 0x444444 },
            goblin: { body: 0x446644, accent: 0x558855, glow: 0x66aa66 },
            skeleton: { body: 0xccccaa, accent: 0xddddbb, glow: 0xffffcc },
            rat: { body: 0x554433, accent: 0x665544, glow: 0x776655 },
            troll: { body: 0x446644, accent: 0x335533, glow: 0x448844 },
            bandit: { body: 0x444444, accent: 0x333333, glow: 0x666666 },
            ghost: { body: 0xaaaacc, accent: 0xccccee, glow: 0xeeeeff },
            elemental_fire: { body: 0xff4400, accent: 0xff8800, glow: 0xffaa00 },
            elemental_ice: { body: 0x44aaff, accent: 0x88ccff, glow: 0xaaeeff },
            elemental_earth: { body: 0x665544, accent: 0x886655, glow: 0xaa8866 },
            dragon: { body: 0x884422, accent: 0xaa6633, glow: 0xff8844 },
            default: { body: 0x884444, accent: 0xaa5555, glow: 0xcc6666 }
        }
    };

    // ============================================
    // Shape Templates
    // ============================================
    static SHAPES = {
        humanoid: {
            head: { type: 'circle', y: -40, radius: 15 },
            body: { type: 'ellipse', y: -10, width: 20, height: 40 }
        },
        humanoid_small: {
            head: { type: 'circle', y: -30, radius: 12 },
            body: { type: 'ellipse', y: -5, width: 16, height: 30 }
        },
        humanoid_large: {
            head: { type: 'circle', y: -55, radius: 20 },
            body: { type: 'ellipse', y: -15, width: 30, height: 55 }
        },
        quadruped: {
            head: { type: 'circle', y: -15, x: -25, radius: 12 },
            body: { type: 'ellipse', y: 0, width: 40, height: 20 }
        },
        arachnid: {
            head: { type: 'circle', y: -10, radius: 10 },
            body: { type: 'ellipse', y: 10, width: 25, height: 18 }
        },
        ghost: {
            head: { type: 'circle', y: -35, radius: 18 },
            body: { type: 'ellipse', y: 0, width: 22, height: 50 }
        },
        large_beast: {
            head: { type: 'circle', y: -50, radius: 25 },
            body: { type: 'ellipse', y: -10, width: 40, height: 60 }
        }
    };

    // ============================================
    // Entity Type Detection
    // ============================================

    /**
     * Detect NPC type from data
     */
    detectNPCType(npc) {
        const name = ((npc.name || '') + ' ' + (npc.title || '')).toLowerCase();

        if (name.includes('guard') || name.includes('soldier')) return 'guard';
        if (name.includes('merchant') || name.includes('trader') || name.includes('shopkeeper')) return 'merchant';
        if (name.includes('innkeeper') || name.includes('bartender')) return 'innkeeper';
        if (name.includes('blacksmith') || name.includes('smith')) return 'blacksmith';
        if (name.includes('wizard') || name.includes('mage') || name.includes('sorcerer')) return 'wizard';
        if (name.includes('priest') || name.includes('cleric') || name.includes('monk')) return 'priest';
        if (name.includes('bard') || name.includes('musician')) return 'bard';
        if (name.includes('trainer') || name.includes('master')) return 'trainer';
        if (name.includes('hermit') || name.includes('druid')) return 'hermit';
        if (name.includes('noble') || name.includes('lord') || name.includes('lady')) return 'noble';

        return 'default';
    }

    /**
     * Detect monster type from data
     */
    detectMonsterType(monster) {
        const name = (monster.name || monster.type || '').toLowerCase();

        if (name.includes('wolf') || name.includes('dog')) return 'wolf';
        if (name.includes('spider')) return 'spider';
        if (name.includes('goblin')) return 'goblin';
        if (name.includes('skeleton') || name.includes('undead')) return 'skeleton';
        if (name.includes('rat')) return 'rat';
        if (name.includes('troll') || name.includes('ogre')) return 'troll';
        if (name.includes('bandit') || name.includes('thief')) return 'bandit';
        if (name.includes('ghost') || name.includes('wraith') || name.includes('spirit')) return 'ghost';
        if (name.includes('fire') || name.includes('flame')) return 'elemental_fire';
        if (name.includes('ice') || name.includes('frost')) return 'elemental_ice';
        if (name.includes('earth') || name.includes('stone') || name.includes('rock')) return 'elemental_earth';
        if (name.includes('dragon')) return 'dragon';

        return 'default';
    }

    /**
     * Get shape template for entity
     */
    getShape(entityType, monsterType = null) {
        if (entityType === 'player' || entityType === 'npc') {
            return EntityRenderer.SHAPES.humanoid;
        }

        if (monsterType) {
            const shapeMap = {
                wolf: 'quadruped',
                spider: 'arachnid',
                goblin: 'humanoid_small',
                skeleton: 'humanoid',
                rat: 'quadruped',
                troll: 'humanoid_large',
                bandit: 'humanoid',
                ghost: 'ghost',
                dragon: 'large_beast',
                elemental_fire: 'humanoid',
                elemental_ice: 'humanoid',
                elemental_earth: 'humanoid_large'
            };
            return EntityRenderer.SHAPES[shapeMap[monsterType] || 'humanoid'];
        }

        return EntityRenderer.SHAPES.humanoid;
    }

    // ============================================
    // Entity Creation Methods
    // ============================================

    /**
     * Create player sprite
     */
    createPlayer(x, y, playerData = {}) {
        const container = this.scene.add.container(x, y);
        const colors = EntityRenderer.COLORS.player;
        const shape = this.getShape('player');

        // Shadow
        const shadow = this.scene.add.graphics();
        shadow.fillStyle(0x000000, 0.4);
        shadow.fillEllipse(0, 50, 30, 10);
        container.add(shadow);

        // Glow
        const glow = this.scene.add.circle(0, -20, 45, colors.glow, 0.3);
        glow.setBlendMode(Phaser.BlendModes.ADD);
        container.add(glow);

        // Body
        const body = this.scene.add.graphics();
        body.fillStyle(colors.body, 0.9);
        body.fillCircle(0, shape.head.y, shape.head.radius);
        body.fillEllipse(0, shape.body.y, shape.body.width, shape.body.height);
        container.add(body);

        // Outline
        const outline = this.scene.add.graphics();
        outline.lineStyle(2, colors.outline, 0.5);
        outline.strokeCircle(0, shape.head.y, shape.head.radius);
        outline.strokeEllipse(0, shape.body.y, shape.body.width, shape.body.height);
        container.add(outline);

        // Label
        const label = this.scene.add.text(0, 35, playerData.name || 'You', {
            fontSize: '12px',
            fill: '#00ff88',
            fontFamily: 'Courier New',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);
        container.add(label);

        this.entityContainers.set('player', container);
        return container;
    }

    /**
     * Create NPC sprite
     */
    createNPC(x, y, npcData) {
        const container = this.scene.add.container(x, y);
        const npcType = this.detectNPCType(npcData);
        const colors = EntityRenderer.COLORS.npc[npcType] || EntityRenderer.COLORS.npc.default;
        const shape = this.getShape('npc');

        // Shadow
        const shadow = this.scene.add.graphics();
        shadow.fillStyle(0x000000, 0.5);
        shadow.fillEllipse(0, 50, 28, 9);
        container.add(shadow);

        // Glow
        const glow = this.scene.add.circle(0, -20, 40, colors.glow, 0.2);
        glow.setBlendMode(Phaser.BlendModes.ADD);
        container.add(glow);

        // Body
        const body = this.scene.add.graphics();
        body.fillStyle(colors.body, 0.85);
        body.fillCircle(0, shape.head.y, shape.head.radius);
        body.fillEllipse(0, shape.body.y, shape.body.width, shape.body.height);
        container.add(body);

        // Accent (clothing/armor hint)
        const accent = this.scene.add.graphics();
        accent.fillStyle(colors.accent, 0.6);
        accent.fillEllipse(0, shape.body.y - 5, shape.body.width - 4, shape.body.height - 15);
        container.add(accent);

        // Name label
        const name = npcData.name || 'NPC';
        const label = this.scene.add.text(0, 35, name, {
            fontSize: '11px',
            fill: '#00ffff',
            fontFamily: 'Courier New',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5);
        container.add(label);

        // Title label (if present)
        if (npcData.title) {
            const titleLabel = this.scene.add.text(0, 48, npcData.title, {
                fontSize: '9px',
                fill: '#888888',
                fontFamily: 'Courier New',
                stroke: '#000',
                strokeThickness: 2
            }).setOrigin(0.5);
            container.add(titleLabel);
        }

        const id = npcData.id || `npc_${Date.now()}`;
        this.entityContainers.set(id, container);
        return container;
    }

    /**
     * Create monster sprite
     */
    createMonster(x, y, monsterData) {
        const container = this.scene.add.container(x, y);
        const monsterType = this.detectMonsterType(monsterData);
        const colors = EntityRenderer.COLORS.monster[monsterType] || EntityRenderer.COLORS.monster.default;
        const shape = this.getShape('monster', monsterType);

        // Scale based on level
        const level = monsterData.level || 1;
        const scale = 0.8 + (Math.min(level, 20) * 0.03);
        container.setScale(scale);

        // Shadow
        const shadow = this.scene.add.graphics();
        shadow.fillStyle(0x000000, 0.5);
        shadow.fillEllipse(0, 50, 30, 10);
        container.add(shadow);

        // Glow (red tint for danger)
        const glow = this.scene.add.circle(0, -15, 45, colors.glow, 0.25);
        glow.setBlendMode(Phaser.BlendModes.ADD);
        container.add(glow);

        // Body
        const body = this.scene.add.graphics();
        body.fillStyle(colors.body, 0.9);

        if (shape.head.x !== undefined) {
            // Quadruped style
            body.fillCircle(shape.head.x, shape.head.y, shape.head.radius);
        } else {
            body.fillCircle(0, shape.head.y, shape.head.radius);
        }
        body.fillEllipse(0, shape.body.y, shape.body.width, shape.body.height);
        container.add(body);

        // Eyes (red for monsters)
        const eyes = this.scene.add.graphics();
        eyes.fillStyle(0xff0000, 0.8);
        const eyeY = shape.head.y || -15;
        const eyeX = shape.head.x || 0;
        eyes.fillCircle(eyeX - 5, eyeY - 2, 3);
        eyes.fillCircle(eyeX + 5, eyeY - 2, 3);
        container.add(eyes);

        // Name label
        const name = monsterData.name || 'Monster';
        const label = this.scene.add.text(0, 40, name, {
            fontSize: '10px',
            fill: '#ff6666',
            fontFamily: 'Courier New',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5);
        container.add(label);

        // Level badge
        const levelBadge = this.scene.add.text(0, 52, `Lv.${level}`, {
            fontSize: '9px',
            fill: '#ffaa00',
            fontFamily: 'Courier New',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5);
        container.add(levelBadge);

        // Health bar
        this.addHealthBar(container, monsterData.hp, monsterData.maxHp || monsterData.hp);

        const id = monsterData.id || `monster_${Date.now()}`;
        this.entityContainers.set(id, container);
        return container;
    }

    /**
     * Create other player sprite
     */
    createOtherPlayer(x, y, playerData) {
        const container = this.scene.add.container(x, y);
        const shape = this.getShape('player');

        // Use blue tint for other players
        const colors = {
            body: 0x4488ff,
            glow: 0x4488ff,
            outline: 0x2266cc
        };

        // Shadow
        const shadow = this.scene.add.graphics();
        shadow.fillStyle(0x000000, 0.4);
        shadow.fillEllipse(0, 50, 28, 9);
        container.add(shadow);

        // Glow
        const glow = this.scene.add.circle(0, -20, 40, colors.glow, 0.25);
        glow.setBlendMode(Phaser.BlendModes.ADD);
        container.add(glow);

        // Body
        const body = this.scene.add.graphics();
        body.fillStyle(colors.body, 0.85);
        body.fillCircle(0, shape.head.y, shape.head.radius);
        body.fillEllipse(0, shape.body.y, shape.body.width, shape.body.height);
        container.add(body);

        // Name label
        const label = this.scene.add.text(0, 35, playerData.name || 'Player', {
            fontSize: '11px',
            fill: '#4488ff',
            fontFamily: 'Courier New',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5);
        container.add(label);

        const id = playerData.id || `player_${Date.now()}`;
        this.entityContainers.set(id, container);
        return container;
    }

    // ============================================
    // Health Bar
    // ============================================

    /**
     * Add health bar above entity
     */
    addHealthBar(container, current, max) {
        if (!current || !max) return;

        const barWidth = 40;
        const barHeight = 5;
        const barY = -65;

        // Background
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x333333, 0.8);
        bg.fillRect(-barWidth / 2, barY, barWidth, barHeight);
        container.add(bg);

        // Health fill
        const percentage = Math.max(0, Math.min(1, current / max));
        const fillWidth = barWidth * percentage;

        const fill = this.scene.add.graphics();
        const color = percentage > 0.5 ? 0x00ff00 : percentage > 0.25 ? 0xffff00 : 0xff0000;
        fill.fillStyle(color, 1);
        fill.fillRect(-barWidth / 2, barY, fillWidth, barHeight);
        container.add(fill);

        // Border
        const border = this.scene.add.graphics();
        border.lineStyle(1, 0x000000, 0.8);
        border.strokeRect(-barWidth / 2, barY, barWidth, barHeight);
        container.add(border);
    }

    /**
     * Update health bar
     */
    updateHealthBar(entityId, current, max) {
        const container = this.entityContainers.get(entityId);
        if (!container) return;

        // Find and update health bar graphics
        // This is a simplified version - in production would track bar references
        this.addHealthBar(container, current, max);
    }

    // ============================================
    // Utility Methods
    // ============================================

    /**
     * Remove entity by ID
     */
    removeEntity(entityId) {
        const container = this.entityContainers.get(entityId);
        if (container) {
            container.destroy();
            this.entityContainers.delete(entityId);
        }
    }

    /**
     * Clear all entities
     */
    clearAll() {
        for (const container of this.entityContainers.values()) {
            container.destroy();
        }
        this.entityContainers.clear();
    }

    /**
     * Get entity container by ID
     */
    getEntity(entityId) {
        return this.entityContainers.get(entityId);
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.EntityRenderer = EntityRenderer;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EntityRenderer;
}
