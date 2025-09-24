const { v4: uuidv4 } = require('uuid');

class Room {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.name = data.name || 'Unknown Room';
        this.description = data.description || 'An empty room.';
        this.exits = data.exits || {};
        this.players = new Map();
        this.monsters = new Map();
        this.items = new Map();
        this.npcs = new Map();
        this.monsterSpawns = data.monsters || [];
        this.itemSpawns = data.items || [];
        this.properties = data.properties || {};
    }

    addPlayer(player) {
        this.players.set(player.id, player);
    }

    removePlayer(playerId) {
        this.players.delete(playerId);
    }

    getPlayers() {
        return Array.from(this.players.values());
    }

    findPlayer(name) {
        const lowerName = name.toLowerCase();
        return Array.from(this.players.values()).find(p => 
            p.name.toLowerCase() === lowerName || 
            p.name.toLowerCase().startsWith(lowerName)
        );
    }

    addMonster(monster) {
        this.monsters.set(monster.id, monster);
    }

    removeMonster(monsterId) {
        this.monsters.delete(monsterId);
    }

    getMonsters() {
        return Array.from(this.monsters.values());
    }

    findMonster(name) {
        const lowerName = name.toLowerCase();
        return Array.from(this.monsters.values()).find(m => 
            m.name.toLowerCase() === lowerName || 
            m.name.toLowerCase().includes(lowerName) ||
            m.name.toLowerCase().split(' ').some(word => word.startsWith(lowerName))
        );
    }

    addItem(item) {
        this.items.set(item.id, item);
    }

    removeItem(itemId) {
        this.items.delete(itemId);
    }

    getItems() {
        return Array.from(this.items.values());
    }

    findItem(name) {
        const lowerName = name.toLowerCase();
        return Array.from(this.items.values()).find(i => 
            i.name.toLowerCase() === lowerName || 
            i.name.toLowerCase().startsWith(lowerName)
        );
    }

    addNpc(npc) {
        this.npcs.set(npc.id, npc);
    }

    removeNpc(npcId) {
        this.npcs.delete(npcId);
    }

    getNpcs() {
        return Array.from(this.npcs.values());
    }

    findNpc(name) {
        const lowerName = name.toLowerCase();
        return Array.from(this.npcs.values()).find(n => 
            n.name.toLowerCase() === lowerName || 
            n.name.toLowerCase().startsWith(lowerName)
        );
    }

    getExit(direction) {
        return this.exits[direction.toLowerCase()];
    }

    getExitList() {
        return Object.keys(this.exits);
    }

    hasExit(direction) {
        return this.exits.hasOwnProperty(direction.toLowerCase());
    }

    setExit(direction, roomId) {
        this.exits[direction.toLowerCase()] = roomId;
    }

    removeExit(direction) {
        delete this.exits[direction.toLowerCase()];
    }

    update() {
        for (const [id, monster] of this.monsters) {
            if (monster.currentHp > 0) {
                monster.regenerate();
            }
        }
    }

    getOccupantCount() {
        return this.players.size + this.monsters.size + this.npcs.size;
    }

    isEmpty() {
        return this.getOccupantCount() === 0;
    }

    broadcast(message, excludePlayerId = null) {
        this.players.forEach((player, id) => {
            if (id !== excludePlayerId && player.socketId) {
                // This would emit to the player's socket
            }
        });
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            exits: this.exits,
            playerCount: this.players.size,
            monsterCount: this.monsters.size,
            itemCount: this.items.size,
            npcCount: this.npcs.size,
            properties: this.properties
        };
    }
}

module.exports = Room;