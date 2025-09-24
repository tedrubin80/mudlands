const { v4: uuidv4 } = require('uuid');

class Item {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.templateId = data.templateId || data.id; // Reference to item template
        this.name = data.name || 'Unknown Item';
        this.description = data.description || 'A mysterious item.';
        this.type = data.type || 'misc'; // weapon, armor, consumable, misc, key, quest
        this.rarity = data.rarity || 'common'; // common, uncommon, rare, epic, legendary
        
        // Stack and quantity properties
        this.stackable = data.stackable || false;
        this.quantity = data.quantity || 1;
        this.maxStack = data.maxStack || 99;
        
        // Economic properties
        this.value = data.value || 0; // Base gold value
        this.sellPrice = data.sellPrice || Math.floor(this.value * 0.5);
        this.buyPrice = data.buyPrice || Math.floor(this.value * 1.2);
        
        // Equipment properties
        this.slot = data.slot || null; // weapon, armor, helmet, boots, accessory
        this.stats = data.stats || {}; // Stat bonuses: { str: 5, agi: 2 }
        this.requirements = data.requirements || {}; // { level: 10, str: 15 }
        
        // Weapon/armor specific
        this.damage = data.damage || null; // { min: 10, max: 15 }
        this.defense = data.defense || 0;
        this.attackSpeed = data.attackSpeed || 1.0;
        this.criticalChance = data.criticalChance || 0;
        this.accuracy = data.accuracy || 0;
        
        // Consumable properties
        this.effects = data.effects || {}; // { heal: 50, restoreMana: 25 }
        this.duration = data.duration || 0; // For temporary effects
        this.cooldown = data.cooldown || 0; // Usage cooldown in seconds
        
        // Durability system
        this.durability = data.durability || null;
        this.maxDurability = data.maxDurability || data.durability || null;
        
        // Special properties
        this.unique = data.unique || false; // Can only have one
        this.questItem = data.questItem || false;
        this.tradeable = data.tradeable !== false; // Default true
        this.dropOnDeath = data.dropOnDeath !== false; // Default true
        
        // Metadata
        this.createdAt = data.createdAt || Date.now();
        this.enchantments = data.enchantments || [];
        this.customProperties = data.customProperties || {};
    }

    // Item condition based on durability
    getCondition() {
        if (!this.durability || !this.maxDurability) return 'perfect';
        
        const ratio = this.durability / this.maxDurability;
        if (ratio >= 0.9) return 'excellent';
        if (ratio >= 0.7) return 'good';
        if (ratio >= 0.5) return 'fair';
        if (ratio >= 0.3) return 'poor';
        if (ratio > 0) return 'broken';
        return 'destroyed';
    }

    // Get item color based on rarity
    getRarityColor() {
        const colors = {
            common: 'white',
            uncommon: 'green', 
            rare: 'blue',
            epic: 'purple',
            legendary: 'orange'
        };
        return colors[this.rarity] || 'white';
    }

    // Take durability damage
    takeDurabilityDamage(amount = 1) {
        if (!this.durability) return false;
        
        this.durability = Math.max(0, this.durability - amount);
        return this.durability > 0;
    }

    // Repair item
    repair(amount) {
        if (!this.durability || !this.maxDurability) return false;
        
        this.durability = Math.min(this.maxDurability, this.durability + amount);
        return true;
    }

    // Check if item can be used
    canUse(player) {
        // Check level requirements
        if (this.requirements.level && player.level < this.requirements.level) {
            return { canUse: false, reason: `Requires level ${this.requirements.level}` };
        }
        
        // Check stat requirements
        for (const [stat, required] of Object.entries(this.requirements)) {
            if (stat !== 'level' && player.stats[stat] < required) {
                return { canUse: false, reason: `Requires ${required} ${stat.toUpperCase()}` };
            }
        }
        
        // Check if broken
        if (this.durability === 0) {
            return { canUse: false, reason: 'Item is broken and needs repair' };
        }
        
        return { canUse: true };
    }

    // Get detailed description
    getDetailedDescription(player = null) {
        let desc = [];
        
        // Basic info
        desc.push(`Name: ${this.name}`);
        desc.push(`Type: ${this.type.charAt(0).toUpperCase() + this.type.slice(1)}`);
        desc.push(`Rarity: ${this.rarity.charAt(0).toUpperCase() + this.rarity.slice(1)}`);
        desc.push(`Description: ${this.description}`);
        
        // Equipment stats
        if (Object.keys(this.stats).length > 0) {
            const statStrings = Object.entries(this.stats)
                .map(([stat, value]) => `${stat.toUpperCase()}: +${value}`)
                .join(', ');
            desc.push(`Stats: ${statStrings}`);
        }
        
        // Weapon damage
        if (this.damage) {
            desc.push(`Damage: ${this.damage.min}-${this.damage.max}`);
        }
        
        // Armor defense
        if (this.defense > 0) {
            desc.push(`Defense: ${this.defense}`);
        }
        
        // Requirements
        if (Object.keys(this.requirements).length > 0) {
            const reqStrings = Object.entries(this.requirements)
                .map(([req, value]) => `${req.toUpperCase()}: ${value}`)
                .join(', ');
            desc.push(`Requirements: ${reqStrings}`);
        }
        
        // Durability
        if (this.durability !== null) {
            desc.push(`Durability: ${this.durability}/${this.maxDurability} (${this.getCondition()})`);
        }
        
        // Value
        if (this.value > 0) {
            desc.push(`Value: ${this.value} gold`);
        }
        
        // Consumable effects
        if (this.type === 'consumable' && Object.keys(this.effects).length > 0) {
            const effectStrings = Object.entries(this.effects)
                .map(([effect, value]) => {
                    switch(effect) {
                        case 'heal': return `Restores ${value} HP`;
                        case 'restoreMana': return `Restores ${value} MP`;
                        default: return `${effect}: ${value}`;
                    }
                })
                .join(', ');
            desc.push(`Effects: ${effectStrings}`);
        }
        
        // Special properties
        if (this.unique) desc.push('✨ Unique Item');
        if (this.questItem) desc.push('🎯 Quest Item');
        if (!this.tradeable) desc.push('⛔ Cannot be traded');
        
        return desc.join('\n');
    }

    // Create a copy for inventory/drops
    createCopy(quantity = 1) {
        return new Item({
            ...this,
            quantity: Math.min(quantity, this.maxStack)
        });
    }

    // Check if two items can stack
    canStackWith(otherItem) {
        return this.stackable && 
               this.templateId === otherItem.templateId &&
               this.durability === otherItem.durability;
    }

    // Combine with another item (stacking)
    combineWith(otherItem) {
        if (!this.canStackWith(otherItem)) return false;
        
        const totalQuantity = this.quantity + otherItem.quantity;
        const remainder = Math.max(0, totalQuantity - this.maxStack);
        
        this.quantity = Math.min(totalQuantity, this.maxStack);
        otherItem.quantity = remainder;
        
        return remainder === 0; // True if fully combined
    }

    toJSON() {
        return {
            id: this.id,
            templateId: this.templateId,
            name: this.name,
            description: this.description,
            type: this.type,
            rarity: this.rarity,
            quantity: this.quantity,
            value: this.value,
            slot: this.slot,
            stats: this.stats,
            requirements: this.requirements,
            damage: this.damage,
            defense: this.defense,
            effects: this.effects,
            durability: this.durability,
            maxDurability: this.maxDurability,
            unique: this.unique,
            questItem: this.questItem,
            tradeable: this.tradeable,
            enchantments: this.enchantments,
            customProperties: this.customProperties
        };
    }
}

module.exports = Item;