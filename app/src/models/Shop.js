const Item = require('./Item');

class Shop {
    constructor(data = {}) {
        this.id = data.id;
        this.name = data.name || 'Unknown Shop';
        this.type = data.type || 'general'; // weapons, armor, magic, general
        this.description = data.description || 'A typical shop.';
        this.shopkeeper = data.shopkeeper || null;
        
        // Shop inventory - items for sale
        this.inventory = data.inventory || [];
        
        // Shop settings
        this.buyMultiplier = data.buyMultiplier || 1.2; // Price multiplier when selling to players
        this.sellMultiplier = data.sellMultiplier || 0.5; // Price multiplier when buying from players
        this.restockTime = data.restockTime || 3600000; // 1 hour in milliseconds
        
        // Shop state
        this.lastRestock = data.lastRestock || Date.now();
        this.gold = data.gold || 10000; // Shop's gold for buying from players
        
        // Special shop properties
        this.buysItems = data.buysItems !== false; // Default true
        this.sellsItems = data.sellsItems !== false; // Default true
        this.acceptedTypes = data.acceptedTypes || null; // null = accepts all types
        this.specialRequirements = data.specialRequirements || {};
    }

    // Get items for sale based on shop type
    getInventory() {
        // Check if restock is needed
        if (Date.now() - this.lastRestock > this.restockTime) {
            this.restock();
        }
        
        return this.inventory.filter(item => item.quantity > 0);
    }

    // Find an item for sale
    findItem(search) {
        const inventory = this.getInventory();
        return inventory.find(item => 
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.id.toLowerCase() === search.toLowerCase()
        );
    }

    // Get the buy price for an item (player buying from shop)
    getBuyPrice(item) {
        return Math.floor(item.value * this.buyMultiplier);
    }

    // Get the sell price for an item (player selling to shop)
    getSellPrice(item) {
        return Math.floor(item.value * this.sellMultiplier);
    }

    // Player buys an item from the shop
    buyItem(player, itemSearch, quantity = 1) {
        const item = this.findItem(itemSearch);
        if (!item) {
            return { success: false, message: `${this.name} doesn't sell '${itemSearch}'.` };
        }

        if (item.quantity < quantity) {
            return { 
                success: false, 
                message: `${this.name} only has ${item.quantity} ${item.name}(s) in stock.` 
            };
        }

        const totalPrice = this.getBuyPrice(item) * quantity;
        if (player.gold < totalPrice) {
            return { 
                success: false, 
                message: `You need ${totalPrice} gold to buy ${quantity} ${item.name}(s). You have ${player.gold} gold.` 
            };
        }

        // Check requirements
        const canUse = item.canUse ? item.canUse(player) : { canUse: true };
        if (!canUse.canUse) {
            return { 
                success: false, 
                message: `You cannot buy ${item.name}: ${canUse.reason}` 
            };
        }

        // Complete the transaction
        player.gold -= totalPrice;
        player.addItem(item.createCopy ? item.createCopy(quantity) : { ...item, quantity });
        item.quantity -= quantity;

        return { 
            success: true, 
            message: `You buy ${quantity} ${item.name}(s) for ${totalPrice} gold.`,
            item: item,
            quantity: quantity,
            price: totalPrice
        };
    }

    // Player sells an item to the shop
    sellItem(player, itemSearch, quantity = 1) {
        if (!this.buysItems) {
            return { success: false, message: `${this.name} doesn't buy items from customers.` };
        }

        const playerItem = player.inventory.find(i => 
            i.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
            i.id.toLowerCase() === itemSearch.toLowerCase()
        );

        if (!playerItem) {
            return { success: false, message: `You don't have '${itemSearch}'.` };
        }

        if (playerItem.quantity < quantity) {
            return { 
                success: false, 
                message: `You only have ${playerItem.quantity} ${playerItem.name}(s).` 
            };
        }

        // Check if shop accepts this type of item
        if (this.acceptedTypes && !this.acceptedTypes.includes(playerItem.type)) {
            return { 
                success: false, 
                message: `${this.name} doesn't buy ${playerItem.type} items.` 
            };
        }

        // Check if item can be sold
        if (!playerItem.tradeable) {
            return { 
                success: false, 
                message: `${playerItem.name} cannot be sold.` 
            };
        }

        const totalPrice = this.getSellPrice(playerItem) * quantity;
        if (this.gold < totalPrice) {
            return { 
                success: false, 
                message: `${this.name} doesn't have enough gold to buy that from you.` 
            };
        }

        // Complete the transaction
        player.gold += totalPrice;
        player.removeItem(playerItem.id, quantity);
        this.gold -= totalPrice;

        // Add to shop inventory if it's the type we sell
        if (this.shouldStockItem(playerItem)) {
            const existingItem = this.inventory.find(i => i.templateId === playerItem.templateId);
            if (existingItem && existingItem.canStackWith && existingItem.canStackWith(playerItem)) {
                existingItem.quantity += quantity;
            } else {
                this.inventory.push(playerItem.createCopy ? playerItem.createCopy(quantity) : { ...playerItem, quantity });
            }
        }

        return { 
            success: true, 
            message: `You sell ${quantity} ${playerItem.name}(s) for ${totalPrice} gold.`,
            item: playerItem,
            quantity: quantity,
            price: totalPrice
        };
    }

