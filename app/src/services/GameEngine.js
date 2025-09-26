const EventEmitter = require('events');
const chalk = require('chalk');
const World = require('./World');
const CombatSystem = require('./CombatSystem');
const QuestManager = require('./QuestManager');
const CraftingSystem = require('../systems/CraftingSystem');
const AICharacterController = require('./AICharacterController');
const GameLogger = require('../utils/logger');

class GameEngine extends EventEmitter {
    constructor() {
        super();
        this.players = new Map();
        this.world = new World();
        this.combatSystem = new CombatSystem(this);
        this.questManager = new QuestManager(this);
        this.craftingSystem = new CraftingSystem(this);
        this.tickRate = process.env.TICK_RATE || 100;
        this.saveInterval = process.env.SAVE_INTERVAL || 60000;
        this.running = false;

        // Initialize AI Character Controller
        this.aiCharacterController = null; // Will be initialized after socket handler is ready
    }

    async initialize() {
        GameLogger.gameEvent('engine_initialize_start');
        await this.world.loadRooms();
        await this.questManager.initialize();
        this.world.spawnMonsters();
        this.world.spawnRoomItems();
        this.startGameLoop();
        this.startAutoSave();
        GameLogger.gameEvent('engine_initialize_complete');
    }

    startGameLoop() {
        this.running = true;
        setInterval(() => {
            if (this.running) {
                this.tick();
            }
        }, this.tickRate);
    }

    tick() {
        this.world.update();
        this.combatSystem.processCombat();
        
        for (const [id, player] of this.players) {
            if (player.needsUpdate) {
                this.emit('playerUpdate', player);
                player.needsUpdate = false;
            }
        }
    }

    startAutoSave() {
        setInterval(() => {
            this.saveAllPlayers();
        }, this.saveInterval);
    }

    async saveAllPlayers() {
        GameLogger.gameEvent('autosave_start', { playerCount: this.players.size });
        const savePromises = [];
        for (const [id, player] of this.players) {
            savePromises.push(player.save());
        }
        await Promise.all(savePromises);
        GameLogger.gameEvent('autosave_complete', { playerCount: this.players.size });
    }

    addPlayer(player) {
        this.players.set(player.id, player);
        const room = this.world.getRoom(player.location);
        if (room) {
            room.addPlayer(player);
            this.emit('playerJoinedRoom', { player, room });
        }
        this.emit('playerConnected', player);
        GameLogger.playerAction(player.id, player.name, 'joined_game', { location: player.location });
    }

