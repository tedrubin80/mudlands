const GameLogger = require('../utils/logger');

/**
 * Comprehensive Crafting System for MUDlands Online
 * Handles recipe management, crafting calculations, and skill progression
 */
class CraftingSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.recipes = new Map();
        this.skillBonuses = new Map();
        
        this.loadRecipes();
        this.initializeSkillBonuses();
        
        GameLogger.info('Crafting System initialized');
    }

    /**
     * Load all crafting recipes from data files
     */
    loadRecipes() {
        // Basic weapon crafting recipes
        this.addRecipe({
            id: 'iron_sword_crafting',
            name: 'Iron Sword',
            category: 'weapon',
            skill: 'blacksmithing',
            level: 3,
            experience: 25,
            time: 60, // seconds
            materials: [
                { id: 'iron_ore', quantity: 3 },
                { id: 'wood_handle', quantity: 1 },
                { id: 'coal', quantity: 2 }
            ],
            tools: ['anvil', 'hammer'],
            result: { id: 'iron_sword', quantity: 1 },
            successRate: 85
        });

        this.addRecipe({
            id: 'curved_blade_crafting',
            name: 'Curved Blade',
            category: 'weapon',
            skill: 'blacksmithing',
            level: 4,
            experience: 35,
            time: 90,
            materials: [
                { id: 'iron_ore', quantity: 2 },
                { id: 'steel_ingot', quantity: 1 },
                { id: 'leather_grip', quantity: 1 }
            ],
            tools: ['anvil', 'hammer'],
            result: { id: 'curved_blade', quantity: 1 },
            successRate: 75
        });

        // Armor crafting recipes
        this.addRecipe({
            id: 'leather_armor_crafting',
            name: 'Leather Armor',
            category: 'armor',
            skill: 'leatherworking',
            level: 1,
            experience: 15,
            time: 45,
            materials: [
                { id: 'wolf_pelt', quantity: 2 },
                { id: 'thread', quantity: 5 },
                { id: 'leather_oil', quantity: 1 }
            ],
            tools: ['needle', 'cutting_knife'],
            result: { id: 'leather_armor', quantity: 1 },
            successRate: 90
        });

        // Alchemy recipes
        this.addRecipe({
            id: 'health_potion_crafting',
            name: 'Health Potion',
            category: 'alchemy',
            skill: 'alchemy',
            level: 1,
            experience: 10,
            time: 30,
            materials: [
                { id: 'herb_bundle', quantity: 2 },
                { id: 'water_flask', quantity: 1 },
                { id: 'healing_crystal', quantity: 1 }
            ],
            tools: ['mortar_pestle', 'cauldron'],
            result: { id: 'health_potion', quantity: 3 },
            successRate: 95
        });

        this.addRecipe({
            id: 'poison_coating_crafting',
            name: 'Poison Coating',
            category: 'alchemy',
            skill: 'alchemy',
            level: 3,
            experience: 20,
            time: 40,
            materials: [
                { id: 'poison_gland', quantity: 2 },
                { id: 'nightshade_extract', quantity: 1 },
                { id: 'alcohol', quantity: 1 }
            ],
            tools: ['mortar_pestle', 'distillery'],
            result: { id: 'poison_coating', quantity: 5 },
            successRate: 80
        });

        // Enchanting recipes
        this.addRecipe({
            id: 'magic_crystal_crafting',
            name: 'Magic Crystal',
            category: 'enchanting',
            skill: 'enchanting',
            level: 5,
            experience: 50,
            time: 120,
            materials: [
                { id: 'crystal_shard', quantity: 5 },
                { id: 'ancient_rune', quantity: 1 },
                { id: 'mana_essence', quantity: 3 }
            ],
            tools: ['enchanting_table', 'focus_crystal'],
            result: { id: 'magic_crystal', quantity: 1 },
            successRate: 70
        });

        // Tailoring recipes
        this.addRecipe({
            id: 'spectral_cloak_repair',
            name: 'Spectral Cloak Repair',
            category: 'tailoring',
            skill: 'tailoring',
            level: 8,
            experience: 75,
            time: 180,
            materials: [
                { id: 'guardian_essence', quantity: 2 },
                { id: 'spider_silk', quantity: 10 },
                { id: 'ethereal_thread', quantity: 5 }
            ],
            tools: ['mystic_loom', 'spirit_needle'],
            result: { id: 'spectral_cloak', quantity: 1 },
            successRate: 60
        });

        GameLogger.info(`Loaded ${this.recipes.size} crafting recipes`);
    }

    /**
     * Initialize skill bonuses for different professions
     */
    initializeSkillBonuses() {
        this.skillBonuses.set('blacksmithing', {
            successRate: 2, // +2% per level
            qualityBonus: 1.5, // +1.5% quality per level
            experienceMultiplier: 1.1
        });

        this.skillBonuses.set('leatherworking', {
            successRate: 2.5,
            qualityBonus: 1.2,
            experienceMultiplier: 1.15
        });

        this.skillBonuses.set('alchemy', {
            successRate: 3,
            qualityBonus: 2,
            experienceMultiplier: 1.2
        });

        this.skillBonuses.set('enchanting', {
            successRate: 1.5,
            qualityBonus: 3,
            experienceMultiplier: 1.25
        });

        this.skillBonuses.set('tailoring', {
            successRate: 2.2,
            qualityBonus: 1.8,
            experienceMultiplier: 1.18
        });
    }

    /**
     * Add a new recipe to the crafting system
     */
    addRecipe(recipe) {
        this.recipes.set(recipe.id, recipe);
    }

    /**
     * Get all recipes available to a player
     */
    getAvailableRecipes(player) {
        const available = [];
        for (const [id, recipe] of this.recipes) {
            if (this.canPlayerCraftRecipe(player, recipe)) {
                available.push(recipe);
            }
        }
        return available;
    }

    /**
     * Check if a player can craft a specific recipe
     */
    canPlayerCraftRecipe(player, recipe) {
        // Check skill level
        const skillLevel = player.getSkillLevel(recipe.skill) || 0;
        if (skillLevel < recipe.level) {
            return false;
        }

        // Check materials
        for (const material of recipe.materials) {
            if (!player.inventory.hasItem(material.id, material.quantity)) {
                return false;
            }
        }

        // Check tools (tools don't get consumed)
        for (const tool of recipe.tools) {
            if (!player.inventory.hasItem(tool)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Attempt to craft an item
     */
    async craftItem(player, recipeId) {
        const recipe = this.recipes.get(recipeId);
        if (!recipe) {
            return { success: false, message: 'Recipe not found.' };
        }

        if (!this.canPlayerCraftRecipe(player, recipe)) {
            return { success: false, message: 'You cannot craft this recipe.' };
        }

        // Check if player is already crafting
        if (player.isCrafting) {
            return { success: false, message: 'You are already crafting something.' };
        }

        // Start crafting process
        player.isCrafting = true;
        player.craftingStartTime = Date.now();

        // Notify player
        this.gameEngine.sendToPlayer(player.id, `You begin crafting ${recipe.name}...`);

        // Set crafting timer
        setTimeout(() => {
            this.completeCrafting(player, recipe);
        }, recipe.time * 1000);

        return { success: true, message: `Started crafting ${recipe.name}.` };
    }

    /**
     * Complete the crafting process
     */
    completeCrafting(player, recipe) {
        player.isCrafting = false;
        player.craftingStartTime = null;

        // Calculate success rate
        const skillLevel = player.getSkillLevel(recipe.skill) || 0;
        const skillBonus = this.skillBonuses.get(recipe.skill);
        const successRate = Math.min(95, recipe.successRate + (skillLevel * skillBonus.successRate));
        
        const roll = Math.random() * 100;
        const success = roll < successRate;

        if (success) {
            // Remove materials from inventory
            for (const material of recipe.materials) {
                player.inventory.removeItem(material.id, material.quantity);
            }

            // Add crafted item to inventory
            const quality = this.calculateItemQuality(skillLevel, skillBonus);
            const craftedItem = this.createCraftedItem(recipe.result, quality);
            
            player.inventory.addItem(craftedItem);

            // Award experience
            const expGained = Math.floor(recipe.experience * skillBonus.experienceMultiplier);
            player.addSkillExperience(recipe.skill, expGained);

            this.gameEngine.sendToPlayer(player.id, 
                `You successfully craft ${recipe.name}! Quality: ${quality}% (+${expGained} ${recipe.skill} XP)`
            );

            GameLogger.crafting(player.id, recipe.id, 'success', { quality, experience: expGained });
        } else {
            // Partial material loss on failure
            const materialLoss = Math.random() * 0.5; // 0-50% material loss
            for (const material of recipe.materials) {
                const lostQuantity = Math.floor(material.quantity * materialLoss);
                if (lostQuantity > 0) {
                    player.inventory.removeItem(material.id, lostQuantity);
                }
            }

            // Small experience gain even on failure
            const failureExp = Math.floor(recipe.experience * 0.2);
            player.addSkillExperience(recipe.skill, failureExp);

            this.gameEngine.sendToPlayer(player.id, 
                `Your crafting attempt fails! You lose some materials but gain ${failureExp} ${recipe.skill} XP from the experience.`
            );

            GameLogger.crafting(player.id, recipe.id, 'failure', { experience: failureExp });
        }
    }

    /**
     * Calculate item quality based on skill level
     */
    calculateItemQuality(skillLevel, skillBonus) {
        const baseQuality = 50;
        const skillQuality = skillLevel * skillBonus.qualityBonus;
        const randomFactor = (Math.random() * 20) - 10; // -10 to +10
        
        return Math.max(10, Math.min(100, Math.floor(baseQuality + skillQuality + randomFactor)));
    }

    /**
     * Create a crafted item with quality modifiers
     */
    createCraftedItem(result, quality) {
        const item = { ...this.gameEngine.worldData.getItem(result.id) };
        
        // Apply quality modifiers
        if (item.stats) {
            for (const [stat, value] of Object.entries(item.stats)) {
                item.stats[stat] = Math.floor(value * (quality / 100));
            }
        }
        
        // Enhance durability based on quality
        if (item.durability) {
            item.durability = Math.floor(item.durability * (quality / 100));
        }
        
        // Add quality property
        item.quality = quality;
        item.crafted = true;
        
        return item;
    }

    /**
     * Get crafting information for a player
     */
    getCraftingInfo(player) {
        const skills = ['blacksmithing', 'leatherworking', 'alchemy', 'enchanting', 'tailoring'];
        const info = {
            skills: {},
            availableRecipes: this.getAvailableRecipes(player).length,
            isCrafting: player.isCrafting || false
        };

        for (const skill of skills) {
            info.skills[skill] = {
                level: player.getSkillLevel(skill) || 0,
                experience: player.getSkillExperience(skill) || 0,
                experienceToNext: player.getExpToNextSkillLevel(skill) || 100
            };
        }

        return info;
    }

    /**
     * List all recipes for a specific category or skill
     */
    listRecipes(category = null, skill = null) {
        let filtered = Array.from(this.recipes.values());
        
        if (category) {
            filtered = filtered.filter(recipe => recipe.category === category);
        }
        
        if (skill) {
            filtered = filtered.filter(recipe => recipe.skill === skill);
        }
        
        return filtered.sort((a, b) => a.level - b.level);
    }
}

module.exports = CraftingSystem;