    // Check if the shop should stock this item type
    shouldStockItem(item) {
        switch(this.type) {
            case 'weapons':
                return item.type === 'weapon';
            case 'armor':
                return ['armor', 'helmet', 'boots'].includes(item.type);
            case 'magic':
                return item.type === 'magic' || item.magical;
            case 'general':
                return ['consumable', 'tool', 'material', 'misc'].includes(item.type);
            default:
                return true;
        }
    }

    // Restock the shop with base inventory
    restock() {
        this.lastRestock = Date.now();
        
        // Define base inventory by shop type
        const baseInventory = this.getBaseInventory();
        
        // Restock items or add if missing
        baseInventory.forEach(itemTemplate => {
            const existing = this.inventory.find(i => i.templateId === itemTemplate.id);
            if (existing) {
                // Restock to at least minimum quantity
                const minQuantity = itemTemplate.baseQuantity || 5;
                if (existing.quantity < minQuantity) {
                    existing.quantity = minQuantity;
                }
            } else {
                // Add new item
                const newItem = new Item(itemTemplate);
                newItem.quantity = itemTemplate.baseQuantity || 5;
                this.inventory.push(newItem);
            }
        });
    }

    // Get base inventory templates by shop type
    getBaseInventory() {
        const itemTemplates = require('../data/items');
        const baseItems = [];

        switch(this.type) {
            case 'weapons':
                baseItems.push(
                    { ...itemTemplates.rusty_sword, baseQuantity: 3 },
                    { ...itemTemplates.iron_sword, baseQuantity: 2 },
                    { ...itemTemplates.wooden_staff, baseQuantity: 2 }
                );
                break;
                
            case 'armor':
                baseItems.push(
                    { ...itemTemplates.cloth_shirt, baseQuantity: 5 },
                    { ...itemTemplates.leather_armor, baseQuantity: 3 },
                    { ...itemTemplates.leather_cap, baseQuantity: 4 },
                    { ...itemTemplates.leather_boots, baseQuantity: 4 }
                );
                break;
                
            case 'magic':
                baseItems.push(
                    { ...itemTemplates.mana_potion, baseQuantity: 10 },
                    { ...itemTemplates.silver_amulet, baseQuantity: 2 },
                    { ...itemTemplates.wooden_staff, baseQuantity: 1 }
                );
                break;
                
            case 'general':
            default:
                baseItems.push(
                    { ...itemTemplates.bread, baseQuantity: 20 },
                    { ...itemTemplates.water, baseQuantity: 15 },
                    { ...itemTemplates.health_potion, baseQuantity: 10 },
                    { ...itemTemplates.torch, baseQuantity: 25 },
                    { ...itemTemplates.lockpick, baseQuantity: 5 }
                );
                break;
        }

        return baseItems;
    }

    // Get shop info for display
    getShopInfo() {
        const inventory = this.getInventory();
        return {
            name: this.name,
            type: this.type,
            description: this.description,
            shopkeeper: this.shopkeeper,
            itemCount: inventory.length,
            buysItems: this.buysItems,
            sellsItems: this.sellsItems
        };
    }

    // List all items with prices
    listItems() {
        const inventory = this.getInventory();
        return inventory.map(item => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            price: this.getBuyPrice(item),
            type: item.type,
            rarity: item.rarity
        }));
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            description: this.description,
            shopkeeper: this.shopkeeper,
            inventory: this.inventory,
            buyMultiplier: this.buyMultiplier,
            sellMultiplier: this.sellMultiplier,
            lastRestock: this.lastRestock,
            gold: this.gold,
            buysItems: this.buysItems,
            sellsItems: this.sellsItems,
            acceptedTypes: this.acceptedTypes
        };
    }
}

module.exports = Shop;