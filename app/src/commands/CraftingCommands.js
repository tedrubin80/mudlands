/**
 * Crafting Commands for MUDlands Online
 * Handles all player crafting interactions
 */
class CraftingCommands {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.craftingSystem = gameEngine.craftingSystem;
    }

    /**
     * Show crafting information and skills
     */
    handleCraft(player, args) {
        if (!args || args.trim() === '') {
            return this.showCraftingOverview(player);
        }

        const parts = args.trim().split(' ');
        const subCommand = parts[0].toLowerCase();

        switch (subCommand) {
            case 'list':
                return this.listRecipes(player, parts[1]);
            case 'show':
            case 'recipe':
                return this.showRecipe(player, parts.slice(1).join(' '));
            case 'make':
            case 'create':
                return this.craftItem(player, parts.slice(1).join(' '));
            case 'skills':
                return this.showSkills(player);
            case 'queue':
            case 'status':
                return this.showCraftingStatus(player);
            case 'help':
                return this.showCraftingHelp(player);
            default:
                // Try to craft the item directly
                return this.craftItem(player, args);
        }
    }

    /**
     * Show crafting overview
     */
    showCraftingOverview(player) {
        const info = this.craftingSystem.getCraftingInfo(player);
        let output = '=== Crafting System ===\n';
        output += 'Use: craft help - for detailed commands\n\n';

        output += '=== Your Crafting Skills ===\n';
        for (const [skill, data] of Object.entries(info.skills)) {
            const skillName = skill.charAt(0).toUpperCase() + skill.slice(1);
            output += `${skillName}: Level ${data.level} (${data.experience}/${data.experienceToNext} XP)\n`;
        }

        output += `\nAvailable Recipes: ${info.availableRecipes}\n`;
        
        if (info.isCrafting) {
            output += '\n⚒️  You are currently crafting something...\n';
        }

        output += '\nUse "craft list" to see available recipes.';

        return { success: true, message: output };
    }

    /**
     * List available recipes
     */
    listRecipes(player, category = null) {
        const recipes = this.craftingSystem.getAvailableRecipes(player);
        
        if (recipes.length === 0) {
            return { success: false, message: "You don't know any recipes yet. Visit trainers or find recipe books!" };
        }

        // Filter by category if specified
        const filtered = category 
            ? recipes.filter(r => r.category.toLowerCase() === category.toLowerCase())
            : recipes;

        if (filtered.length === 0) {
            return { success: false, message: `No recipes found for category: ${category}` };
        }

        // Group by category
        const grouped = filtered.reduce((acc, recipe) => {
            if (!acc[recipe.category]) acc[recipe.category] = [];
            acc[recipe.category].push(recipe);
            return acc;
        }, {});

        let output = '=== Available Crafting Recipes ===\n';
        
        for (const [cat, recipeList] of Object.entries(grouped)) {
            const categoryName = cat.charAt(0).toUpperCase() + cat.slice(1);
            output += `\n--- ${categoryName} ---\n`;
            
            recipeList.sort((a, b) => a.level - b.level).forEach(recipe => {
                const canCraft = this.craftingSystem.canPlayerCraftRecipe(player, recipe);
                const status = canCraft ? '✓' : '✗';
                output += `${status} [${recipe.level}] ${recipe.name} (${recipe.skill})\n`;
            });
        }

        output += '\nUse "craft show <recipe name>" for details.';
        
        return { success: true, message: output };
    }

    /**
     * Show detailed recipe information
     */
    showRecipe(player, recipeName) {
        if (!recipeName) {
            return { success: false, message: 'Usage: craft show <recipe name>' };
        }

        // Find recipe by name (case insensitive)
        const recipes = Array.from(this.craftingSystem.recipes.values());
        const recipe = recipes.find(r => 
            r.name.toLowerCase().includes(recipeName.toLowerCase()) ||
            r.id.toLowerCase().includes(recipeName.toLowerCase())
        );

        if (!recipe) {
            return { success: false, message: `Recipe not found: ${recipeName}` };
        }

        const canCraft = this.craftingSystem.canPlayerCraftRecipe(player, recipe);
        const skillLevel = player.getSkillLevel(recipe.skill) || 0;

        let output = `=== ${recipe.name} ===\n`;
        output += `Category: ${recipe.category}\n`;
        output += `Skill: ${recipe.skill} (Level ${recipe.level} required, you have ${skillLevel})\n`;
        output += `Success Rate: ${recipe.successRate}%\n`;
        output += `Crafting Time: ${recipe.time} seconds\n`;
        output += `Experience Gained: ${recipe.experience} XP\n\n`;

        output += '=== Materials Required ===\n';
        recipe.materials.forEach(mat => {
            const hasQuantity = player.inventory.getItemCount(mat.id);
            const status = hasQuantity >= mat.quantity ? '✓' : '✗';
            output += `${status} ${mat.id} x${mat.quantity} (have: ${hasQuantity})\n`;
        });

        output += '\n=== Tools Required ===\n';
        recipe.tools.forEach(tool => {
            const hasTool = player.inventory.hasItem(tool);
            const status = hasTool ? '✓' : '✗';
            output += `${status} ${tool}\n`;
        });

        output += `\n=== Result ===\n`;
        output += `${recipe.result.id} x${recipe.result.quantity}\n\n`;

        if (canCraft) {
            output += '✓ You can craft this recipe!\n';
            output += `Use: craft make ${recipe.name}`;
        } else {
            output += '✗ You cannot craft this recipe yet.';
        }

        return { success: true, message: output };
    }

    /**
     * Attempt to craft an item
     */
    async craftItem(player, recipeName) {
        if (!recipeName) {
            return { success: false, message: 'Usage: craft make <recipe name>' };
        }

        // Find recipe by name
        const recipes = Array.from(this.craftingSystem.recipes.values());
        const recipe = recipes.find(r => 
            r.name.toLowerCase().includes(recipeName.toLowerCase()) ||
            r.id.toLowerCase().includes(recipeName.toLowerCase())
        );

        if (!recipe) {
            return { success: false, message: `Recipe not found: ${recipeName}` };
        }

        // Attempt crafting
        const result = await this.craftingSystem.craftItem(player, recipe.id);
        return result;
    }

    /**
     * Show detailed skill information
     */
    showSkills(player) {
        const info = this.craftingSystem.getCraftingInfo(player);
        let output = '=== Crafting Skills ===\n\n';

        for (const [skill, data] of Object.entries(info.skills)) {
            const skillName = skill.charAt(0).toUpperCase() + skill.slice(1);
            const progressPercent = Math.floor((data.experience / data.experienceToNext) * 100);
            const progressBar = this.createProgressBar(progressPercent, 20);
            
            output += `${skillName}: Level ${data.level}\n`;
            output += `Experience: ${data.experience}/${data.experienceToNext}\n`;
            output += `Progress: ${progressBar} ${progressPercent}%\n\n`;
        }

        // Show recipes available at next level
        const nextLevelRecipes = this.getNextLevelRecipes(player);
        if (nextLevelRecipes.length > 0) {
            output += '=== Recipes Available at Next Level ===\n';
            nextLevelRecipes.forEach(recipe => {
                output += `• ${recipe.name} (${recipe.skill} ${recipe.level})\n`;
            });
        }

        return { success: true, message: output };
    }

    /**
     * Show current crafting status
     */
    showCraftingStatus(player) {
        if (!player.isCrafting) {
            return { success: false, message: 'You are not currently crafting anything.' };
        }

        const elapsed = (Date.now() - player.craftingStartTime) / 1000;
        const remaining = Math.max(0, player.craftingTimeTotal - elapsed);
        
        let output = '=== Crafting Status ===\n';
        output += `Currently crafting: ${player.craftingRecipeName}\n`;
        output += `Time remaining: ${Math.ceil(remaining)} seconds\n`;
        output += `Progress: ${this.createProgressBar((elapsed / player.craftingTimeTotal) * 100, 30)}\n`;

        return { success: true, message: output };
    }

    /**
     * Show crafting help
     */
    showCraftingHelp(player) {
        let output = '=== Crafting System Help ===\n\n';
        output += 'Commands:\n';
        output += '• craft - Show crafting overview\n';
        output += '• craft list [category] - List available recipes\n';
        output += '• craft show <recipe> - Show recipe details\n';
        output += '• craft make <recipe> - Craft an item\n';
        output += '• craft skills - Show your crafting skills\n';
        output += '• craft status - Show current crafting progress\n\n';
        
        output += 'Categories: weapon, armor, alchemy, enchanting, tailoring\n\n';
        
        output += 'Tips:\n';
        output += '• Higher skill levels increase success rates and quality\n';
        output += '• You can only craft one item at a time\n';
        output += '• Some recipes require special locations (like forges)\n';
        output += '• Failed attempts may still grant experience\n';
        output += '• Visit NPCs to learn new recipes';

        return { success: true, message: output };
    }

    /**
     * Create a text progress bar
     */
    createProgressBar(percent, width = 20) {
        const filled = Math.floor((percent / 100) * width);
        const empty = width - filled;
        return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
    }

    /**
     * Get recipes available at the next skill level
     */
    getNextLevelRecipes(player) {
        const nextLevel = [];
        const skills = ['blacksmithing', 'leatherworking', 'alchemy', 'enchanting', 'tailoring'];
        
        for (const skill of skills) {
            const currentLevel = player.getSkillLevel(skill) || 0;
            const recipes = this.craftingSystem.listRecipes(null, skill);
            
            const nextRecipes = recipes.filter(r => 
                r.level === currentLevel + 1
            );
            
            nextLevel.push(...nextRecipes);
        }
        
        return nextLevel;
    }

    /**
     * Handle recipe learning from NPCs or books
     */
    handleLearnRecipe(player, args) {
        // This would be called when interacting with NPCs or using recipe books
        // Implementation would depend on the specific learning mechanism
        return { success: false, message: 'Recipe learning not yet implemented.' };
    }

    /**
     * Show recipes by category shortcut commands
     */
    handleWeapons(player, args) {
        return this.listRecipes(player, 'weapon');
    }

    handleArmor(player, args) {
        return this.listRecipes(player, 'armor');
    }

    handleAlchemy(player, args) {
        return this.listRecipes(player, 'alchemy');
    }

    handleEnchanting(player, args) {
        return this.listRecipes(player, 'enchanting');
    }
}

module.exports = CraftingCommands;