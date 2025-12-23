/**
 * Mudlands Graphical Client
 * Hybrid text/visual MUD client using Phaser.js
 * Version 3.0 - Graphics Overhaul with modular renderers
 */

class GameState {
    constructor() {
        this.socket = null;
        this.playerData = null;
        this.currentRoom = null;
        this.isConnected = false;
        this.gameScene = null;

        // Renderers (initialized in scene create)
        this.roomRenderer = null;
        this.entityRenderer = null;
        this.animationManager = null;

        // Containers
        this.roomContainer = null;
        this.npcsContainer = null;
        this.monstersContainer = null;
        this.playersContainer = null;
        this.playerContainer = null;

        // Mini-map
        this.miniMap = new MiniMap();
        this.miniMap.load();
    }
}

const gameState = new GameState();

// Phaser Game Configuration
const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 600,
    parent: 'phaser-game',
    backgroundColor: '#1a1a2e',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

function preload() {
    console.log('Preloading...');
    // Create particle texture
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(2, 2, 2);
    graphics.generateTexture('particle', 4, 4);
    graphics.destroy();
}

function create() {
    const scene = this;
    gameState.gameScene = scene;

    // Initialize renderers
    gameState.roomRenderer = new RoomRenderer(scene);
    gameState.entityRenderer = new EntityRenderer(scene);
    gameState.animationManager = new AnimationManager(scene);

    // Create base background with gradient
    const bgGraphics = scene.add.graphics();
    bgGraphics.fillGradientStyle(0x0a0a1e, 0x0a0a1e, 0x1a1a2e, 0x1a1a2e, 1);
    bgGraphics.fillRect(0, 0, 1200, 600);

    // Add vignette effect
    const vignette = scene.add.graphics();
    vignette.fillStyle(0x000000, 0.3);
    for (let r = 800; r > 200; r -= 50) {
        vignette.fillCircle(600, 300, r);
    }
    vignette.setBlendMode(Phaser.BlendModes.MULTIPLY);

    // Create layer containers (order matters for z-depth)
    gameState.roomContainer = scene.add.container(0, 0);
    gameState.monstersContainer = scene.add.container(0, 0);
    gameState.npcsContainer = scene.add.container(0, 0);
    gameState.playersContainer = scene.add.container(0, 0);
    gameState.playerContainer = scene.add.container(0, 0);

    // Create ambient particles
    createAmbientParticles(scene);

    // Room title
    gameState.roomTitle = scene.add.text(600, 30, '', {
        fontSize: '28px',
        fill: '#00ffff',
        fontFamily: 'Courier New',
        stroke: '#000',
        strokeThickness: 4
    }).setOrigin(0.5);

    // Room description (below title)
    gameState.roomDesc = scene.add.text(600, 55, '', {
        fontSize: '12px',
        fill: '#888888',
        fontFamily: 'Courier New',
        stroke: '#000',
        strokeThickness: 2,
        wordWrap: { width: 600 }
    }).setOrigin(0.5);

    // Instruction text
    scene.add.text(600, 575, 'Use text commands below to interact', {
        fontSize: '12px',
        fill: '#444',
        fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Create graphical mini-map overlay
    createMiniMapOverlay(scene);

    console.log('Game scene created with modular renderers');
}

function update(time, delta) {
    // Particle and animation updates happen automatically via Phaser
}

function createAmbientParticles(scene) {
    try {
        const particles = scene.add.particles(0, 0, 'particle', {
            x: { min: 0, max: 1200 },
            y: { min: -10, max: 0 },
            lifespan: 10000,
            speedY: { min: 5, max: 20 },
            speedX: { min: -5, max: 5 },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 0.2, end: 0 },
            blendMode: 'ADD',
            frequency: 300,
            quantity: 1
        });
    } catch (e) {
        console.log('Particle system not available:', e.message);
    }
}

function createMiniMapOverlay(scene) {
    const mapX = 1050;
    const mapY = 50;
    const mapWidth = 140;
    const mapHeight = 100;

    // Background
    const mapBg = scene.add.graphics();
    mapBg.fillStyle(0x000000, 0.7);
    mapBg.fillRoundedRect(mapX - mapWidth/2, mapY, mapWidth, mapHeight, 8);
    mapBg.lineStyle(1, 0x00ff00, 0.5);
    mapBg.strokeRoundedRect(mapX - mapWidth/2, mapY, mapWidth, mapHeight, 8);

    // Title
    scene.add.text(mapX, mapY + 10, 'MAP', {
        fontSize: '10px',
        fill: '#00ff00',
        fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Map content container
    gameState.miniMapContainer = scene.add.container(mapX - mapWidth/2 + 10, mapY + 25);

    // Initial render
    renderGraphicalMiniMap(scene);
}

function renderGraphicalMiniMap(scene) {
    if (!gameState.miniMapContainer) return;

    gameState.miniMapContainer.removeAll(true);

    const nodeSize = 8;
    const spacing = 15;
    const centerX = 60;
    const centerY = 30;

    // Get current room position as center
    const currentPos = gameState.miniMap.roomPositions.get(gameState.miniMap.currentRoomId) || { x: 0, y: 0 };

    // Draw discovered rooms
    for (const [roomId, room] of gameState.miniMap.discoveredRooms) {
        const pos = gameState.miniMap.roomPositions.get(roomId);
        if (!pos) continue;

        const screenX = centerX + (pos.x - currentPos.x) * spacing;
        const screenY = centerY + (pos.y - currentPos.y) * spacing;

        // Only draw if in visible area
        if (screenX < 0 || screenX > 120 || screenY < 0 || screenY > 60) continue;

        // Draw connections first
        for (const direction of Object.keys(room.exits)) {
            drawMiniMapConnection(scene, screenX, screenY, direction, spacing / 2);
        }

        // Draw room node
        const color = roomId === gameState.miniMap.currentRoomId
            ? 0x00ff00  // Current room - bright green
            : room.properties?.safe
                ? 0x4488aa  // Safe room - blue
                : 0x884444; // Dangerous - red

        const node = scene.add.circle(screenX, screenY, nodeSize / 2, color, 1);
        gameState.miniMapContainer.add(node);

        // Pulse effect for current room
        if (roomId === gameState.miniMap.currentRoomId) {
            const pulse = scene.add.circle(screenX, screenY, nodeSize, 0x00ff00, 0.3);
            pulse.setBlendMode(Phaser.BlendModes.ADD);
            gameState.miniMapContainer.add(pulse);

            scene.tweens.add({
                targets: pulse,
                scale: 1.5,
                alpha: 0,
                duration: 1000,
                repeat: -1
            });
        }
    }
}

function drawMiniMapConnection(scene, x, y, direction, length) {
    const offsets = {
        north: { dx: 0, dy: -1 },
        south: { dx: 0, dy: 1 },
        east: { dx: 1, dy: 0 },
        west: { dx: -1, dy: 0 }
    };

    const offset = offsets[direction];
    if (!offset) return;

    const line = scene.add.graphics();
    line.lineStyle(1, 0x444444, 0.5);
    line.lineBetween(x, y, x + offset.dx * length, y + offset.dy * length);
    gameState.miniMapContainer.add(line);
}

function renderRoom(roomData) {
    if (!gameState.gameScene) return;

    const scene = gameState.gameScene;

    // Clear previous content
    gameState.roomContainer.removeAll(true);
    gameState.npcsContainer.removeAll(true);
    gameState.monstersContainer.removeAll(true);
    gameState.playersContainer.removeAll(true);
    gameState.entityRenderer.clearAll();

    // Render room using RoomRenderer
    const roomContainer = gameState.roomRenderer.render(roomData);
    if (roomContainer) {
        // Move room graphics to our container
        const children = roomContainer.getAll();
        children.forEach(child => {
            roomContainer.remove(child);
            gameState.roomContainer.add(child);
        });
    }

    // Update room title and description
    if (gameState.roomTitle) {
        gameState.roomTitle.setText(roomData.name || 'Unknown Room');
    }
    if (gameState.roomDesc) {
        const shortDesc = (roomData.description || '').substring(0, 80);
        gameState.roomDesc.setText(shortDesc + (roomData.description?.length > 80 ? '...' : ''));
    }

    // Render NPCs
    if (roomData.npcs && roomData.npcs.length > 0) {
        roomData.npcs.forEach((npc, index) => {
            const x = 250 + (index * 180);
            const y = 350;
            const npcContainer = gameState.entityRenderer.createNPC(x, y, npc);
            gameState.npcsContainer.add(npcContainer);

            // Add idle animation
            gameState.animationManager.addIdleAnimation(`npc_${npc.id || index}`, npcContainer);
        });
    }

    // Render monsters
    if (roomData.monsters && roomData.monsters.length > 0) {
        roomData.monsters.forEach((monster, index) => {
            const x = 800 + (index * 150);
            const y = 320;
            const monsterContainer = gameState.entityRenderer.createMonster(x, y, monster);
            gameState.monstersContainer.add(monsterContainer);

            // Add idle animation (more aggressive)
            gameState.animationManager.addIdleAnimation(`monster_${monster.id || index}`, monsterContainer);
        });
    }

    // Render other players
    if (roomData.players && roomData.players.length > 0) {
        roomData.players.forEach((player, index) => {
            // Skip self
            if (player.id === gameState.playerData?.id) return;

            const x = 450 + (index * 120);
            const y = 400;
            const playerContainer = gameState.entityRenderer.createOtherPlayer(x, y, player);
            gameState.playersContainer.add(playerContainer);

            gameState.animationManager.addIdleAnimation(`player_${player.id}`, playerContainer);
        });
    }

    // Render player (always centered)
    renderPlayer();

    // Update mini-map
    gameState.miniMap.discoverRoom(roomData.id, roomData);
    gameState.miniMap.setCurrentRoom(roomData.id);
    gameState.miniMap.save();
    renderGraphicalMiniMap(scene);
}

function renderPlayer() {
    gameState.playerContainer.removeAll(true);

    const x = 600;
    const y = 450;

    const playerContainer = gameState.entityRenderer.createPlayer(x, y, gameState.playerData || {});

    // Move to our container
    const children = playerContainer.getAll();
    children.forEach(child => {
        playerContainer.remove(child);
        gameState.playerContainer.add(child);
    });

    // Add idle animation
    gameState.animationManager.addIdleAnimation('player', gameState.playerContainer);
}

// Socket.io connection
function initializeSocket() {
    gameState.socket = io();

    gameState.socket.on('connect', () => {
        console.log('Connected to server');
        gameState.isConnected = true;
        updateConnectionStatus(true);

        // Auto-authenticate as guest
        const guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
        console.log('Authenticating as guest:', guestId);
        gameState.socket.emit('authenticate', {
            guest: true,
            playerId: guestId
        });
    });

    gameState.socket.on('authenticated', (data) => {
        console.log('Authenticated successfully:', data);
        gameState.playerData = data.player;
        displayMessage(`Logged in as ${data.player.name}`, 'success');

        // Request initial room data
        gameState.socket.emit('command', { command: 'look' });
    });

    gameState.socket.on('disconnect', () => {
        console.log('Disconnected from server');
        gameState.isConnected = false;
        updateConnectionStatus(false);
    });

    gameState.socket.on('message', (data) => {
        displayMessage(data.text || data.message, data.type);
    });

    gameState.socket.on('roomUpdate', (data) => {
        console.log('Room update:', data);
        gameState.currentRoom = data;
        renderRoom(data);
    });

    gameState.socket.on('playerData', (data) => {
        console.log('Player data:', data);
        gameState.playerData = data;
    });

    gameState.socket.on('playerUpdate', (data) => {
        console.log('Player update:', data);
        if (gameState.playerData) {
            Object.assign(gameState.playerData, data);
        }
    });

    gameState.socket.on('combatUpdate', (data) => {
        console.log('Combat update:', data);
        handleCombatUpdate(data);
    });
}

function handleCombatUpdate(data) {
    // Visual feedback for combat
    if (data.type === 'attack' && gameState.animationManager) {
        const attackerContainer = gameState.entityRenderer.getEntity(data.attackerId);
        const targetContainer = gameState.entityRenderer.getEntity(data.targetId);

        if (attackerContainer && targetContainer) {
            gameState.animationManager.playAttackAnimation(attackerContainer, targetContainer);
            gameState.animationManager.playDamageFlash(targetContainer);
        }
    }

    if (data.type === 'death') {
        const targetContainer = gameState.entityRenderer.getEntity(data.targetId);
        if (targetContainer) {
            gameState.animationManager.playDeathAnimation(targetContainer);
        }
    }

    if (data.type === 'levelUp') {
        gameState.animationManager.playLevelUpEffect(gameState.playerContainer);
    }
}

// Text interface functions
function displayMessage(message, type = 'normal') {
    const outputArea = document.getElementById('output-area');
    if (!outputArea) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    // Parse and display
    const parsed = parseAnsiColors(message);
    messageDiv.innerHTML = parsed;

    outputArea.appendChild(messageDiv);
    outputArea.scrollTop = outputArea.scrollHeight;
}

function parseAnsiColors(text) {
    if (!text) return '';
    return text
        .replace(/\[0m/g, '</span>')
        .replace(/\[31m/g, '<span class="error">')
        .replace(/\[32m/g, '<span class="success">')
        .replace(/\[33m/g, '<span class="npc-text">')
        .replace(/\[36m/g, '<span class="room-name">')
        .replace(/\n/g, '<br>');
}

function sendCommand(command) {
    if (!gameState.isConnected || !gameState.socket) {
        displayMessage('Not connected to server', 'error');
        return;
    }

    if (!command.trim()) return;

    displayMessage(`> ${command}`, 'info');
    gameState.socket.emit('command', { command: command });
}

function updateConnectionStatus(connected) {
    const status = document.getElementById('connection-status');
    if (!status) return;

    if (connected) {
        status.textContent = 'Connected';
        status.className = 'connected';
    } else {
        status.textContent = 'Disconnected';
        status.className = 'disconnected';
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing graphical client v3.0...');

    initializeSocket();

    const commandInput = document.getElementById('command-input');
    if (commandInput) {
        commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const command = commandInput.value;
                sendCommand(command);
                commandInput.value = '';
            }
        });
        commandInput.focus();
    }

    displayMessage('Welcome to Mudlands Online - Graphical Client v3.0', 'success');
    displayMessage('Connecting to server...', 'info');
});
