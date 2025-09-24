const { v4: uuidv4 } = require('uuid');
const GameLogger = require('../utils/logger');

class Player {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.name = data.name || 'Unknown';
        this.password = data.password || '';
        this.email = data.email || '';
        this.isAdmin = data.isAdmin || false;
        
        this.level = data.level || 1;
        this.experience = data.experience || 0;
        this.className = data.className || 'Novice';
        
        this.stats = data.stats || {
            str: 5,
            agi: 5,
            vit: 5,
            int: 5,
            dex: 5,
            luk: 5
        };
        
        this.statPoints = data.statPoints || 0;
        this.skillPoints = data.skillPoints || 0;
        this.gold = data.gold || 0;
        
        this.maxHp = data.maxHp || this.calculateMaxHp();
        this.maxMp = data.maxMp || this.calculateMaxMp();
        this.currentHp = data.currentHp || this.maxHp;
        this.currentMp = data.currentMp || this.maxMp;
        
        this.location = data.location || 'town_square';
        this.inventory = data.inventory || [];
        this.equipment = data.equipment || {
            weapon: null,
            armor: null,
            helmet: null,
            boots: null,
            accessory: null
        };
        
        this.skills = data.skills || [];
        this.quests = data.quests || [];
        
        // Quest system
        this.activeQuests = data.activeQuests || [];
        this.completedQuests = data.completedQuests || [];
        this.storyFlags = data.storyFlags || {};
        this.reputation = data.reputation || {};
        
        // Crafting system
        this.craftingSkills = data.craftingSkills || {
            blacksmithing: { level: 0, experience: 0 },
            leatherworking: { level: 0, experience: 0 },
            alchemy: { level: 0, experience: 0 },
            enchanting: { level: 0, experience: 0 },
            tailoring: { level: 0, experience: 0 }
        };
        this.isCrafting = data.isCrafting || false;
        this.craftingStartTime = data.craftingStartTime || null;
        this.craftingRecipeName = data.craftingRecipeName || null;
        this.craftingTimeTotal = data.craftingTimeTotal || null;
        
