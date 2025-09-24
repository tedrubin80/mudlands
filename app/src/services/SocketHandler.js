const chalk = require('chalk');
const jwt = require('jsonwebtoken');
const Player = require('../models/Player');
const db = require('../config/database');
const GameLogger = require('../utils/logger');
const tokenBlacklist = require('../utils/tokenBlacklist');

class SocketHandler {
    constructor(io, gameEngine, commandParser) {
        this.io = io;
        this.gameEngine = gameEngine;
        this.commandParser = commandParser;
        this.socketToPlayer = new Map();
        
        // Rate limiting for socket commands
        this.commandRateLimits = new Map();
        this.maxCommandsPerMinute = 60; // 1 command per second average
        this.rateLimitWindowMs = 60000; // 1 minute window
        
        this.setupGameEngineListeners();
    }

    setupGameEngineListeners() {
        this.gameEngine.on('messageToPlayer', ({ playerId, message }) => {
            const socket = this.getSocketByPlayerId(playerId);
            if (socket) {
                socket.emit('message', { text: message, type: 'game' });
            }
        });

        this.gameEngine.on('playerUpdate', (player) => {
            const socket = this.getSocketByPlayerId(player.id);
            if (socket) {
                socket.emit('playerUpdate', {
                    hp: player.currentHp,
                    maxHp: player.maxHp,
                    mp: player.currentMp,
                    maxMp: player.maxMp,
                    level: player.level,
                    experience: player.experience,
                    expToNext: player.getExpToNextLevel()
                });
            }
        });

        this.gameEngine.on('playerJoinedRoom', ({ player, room }) => {
            const message = chalk.gray(`${player.name} has arrived.`);
            this.gameEngine.broadcastToRoom(room.id, message, player.id);
        });

        this.gameEngine.on('playerLeftRoom', ({ player, room }) => {
            const message = chalk.gray(`${player.name} has left.`);
            this.gameEngine.broadcastToRoom(room.id, message, player.id);
        });

        this.gameEngine.on('playerMoved', ({ player, from, to, direction }) => {
            const leaveMessage = chalk.gray(`${player.name} leaves ${direction}.`);
            this.gameEngine.broadcastToRoom(from.id, leaveMessage, player.id);
            
            const arriveMessage = chalk.gray(`${player.name} arrives from the ${this.getOppositeDirection(direction)}.`);
            this.gameEngine.broadcastToRoom(to.id, arriveMessage, player.id);
        });
    }

    handleConnection(socket) {
        GameLogger.connection(socket.id, 'connected');

        socket.on('authenticate', (data) => this.handleAuthenticate(socket, data));
        socket.on('command', (data) => this.handleCommand(socket, data));
        socket.on('disconnect', () => this.handleDisconnect(socket));
        socket.on('ping', () => socket.emit('pong'));

        socket.emit('connected', { 
            message: 'Welcome to MUDlands Online!',
            version: '1.0.0'
        });
    }

    async handleAuthenticate(socket, { token, playerId, guest }) {
        try {
            let player;
            
            if (guest) {
                // Handle guest login
                player = new Player({
                    id: playerId,
                    name: `Guest_${playerId.slice(-4)}`,
                    level: 1,
                    location: 'town_square'
                });
            } else {
                // Validate JWT token
                if (!token) {
                    socket.emit('authError', { message: 'Authentication token required' });
                    return;
                }
                
                let decoded;
                try {
                    decoded = jwt.verify(token, process.env.JWT_SECRET);
                    
                    // Check if token is blacklisted
                    if (decoded.jti && tokenBlacklist.isBlacklisted(decoded.jti)) {
                        socket.emit('authError', { message: 'Token has been revoked' });
                        return;
                    }
                } catch (error) {
                    socket.emit('authError', { message: 'Invalid or expired token' });
                    return;
                }
                
                // Load player from database
                const playerData = await db.loadPlayer(decoded.id);
                if (!playerData) {
                    socket.emit('authError', { message: 'Player not found' });
                    return;
                }
                
                player = new Player(playerData);
            }

            this.socketToPlayer.set(socket.id, player);
            player.socketId = socket.id;
            
            this.gameEngine.addPlayer(player);

            socket.emit('authenticated', {
                player: {
                    id: player.id,
                    name: player.name,
                    level: player.level,
                    className: player.className,
                    stats: player.stats,
                    location: player.location
                }
            });

            const lookResult = this.commandParser.parse('look', player);
            if (lookResult.success) {
                socket.emit('message', { 
                    text: lookResult.message, 
                    type: 'room' 
                });
            }

            socket.emit('message', { 
                text: chalk.green(`Welcome back, ${player.name}!`), 
                type: 'system' 
            });

        } catch (error) {
            GameLogger.error('Authentication failed', error, { socketId: socket.id });
            socket.emit('authError', { message: 'Authentication failed' });
        }
    }

    // Rate limiting check for commands
    checkRateLimit(socketId) {
        const now = Date.now();
        const limits = this.commandRateLimits.get(socketId) || { count: 0, resetTime: now + this.rateLimitWindowMs };
        
        // Reset counter if window has expired
        if (now > limits.resetTime) {
            limits.count = 0;
            limits.resetTime = now + this.rateLimitWindowMs;
        }
        
        // Check if limit exceeded
        if (limits.count >= this.maxCommandsPerMinute) {
            return false;
        }
        
        // Increment counter and save
        limits.count++;
        this.commandRateLimits.set(socketId, limits);
        return true;
    }

    handleCommand(socket, { command }) {
        // Rate limiting check
        if (!this.checkRateLimit(socket.id)) {
            socket.emit('message', { 
                text: chalk.red('Rate limit exceeded. Please slow down your commands.'), 
                type: 'error' 
            });
            return;
        }

        const player = this.socketToPlayer.get(socket.id);
        
        if (!player) {
            socket.emit('message', { 
                text: 'You must be authenticated to use commands.', 
                type: 'error' 
            });
            return;
        }

        const result = this.commandParser.parse(command, player);
        
        if (result.message) {
            socket.emit('message', { 
                text: result.message, 
                type: result.success ? 'game' : 'error' 
            });
        }

        if (result.action === 'quit') {
            this.handleDisconnect(socket);
        }
    }

    async handleDisconnect(socket) {
        const player = this.socketToPlayer.get(socket.id);
        
        if (player) {
            await this.gameEngine.removePlayer(player.id);
            this.socketToPlayer.delete(socket.id);
            GameLogger.connection(socket.id, 'disconnected', player.name);
        } else {
            GameLogger.connection(socket.id, 'disconnected');
        }
        
        // Clean up rate limiting data
        this.commandRateLimits.delete(socket.id);
    }

    getSocketByPlayerId(playerId) {
        for (const [socketId, player] of this.socketToPlayer) {
            if (player.id === playerId) {
                return this.io.sockets.sockets.get(socketId);
            }
        }
        return null;
    }

    getOppositeDirection(direction) {
        const opposites = {
            north: 'south',
            south: 'north',
            east: 'west',
            west: 'east',
            up: 'below',
            down: 'above'
        };
        return opposites[direction] || 'unknown direction';
    }
}

module.exports = SocketHandler;