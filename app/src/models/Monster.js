const { v4: uuidv4 } = require('uuid');

class Monster {
    constructor(data = {}) {
        this.id = uuidv4();
        this.type = data.type || 'unknown';
        this.name = data.name || 'Unknown Monster';
        this.description = data.description || 'A mysterious creature.';
        this.level = data.level || 1;
        
        this.stats = data.stats || {
            str: 5,
            agi: 5,
            vit: 5,
            int: 5,
            dex: 5,
            luk: 5
        };
        
        this.maxHp = data.maxHp || this.calculateMaxHp();
        this.maxMp = data.maxMp || this.calculateMaxMp();
        this.currentHp = this.maxHp;
        this.currentMp = this.maxMp;
        
        this.experience = data.experience || 10;
        this.drops = data.drops || [];
        
        this.aggressive = data.aggressive || false;
        this.respawnTime = data.respawnTime || 60000;
        this.lastAttack = 0;
        this.attackSpeed = data.attackSpeed || 2000;
        
        this.state = 'idle';
        this.target = null;
    }

    calculateMaxHp() {
        return 50 + (this.level * 15) + (this.stats.vit * 8);
    }

    calculateMaxMp() {
        return 20 + (this.level * 5) + (this.stats.int * 3);
    }

    takeDamage(amount) {
        this.currentHp = Math.max(0, this.currentHp - amount);
        if (this.currentHp <= 0) {
            this.state = 'dead';
            this.dropLoot();
        } else {
            this.state = 'combat';
        }
    }

    heal(amount) {
        if (this.state !== 'dead') {
            this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
        }
    }

    regenerate() {
        if (this.state !== 'dead' && this.state !== 'combat') {
            const regenAmount = Math.ceil(this.maxHp * 0.05);
            this.heal(regenAmount);
            
            if (this.currentMp < this.maxMp) {
                this.currentMp = Math.min(this.maxMp, this.currentMp + Math.ceil(this.maxMp * 0.1));
            }
        }
    }

    dropLoot() {
        const loot = [];
        this.drops.forEach(drop => {
            if (Math.random() < drop.chance) {
                loot.push(drop.item);
            }
        });
        return loot;
    }

    canAttack() {
        const now = Date.now();
        if (now - this.lastAttack >= this.attackSpeed) {
            this.lastAttack = now;
            return true;
        }
        return false;
    }

    setTarget(target) {
        this.target = target;
        this.state = 'combat';
    }

    clearTarget() {
        this.target = null;
        this.state = 'idle';
    }

    getAttackDamage() {
        const baseDamage = this.stats.str * 1.5;
        const variance = Math.random() * 0.3 + 0.85;
        return Math.floor(baseDamage * variance);
    }

    isAlive() {
        return this.currentHp > 0;
    }

    reset() {
        this.currentHp = this.maxHp;
        this.currentMp = this.maxMp;
        this.state = 'idle';
        this.target = null;
        this.lastAttack = 0;
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            description: this.description,
            level: this.level,
            currentHp: this.currentHp,
            maxHp: this.maxHp,
            currentMp: this.currentMp,
            maxMp: this.maxMp,
            stats: this.stats,
            state: this.state
        };
    }
}

module.exports = Monster;