    async removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            const room = this.world.getRoom(player.location);
            if (room) {
                room.removePlayer(playerId);
                this.emit('playerLeftRoom', { player, room });
            }
            await player.save();
            this.players.delete(playerId);
            this.emit('playerDisconnected', player);
            GameLogger.playerAction(playerId, player.name, 'left_game', { location: player.location });
        }
    }

    getPlayer(playerId) {
        return this.players.get(playerId);
    }

    getPlayerCount() {
        return this.players.size;
    }

    movePlayer(player, direction) {
        const currentRoom = this.world.getRoom(player.location);
        if (!currentRoom) return false;

        const exit = currentRoom.getExit(direction);
        if (!exit) {
            return { success: false, message: "You can't go that way." };
        }

        const newRoom = this.world.getRoom(exit);
        if (!newRoom) {
            return { success: false, message: "That area is not accessible." };
        }

        currentRoom.removePlayer(player.id);
        player.location = exit;
        newRoom.addPlayer(player);

        // Update quest progress for location visits
        this.questManager.updateQuestProgress(player, 'location_visited', {
            locationId: exit,
            locationName: newRoom.name
        });

        this.emit('playerMoved', { 
            player, 
            from: currentRoom, 
            to: newRoom, 
            direction 
        });

        return { 
            success: true, 
            room: newRoom,
            message: `You move ${direction}.`
        };
    }

    broadcastToRoom(roomId, message, excludePlayerId = null) {
        const room = this.world.getRoom(roomId);
        if (room) {
            room.getPlayers().forEach(player => {
                if (player.id !== excludePlayerId) {
                    this.emit('messageToPlayer', { 
                        playerId: player.id, 
                        message 
                    });
                }
            });
        }
    }

    broadcastToAll(message, excludePlayerId = null) {
        this.players.forEach((player, id) => {
            if (id !== excludePlayerId) {
                this.emit('messageToPlayer', { 
                    playerId: id, 
                    message 
                });
            }
        });
    }

    // Admin functionality methods
    getActivePlayers() {
        return Array.from(this.players.values());
    }

    async kickPlayer(playerId, reason = 'Kicked by admin') {
        const player = this.players.get(playerId);
        if (player) {
            this.emit('messageToPlayer', {
                playerId: player.id,
                message: chalk.red(`You have been kicked from the server: ${reason}`)
            });
            
            // Give player time to see the message before disconnecting
            setTimeout(() => {
                this.emit('kickPlayer', { playerId, reason });
            }, 1000);
            
            GameLogger.info('Player kicked by admin', {
                playerId,
                playerName: player.name,
                reason
            });
            return true;
        }
        return false;
    }

    async broadcastMessage(message, type = 'admin') {
        const formattedMessage = type === 'admin' 
            ? chalk.yellow(`[ADMIN] ${message}`)
            : message;
            
        this.broadcastToAll(formattedMessage);
        
        GameLogger.info('Admin broadcast sent', {
            message: message.substring(0, 100),
            playerCount: this.players.size
        });
    }

    async executeAdminCommand(command, admin) {
        const args = command.split(' ');
        const cmd = args[0].toLowerCase();
        
        GameLogger.info('Admin command executed', {
            admin: admin.username,
            command: cmd,
            args: args.slice(1)
        });

        switch (cmd) {
            case 'players':
                return `Active players: ${this.players.size}\n${Array.from(this.players.values())
                    .map(p => `- ${p.name} (${p.id}) in ${p.location}`)
                    .join('\n')}`;
            
            case 'broadcast':
                const msg = args.slice(1).join(' ');
                await this.broadcastMessage(msg);
                return `Broadcast sent: "${msg}"`;
            
            case 'kick':
                const targetId = args[1];
                const kickReason = args.slice(2).join(' ') || 'Kicked by admin';
                const kicked = await this.kickPlayer(targetId, kickReason);
                return kicked ? `Player ${targetId} kicked` : `Player ${targetId} not found`;
            
            case 'save':
                await this.saveAllPlayers();
                return 'All players saved';
            
            case 'reload':
                if (args[1] === 'world') {
                    await this.world.loadRooms();
                    return 'World reloaded';
                }
                return 'Usage: reload world';
            
            case 'stats':
                return `Server Stats:
- Active Players: ${this.players.size}
- Total Rooms: ${this.world.rooms?.size || 0}
- Total NPCs: ${this.world.npcs?.size || 0}
- Total Items: ${this.world.items?.size || 0}
- Uptime: ${Math.floor(process.uptime())} seconds`;
            
            default:
                return `Unknown command: ${cmd}. Available: players, broadcast, kick, save, reload, stats`;
        }
    }

    initializeAICharacterController(socketHandler) {
        if (!this.aiCharacterController && socketHandler) {
            this.aiCharacterController = new AICharacterController(this.world, socketHandler);
            GameLogger.info('AI Character Controller initialized');
        }
    }

    shutdown() {
        GameLogger.gameEvent('engine_shutdown_start');
        this.running = false;
        this.saveAllPlayers();
        if (this.aiCharacterController) {
            // AI Character Controller doesn't have a shutdown method, but we should clear active characters
            this.aiCharacterController = null;
        }
        GameLogger.gameEvent('engine_shutdown_complete');
    }
}

module.exports = GameEngine;