        this.socketId = null;
        this.needsUpdate = false;
        this.lastSave = Date.now();
        this.createdAt = data.createdAt || Date.now();
        this.lastLogin = Date.now();
    }

    calculateMaxHp() {
        return 100 + (this.level * 20) + (this.stats.vit * 10);
    }

    calculateMaxMp() {
        return 50 + (this.level * 10) + (this.stats.int * 5);
    }

    getExpToNextLevel() {
        // Progressive experience requirements with scaling
        return Math.floor(100 * Math.pow(1.2, this.level - 1));
    }

    gainExperience(amount) {
        this.experience += amount;
        let levelsGained = 0;
        
        while (this.experience >= this.getExpToNextLevel()) {
            this.experience -= this.getExpToNextLevel();
            this.level++;
            levelsGained++;
        }
        
        if (levelsGained > 0) {
            this.handleLevelUp(levelsGained);
        }
        
        this.needsUpdate = true;
        return levelsGained;
    }

    handleLevelUp(levelsGained) {
        // Stat points and skill points per level
        this.statPoints += levelsGained * 5;
        this.skillPoints += levelsGained * 1;
        
        // Health and mana bonus per level
        const oldMaxHp = this.maxHp;
        const oldMaxMp = this.maxMp;
        
        this.maxHp = this.calculateMaxHp();
        this.maxMp = this.calculateMaxMp();
        
        // Heal percentage of new HP/MP gained
        const hpGained = this.maxHp - oldMaxHp;
        const mpGained = this.maxMp - oldMaxMp;
        this.currentHp = Math.min(this.maxHp, this.currentHp + Math.floor(hpGained * 0.5));
        this.currentMp = Math.min(this.maxMp, this.currentMp + Math.floor(mpGained * 0.5));
        
        this.needsUpdate = true;
        
        return {
            levelsGained,
            hpGained,
            mpGained,
            statPointsGained: levelsGained * 5,
            skillPointsGained: levelsGained * 1
        };
    }

    // Legacy levelUp method for backward compatibility
    levelUp() {
        return this.handleLevelUp(1);
    }

    takeDamage(amount) {
        this.currentHp = Math.max(0, this.currentHp - amount);
        this.needsUpdate = true;
    }

    heal(amount) {
        this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
        this.needsUpdate = true;
    }

    useMana(amount) {
        if (this.currentMp >= amount) {
            this.currentMp -= amount;
            this.needsUpdate = true;
            return true;
        }
        return false;
    }

    restoreMana(amount) {
        this.currentMp = Math.min(this.maxMp, this.currentMp + amount);
        this.needsUpdate = true;
    }

    addItem(item) {
        const existingItem = this.inventory.find(i => i.id === item.id);
        if (existingItem && item.stackable) {
            existingItem.quantity += item.quantity || 1;
        } else {
            this.inventory.push(item);
        }
        this.needsUpdate = true;
    }

    removeItem(itemId, quantity = 1) {
        const index = this.inventory.findIndex(i => i.id === itemId);
        if (index !== -1) {
            if (this.inventory[index].quantity > quantity) {
                this.inventory[index].quantity -= quantity;
            } else {
                this.inventory.splice(index, 1);
            }
            this.needsUpdate = true;
            return true;
        }
        return false;
    }

    equipItem(item) {
        if (!item.slot) return false;
        
        const currentEquipped = this.equipment[item.slot];
        if (currentEquipped) {
            this.addItem(currentEquipped);
        }
        
        this.equipment[item.slot] = item;
        this.removeItem(item.id);
        this.recalculateStats();
        this.needsUpdate = true;
        return true;
    }

    unequipItem(slot) {
        const item = this.equipment[slot];
        if (!item) return false;
        
        this.addItem(item);
        this.equipment[slot] = null;
        this.recalculateStats();
        this.needsUpdate = true;
        return true;
    }

    recalculateStats() {
        this.maxHp = this.calculateMaxHp();
        this.maxMp = this.calculateMaxMp();
        
        for (const slot in this.equipment) {
            const item = this.equipment[slot];
            if (item && item.stats) {
                for (const stat in item.stats) {
                    this.stats[stat] += item.stats[stat];
                }
            }
        }
    }

    // Quest system helper methods
    hasCompletedQuest(questId) {
        return this.completedQuests.some(quest => quest.templateId === questId);
    }

    hasItem(itemId, quantity = 1) {
        const item = this.inventory.find(i => i.id === itemId);
        return item && item.quantity >= quantity;
    }

    getReputation(faction) {
        return this.reputation[faction] || 0;
    }

    modifyReputation(faction, amount) {
        this.reputation[faction] = (this.reputation[faction] || 0) + amount;
        this.needsUpdate = true;
    }

    hasStoryFlag(flag) {
        return this.storyFlags[flag] === true;
    }

    setStoryFlag(flag, value = true) {
        this.storyFlags[flag] = value;
        this.needsUpdate = true;
    }

    addGold(amount) {
        this.gold = (this.gold || 0) + amount;
        this.needsUpdate = true;
    }

    addTitle(title) {
        if (!this.titles) this.titles = [];
        if (!this.titles.includes(title)) {
            this.titles.push(title);
            this.needsUpdate = true;
        }
    }

    // === Crafting Skill Methods ===
    
    /**
     * Get the current level of a crafting skill
     */
    getSkillLevel(skillName) {
        if (!this.craftingSkills[skillName]) {
            return 0;
        }
        return this.craftingSkills[skillName].level;
    }

    /**
     * Get the current experience in a crafting skill
     */
    getSkillExperience(skillName) {
        if (!this.craftingSkills[skillName]) {
            return 0;
        }
        return this.craftingSkills[skillName].experience;
    }

    /**
     * Calculate experience needed to reach the next skill level
     */
    getExpToNextSkillLevel(skillName) {
        const currentLevel = this.getSkillLevel(skillName);
        return Math.floor(50 * Math.pow(1.3, currentLevel));
    }

    /**
     * Add experience to a crafting skill and handle level ups
     */
    addSkillExperience(skillName, amount) {
        if (!this.craftingSkills[skillName]) {
            this.craftingSkills[skillName] = { level: 0, experience: 0 };
        }

        this.craftingSkills[skillName].experience += amount;
        
        // Check for level up
        while (this.craftingSkills[skillName].experience >= this.getExpToNextSkillLevel(skillName)) {
            this.craftingSkills[skillName].experience -= this.getExpToNextSkillLevel(skillName);
            this.craftingSkills[skillName].level += 1;
            
            GameLogger.player(this.id, `skill_level_up`, { 
                skill: skillName, 
                newLevel: this.craftingSkills[skillName].level 
            });
            
            // Notify player of level up
            this.needsUpdate = true;
        }
    }

    /**
     * Get all crafting skill information
     */
    getAllCraftingSkills() {
        return this.craftingSkills;
    }

    /**
     * Check if player has a specific item in inventory
     */
    hasItem(itemId, quantity = 1) {
        const itemCount = this.inventory.filter(item => item.id === itemId).length;
        return itemCount >= quantity;
    }

    /**
     * Get count of a specific item in inventory
     */
    getItemCount(itemId) {
        return this.inventory.filter(item => item.id === itemId).length;
    }

    /**
     * Add an item to inventory
     */
    addItem(item) {
        this.inventory.push(item);
        this.needsUpdate = true;
    }

    /**
     * Remove items from inventory
     */
    removeItem(itemId, quantity = 1) {
        let removed = 0;
        this.inventory = this.inventory.filter(item => {
            if (item.id === itemId && removed < quantity) {
                removed++;
                return false;
            }
            return true;
        });
        
        if (removed > 0) {
            this.needsUpdate = true;
        }
        
        return removed;
    }

    async save() {
        const db = require('../config/database');
        const result = await db.savePlayer(this);
        this.lastSave = Date.now();
        GameLogger.database('save_player', result, { playerId: this.id, playerName: this.name });
        return result;
    }

    static async load(playerId) {
        const db = require('../config/database');
        const playerData = await db.loadPlayer(playerId);
        if (playerData) {
            return new Player(playerData);
        }
        return null;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            level: this.level,
            experience: this.experience,
            className: this.className,
            stats: this.stats,
            statPoints: this.statPoints,
            skillPoints: this.skillPoints,
            gold: this.gold,
            maxHp: this.maxHp,
            maxMp: this.maxMp,
            currentHp: this.currentHp,
            currentMp: this.currentMp,
            location: this.location,
            inventory: this.inventory,
            equipment: this.equipment,
            skills: this.skills,
            quests: this.quests,
            activeQuests: this.activeQuests,
            completedQuests: this.completedQuests,
            storyFlags: this.storyFlags,
            reputation: this.reputation,
            titles: this.titles,
            craftingSkills: this.craftingSkills,
            isCrafting: this.isCrafting,
            craftingStartTime: this.craftingStartTime,
            craftingRecipeName: this.craftingRecipeName,
            craftingTimeTotal: this.craftingTimeTotal,
            createdAt: this.createdAt,
            lastLogin: this.lastLogin
        };
    }
}

module.exports = Player;