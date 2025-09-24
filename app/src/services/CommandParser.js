const chalk = require('chalk');
const StoryGenerator = require('../tools/StoryGenerator');
const ValidationUtils = require('../utils/validation');
const GameLogger = require('../utils/logger');
const AdminCommands = require('./AdminCommands');
const ClassManager = require('./ClassManager');
const CraftingCommands = require('../commands/CraftingCommands');

class CommandParser {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.commands = this.initializeCommands();
        this.aliases = this.initializeAliases();
        this.storyGenerator = new StoryGenerator();
        this.adminCommands = new AdminCommands();
        this.classManager = new ClassManager(gameEngine);
        this.craftingCommands = null; // Will be initialized after GameEngine is ready
    }

    initializeCommands() {
        return {
            look: this.handleLook.bind(this),
            l: this.handleLook.bind(this),
            examine: this.handleExamine.bind(this),
            inspect: this.handleInspect.bind(this),
            north: this.handleMove.bind(this, 'north'),
            n: this.handleMove.bind(this, 'north'),
            south: this.handleMove.bind(this, 'south'),
            s: this.handleMove.bind(this, 'south'),
            east: this.handleMove.bind(this, 'east'),
            e: this.handleMove.bind(this, 'east'),
            west: this.handleMove.bind(this, 'west'),
            w: this.handleMove.bind(this, 'west'),
            up: this.handleMove.bind(this, 'up'),
            u: this.handleMove.bind(this, 'up'),
            down: this.handleMove.bind(this, 'down'),
            d: this.handleMove.bind(this, 'down'),
            say: this.handleSay.bind(this),
            yell: this.handleYell.bind(this),
            whisper: this.handleWhisper.bind(this),
            who: this.handleWho.bind(this),
            stats: this.handleStats.bind(this),
            inventory: this.handleInventory.bind(this),
            i: this.handleInventory.bind(this),
            attack: this.handleAttack.bind(this),
            kill: this.handleAttack.bind(this),
            help: this.handleHelp.bind(this),
            save: this.handleSave.bind(this),
            quit: this.handleQuit.bind(this),
            emote: this.handleEmote.bind(this),
            me: this.handleEmote.bind(this),
            // Inventory management commands
            get: this.handleGet.bind(this),
            take: this.handleGet.bind(this),
            drop: this.handleDrop.bind(this),
            use: this.handleUse.bind(this),
            equip: this.handleEquip.bind(this),
            unequip: this.handleUnequip.bind(this),
            remove: this.handleUnequip.bind(this),
            // Shop commands
            buy: this.handleBuy.bind(this),
            sell: this.handleSell.bind(this),
            list: this.handleList.bind(this),
            browse: this.handleList.bind(this),
            // Enhanced movement commands
            northeast: this.handleMove.bind(this, 'northeast'),
            ne: this.handleMove.bind(this, 'northeast'),
            northwest: this.handleMove.bind(this, 'northwest'),
            nw: this.handleMove.bind(this, 'northwest'),
            southeast: this.handleMove.bind(this, 'southeast'),
            se: this.handleMove.bind(this, 'southeast'),
            southwest: this.handleMove.bind(this, 'southwest'),
            sw: this.handleMove.bind(this, 'southwest'),
            // Story system commands
            time: this.handleTime.bind(this),
            weather: this.handleWeather.bind(this),
            describe: this.handleDescribe.bind(this),
            gossip: this.handleGossip.bind(this),
            ask: this.handleAsk.bind(this),
            talk: this.handleTalk.bind(this),
            speak: this.handleTalk.bind(this),
            converse: this.handleTalk.bind(this),
            // Utility commands
            score: this.handleStats.bind(this),
            eq: this.handleEquipment.bind(this),
            equipment: this.handleEquipment.bind(this),
            // Dice and DM commands
            roll: this.handleRoll.bind(this),
            dice: this.handleRoll.bind(this),
            advantage: this.handleAdvantage.bind(this),
            adv: this.handleAdvantage.bind(this),
            disadvantage: this.handleDisadvantage.bind(this),
            dis: this.handleDisadvantage.bind(this),
            coin: this.handleCoinFlip.bind(this),
            flip: this.handleCoinFlip.bind(this),
            dm: this.handleDMCommand.bind(this),
            admin: this.handleAdminCommand.bind(this),
            story: this.handleStoryRoll.bind(this),
            // Quest commands
            quests: this.handleQuests.bind(this),
            quest: this.handleQuestInfo.bind(this),
            abandon: this.handleAbandonQuest.bind(this),
            objectives: this.handleObjectives.bind(this),
            // Class commands
            class: this.handleClass.bind(this),
            classes: this.handleClasses.bind(this),
            advance: this.handleAdvance.bind(this),
            skills: this.handleSkills.bind(this),
            // Crafting commands (will be enabled after initialization)
            craft: this.handleCraft.bind(this),
            recipes: this.handleCraft.bind(this),
            forge: this.handleCraft.bind(this),
            brew: this.handleCraft.bind(this),
            enchant: this.handleCraft.bind(this),
            // Additional aliases for convenience
            inv: this.handleInventory.bind(this),
            eq: this.handleEquipment.bind(this),
            st: this.handleStats.bind(this),
            hp: this.handleStats.bind(this),
            health: this.handleStats.bind(this),
            mana: this.handleStats.bind(this),
            mp: this.handleStats.bind(this),
            wield: this.handleEquip.bind(this),
            wear: this.handleEquip.bind(this),
            grab: this.handleGet.bind(this),
            pick: this.handleGet.bind(this),
            pickup: this.handleGet.bind(this),
            '': this.handleLook.bind(this),
            // Combat aliases
            k: this.handleAttack.bind(this),
            fight: this.handleAttack.bind(this),
            slay: this.handleAttack.bind(this),
            // Communication aliases
            '\'': this.handleSay.bind(this),
            '"': this.handleSay.bind(this),
            chat: this.handleSay.bind(this),
            shout: this.handleYell.bind(this),
            scream: this.handleYell.bind(this),
            whisp: this.handleWhisper.bind(this),
            // Movement shortcuts
            go: this.handleGo.bind(this),
            enter: this.handleGo.bind(this),
            exit: this.handleGo.bind(this),
            leave: this.handleGo.bind(this),
            // Quality of life commands
            whereis: this.handleWhereis.bind(this),
            find: this.handleFind.bind(this),
            search: this.handleSearch.bind(this),
            scan: this.handleScan.bind(this),
            compare: this.handleCompare.bind(this),
            value: this.handleValue.bind(this),
            worth: this.handleValue.bind(this),
            repair: this.handleRepair.bind(this),
            fix: this.handleRepair.bind(this),
            rest: this.handleRest.bind(this),
            sleep: this.handleRest.bind(this),
            recall: this.handleRecall.bind(this),
            home: this.handleRecall.bind(this),
            teleport: this.handleRecall.bind(this),
            // Social commands
            follow: this.handleFollow.bind(this),
            unfollow: this.handleUnfollow.bind(this),
            group: this.handleGroup.bind(this),
            party: this.handleGroup.bind(this),
            ignore: this.handleIgnore.bind(this),
            unignore: this.handleUnignore.bind(this)
        };
    }

    initializeAliases() {
        return {
            '\'': 'say',
            '"': 'say',
            ':': 'emote',
            ';': 'emote',
            '!': 'yell',
            '.': 'whisper'
        };
    }

    parse(input, player) {
        if (!input || !input.trim()) {
            return { success: false, message: '' };
        }

        // Validate and sanitize input
        const validation = ValidationUtils.validateCommand(input);
        if (!validation.isValid) {
            return { success: false, message: validation.message };
        }

        const trimmedInput = validation.sanitized;
        let command, args;

        const aliasChar = trimmedInput[0];
        if (this.aliases[aliasChar]) {
            command = this.aliases[aliasChar];
            args = trimmedInput.substring(1).trim();
        } else {
            const parts = trimmedInput.split(' ');
            command = parts[0].toLowerCase();
            args = parts.slice(1).join(' ');
        }

        if (this.commands[command]) {
            try {
                return this.commands[command](player, args);
            } catch (error) {
                GameLogger.error('Command execution failed', error, { 
                    command, 
                    playerId: player?.id, 
                    playerName: player?.name 
                });
                return { 
                    success: false, 
                    message: 'An error occurred while executing that command.' 
                };
            }
        }

        return { 
            success: false, 
            message: `Unknown command: ${command}. Type 'help' for a list of commands.` 
        };
    }

    handleLook(player, args) {
        const room = this.gameEngine.world.getRoom(player.location);
        if (!room) {
            return { success: false, message: 'You are in a void.' };
        }

        let output = [];
        output.push(chalk.cyan.bold(room.name));
        output.push(chalk.white(room.description));
        
        const exits = room.getExitList();
        if (exits.length > 0) {
            output.push(chalk.yellow(`Exits: ${exits.join(', ')}`));
        }

        const players = room.getPlayers().filter(p => p.id !== player.id);
        if (players.length > 0) {
            output.push(chalk.green('Players here:'));
            players.forEach(p => {
                output.push(chalk.green(`  - ${p.name}`));
            });
        }

        const monsters = room.getMonsters();
        if (monsters.length > 0) {
            output.push(chalk.red('Monsters here:'));
            monsters.forEach(m => {
                output.push(chalk.red(`  - ${m.name} (Level ${m.level})`));
            });
        }

        const items = room.getItems();
        if (items.length > 0) {
            output.push(chalk.magenta('Items here:'));
            items.forEach(item => {
                output.push(chalk.magenta(`  - ${item.name}`));
            });
        }

        return { success: true, message: output.join('\n') };
    }

    handleExamine(player, target) {
        if (!target) {
            return { success: false, message: 'Examine what?' };
        }

        const room = this.gameEngine.world.getRoom(player.location);
        if (!room) {
            return { success: false, message: 'You are in a void.' };
        }

        const item = room.findItem(target);
        if (item) {
            const description = item.getDetailedDescription ? 
                item.getDetailedDescription(player) : 
                `${item.name}\n${item.description}`;
            return { 
                success: true, 
                message: chalk.cyan(description)
            };
        }

        const monster = room.findMonster(target);
        if (monster) {
            let health = Math.round((monster.currentHp / monster.maxHp) * 100);
            let healthColor = health > 66 ? chalk.green : health > 33 ? chalk.yellow : chalk.red;
            return { 
                success: true, 
                message: `${chalk.red.bold(monster.name)} (Level ${monster.level})\n${monster.description}\nHealth: ${healthColor(health + '%')}` 
            };
        }

        const targetPlayer = room.findPlayer(target);
        if (targetPlayer) {
            return { 
                success: true, 
                message: `${chalk.green.bold(targetPlayer.name)} (Level ${targetPlayer.level})\n${targetPlayer.description || 'A fellow adventurer.'}` 
            };
        }

        return { success: false, message: `You don't see '${target}' here.` };
    }

    handleMove(direction, player) {
        const result = this.gameEngine.movePlayer(player, direction);
        
        if (result.success) {
            const lookResult = this.handleLook(player, '');
            return { 
                success: true, 
                message: result.message + '\n\n' + lookResult.message 
            };
        }
        
        return result;
    }

    handleSay(player, message) {
        if (!message) {
            return { success: false, message: 'Say what?' };
        }

        // Sanitize chat message
        const sanitizedMessage = ValidationUtils.sanitizeMessage(message);
        if (!sanitizedMessage) {
            return { success: false, message: 'Message cannot be empty' };
        }

        const room = this.gameEngine.world.getRoom(player.location);
        if (!room) {
            return { success: false, message: 'Your voice echoes in the void.' };
        }

        this.gameEngine.broadcastToRoom(
            player.location,
            chalk.white(`${player.name} says: "${sanitizedMessage}"`),
            player.id
        );

        return { 
            success: true, 
            message: chalk.white(`You say: "${sanitizedMessage}"`) 
        };
    }

    handleYell(player, message) {
        if (!message) {
            return { success: false, message: 'Yell what?' };
        }

        const sanitizedMessage = ValidationUtils.sanitizeMessage(message);
        if (!sanitizedMessage) {
            return { success: false, message: 'Message cannot be empty' };
        }

        this.gameEngine.broadcastToAll(
            chalk.yellow.bold(`${player.name} yells: "${sanitizedMessage.toUpperCase()}"`),
            player.id
        );

        return { 
            success: true, 
            message: chalk.yellow.bold(`You yell: "${sanitizedMessage.toUpperCase()}"`) 
        };
    }

    handleWhisper(player, args) {
        const parts = args.split(' ');
        if (parts.length < 2) {
            return { success: false, message: 'Usage: whisper <player> <message>' };
        }

        const targetName = ValidationUtils.sanitizeText(parts[0], 20);
        const message = ValidationUtils.sanitizeMessage(parts.slice(1).join(' '));
        
        if (!message) {
            return { success: false, message: 'Message cannot be empty' };
        }

        const targetPlayer = Array.from(this.gameEngine.players.values())
            .find(p => p.name.toLowerCase() === targetName.toLowerCase());

        if (!targetPlayer) {
            return { success: false, message: `Player '${targetName}' not found.` };
        }

        if (targetPlayer.id === player.id) {
            return { success: false, message: "You can't whisper to yourself." };
        }

        this.gameEngine.emit('messageToPlayer', {
            playerId: targetPlayer.id,
            message: chalk.magenta(`${player.name} whispers: "${message}"`)
        });

        return { 
            success: true, 
            message: chalk.magenta(`You whisper to ${targetPlayer.name}: "${message}"`) 
        };
    }

    handleWho(player) {
        const players = Array.from(this.gameEngine.players.values());
        
        if (players.length === 0) {
            return { success: true, message: 'No players online.' };
        }

        let output = [chalk.cyan.bold(`Players Online (${players.length}):`)];
        players.forEach(p => {
            const room = this.gameEngine.world.getRoom(p.location);
            const location = room ? room.name : 'Unknown';
            output.push(chalk.white(`  ${p.name} (Level ${p.level}) - ${location}`));
        });

        return { success: true, message: output.join('\n') };
    }

    handleStats(player) {
        let output = [];
        output.push(chalk.cyan.bold(`=== ${player.name} ===`));
        output.push(chalk.white(`Level: ${player.level} (${player.experience}/${player.getExpToNextLevel()} XP)`));
        output.push(chalk.white(`Class: ${player.className}`));
        output.push(chalk.red(`HP: ${player.currentHp}/${player.maxHp}`));
        output.push(chalk.blue(`MP: ${player.currentMp}/${player.maxMp}`));
        output.push(chalk.yellow('--- Stats ---'));
        output.push(chalk.white(`STR: ${player.stats.str}  AGI: ${player.stats.agi}  VIT: ${player.stats.vit}`));
        output.push(chalk.white(`INT: ${player.stats.int}  DEX: ${player.stats.dex}  LUK: ${player.stats.luk}`));
        output.push(chalk.yellow(`Stat Points: ${player.statPoints}`));
        output.push(chalk.yellow(`Skill Points: ${player.skillPoints}`));

        return { success: true, message: output.join('\n') };
    }

    handleInventory(player) {
        if (!player.inventory || player.inventory.length === 0) {
            return { success: true, message: 'Your inventory is empty.' };
        }

        let output = [chalk.cyan.bold('=== Inventory ===')];
        player.inventory.forEach((item, index) => {
            output.push(chalk.white(`${index + 1}. ${item.name} ${item.quantity > 1 ? `(${item.quantity})` : ''}`));
        });

        return { success: true, message: output.join('\n') };
    }

    handleAttack(player, target) {
        if (!target) {
            return { success: false, message: 'Attack what?' };
        }

        const room = this.gameEngine.world.getRoom(player.location);
        if (!room) {
            return { success: false, message: 'You are in a void.' };
        }

        const monster = room.findMonster(target);
        if (!monster) {
            return { success: false, message: `You don't see '${target}' here.` };
        }

        const result = this.gameEngine.combatSystem.initiateAttack(player, monster);
        return result;
    }

    handleHelp(player, command) {
        if (!command) {
            let output = [];
            output.push(chalk.cyan.bold('=== Available Commands ==='));
            output.push(chalk.yellow('Movement:') + ' north/n, south/s, east/e, west/w, up/u, down/d, ne, nw, se, sw');
            output.push(chalk.yellow('Interaction:') + ' look/l, examine <target>, attack/kill <target>, describe');
            output.push(chalk.yellow('Info:') + ' stats/score, inventory/i, equipment/eq, who, time, weather');
            output.push(chalk.yellow('Inventory:') + ' get/take <item>, drop <item>, use <item>, equip <item>, unequip <slot>');
            output.push(chalk.yellow('Communication:') + ' say "<message>", yell "<message>", whisper <player> <message>');
            output.push(chalk.yellow('Social:') + ' emote/me <action>, gossip, ask <topic>, talk/speak <npc> [topic]');
            output.push(chalk.yellow('Quests:') + ' quests, quest <name>, objectives, abandon <quest>');
            output.push(chalk.yellow('Classes:') + ' class, classes, advance <class>, skills');
            output.push(chalk.yellow('Dice & DM:') + ' roll [dice], advantage/adv [dice], disadvantage/dis [dice], story [dice], coin/flip, dm <command>');
            output.push(chalk.yellow('Utility:') + ' help [command], save, quit');
            output.push('');
            output.push(chalk.cyan('Examples:'));
            output.push('  ' + chalk.white('roll 1d20+3') + ' - Roll a 20-sided die with +3 modifier');
            output.push('  ' + chalk.white('advantage 1d20') + ' - Roll twice, take higher (with story outcome)');
            output.push('  ' + chalk.white('story') + ' - Make a story roll that generates narrative events');
            output.push('  ' + chalk.white('dm npc merchant') + ' - Generate a merchant NPC');
            output.push('  ' + chalk.white('say "Hello everyone!"') + ' - Say something to everyone in the room');
            output.push('  ' + chalk.white('emote waves to everyone') + ' - Perform an emote action');
            output.push('');
            output.push(chalk.green('Type') + ' ' + chalk.white('help <command>') + ' ' + chalk.green('for specific help on a command'));
            
            return { success: true, message: output.join('\n') };
        }

        const helpTexts = {
            look: 'look/l - Examines your current location, showing the room description, exits, players, monsters, and items.',
            examine: 'examine <target> - Provides detailed information about a specific target (player, monster, or item).',
            say: 'say <message> - Sends a message to all players in the same room. Can also use \' or " as a shortcut.',
            whisper: 'whisper <player> <message> - Sends a private message to a specific player.',
            attack: 'attack/kill <target> - Initiates combat with a monster in your current room.',
            stats: 'stats - Displays your character\'s current statistics, level, and experience.',
            inventory: 'inventory/i - Shows all items in your inventory.',
            equipment: 'equipment/eq - Shows your currently equipped items.',
            emote: 'emote/me <action> - Performs an emotive action. Can also use : as a shortcut.',
            get: 'get/take <item> - Picks up an item from the ground and adds it to your inventory.',
            drop: 'drop <item> - Drops an item from your inventory onto the ground.',
            use: 'use <item> - Uses a consumable item from your inventory (potions, food, etc.).',
            equip: 'equip <item> - Equips an item from your inventory (weapons, armor, etc.).',
            unequip: 'unequip <slot> - Unequips an item from the specified slot (weapon, armor, helmet, boots, accessory).',
            class: 'class - Shows detailed information about your current class, bonuses, and advancement progress.',
            classes: 'classes - Lists all available class advancements you can choose from.',
            advance: 'advance <class> - Advance to a new class. Use "classes" first to see available options.',
            skills: 'skills - Shows your learned skills and available skill trees for your class.'
        };

        const text = helpTexts[command.toLowerCase()];
        if (text) {
            return { success: true, message: chalk.cyan(text) };
        }

        return { success: false, message: `No help available for '${command}'.` };
    }

    handleSave(player) {
        player.save();
        return { success: true, message: chalk.green('Your progress has been saved.') };
    }

    handleQuit(player) {
        return { 
            success: true, 
            message: chalk.yellow('Goodbye! Your progress has been saved.'),
            action: 'quit'
        };
    }

    handleEmote(player, action) {
        if (!action) {
            return { success: false, message: 'What do you want to do?' };
        }

        const room = this.gameEngine.world.getRoom(player.location);
        if (!room) {
            return { success: false, message: 'You emote into the void.' };
        }

        const message = chalk.italic(`${player.name} ${action}`);
        this.gameEngine.broadcastToRoom(player.location, message, player.id);

        return { 
            success: true, 
            message: chalk.italic(`You ${action}`) 
        };
    }

    handleTime(player) {
        const times = [
            'early morning', 'late morning', 'midday', 'early afternoon', 
            'late afternoon', 'early evening', 'late evening', 'midnight'
        ];
        const currentTime = this.storyGenerator.randomChoice(times);
        
        return { 
            success: true, 
            message: chalk.yellow(`It is currently ${currentTime}.`) 
        };
    }

    handleWeather(player) {
        const weather = [
            'clear skies with gentle sunshine', 
            'overcast with thick grey clouds',
            'light rain falling steadily',
            'misty with low hanging fog',
            'crisp and cool with a light breeze',
            'warm with scattered clouds',
            'stormy with distant thunder'
        ];
        const currentWeather = this.storyGenerator.randomChoice(weather);
        
        return { 
            success: true, 
            message: chalk.cyan(`The weather is ${currentWeather}.`) 
        };
    }

    handleDescribe(player, target) {
        const room = this.gameEngine.world.getRoom(player.location);
        if (!room) {
            return { success: false, message: 'You are in a void.' };
        }

        if (!target) {
            // Generate an enhanced room description
            const enhanced = this.storyGenerator.generateRoomDescription({
                atmosphere: 'peaceful'
            });
            
            return { 
                success: true, 
                message: chalk.white(`Looking closer at your surroundings:\n${enhanced}`) 
            };
        }

        // TODO: Implement describing specific objects/NPCs
        return { 
            success: false, 
            message: `You don't see anything special about '${target}'.` 
        };
    }

    handleGossip(player) {
        const rumors = [
            'Strange lights have been seen in the northern forests',
            'A merchant mentioned that the roads to the east are becoming dangerous',
            'Some say the old ruins are not as abandoned as they appear',
            'Travelers speak of a mysterious figure asking about ancient artifacts',
            'The guards seem more nervous than usual lately'
        ];
        
        const rumor = this.storyGenerator.randomChoice(rumors);
        
        return { 
            success: true, 
            message: chalk.magenta(`You recall hearing: "${rumor}"`) 
        };
    }

    handleAsk(player, args) {
        if (!args) {
            return { 
                success: false, 
                message: 'Usage: ask <topic> (topics: time, weather, directions, rumors)' 
            };
        }

        const topic = args.toLowerCase();
        const responses = {
            time: 'You ask about the time, but no one seems to have a precise answer.',
            weather: 'People mention the weather has been fairly typical for this season.',
            directions: 'Locals point out the main paths: north to the forest, south to the mountains.',
            rumors: 'You overhear whispered conversations about strange happenings nearby.',
            news: 'The latest news seems to be about increased trade activity.'
        };

        const response = responses[topic] || `You ask about ${topic}, but no one has much to say about it.`;
        
        return { 
            success: true, 
            message: chalk.white(response) 
        };
    }

    handleTalk(player, args) {
        if (!args) {
            return { 
                success: false, 
                message: 'Usage: talk <npc name> [topic] - Start or continue a conversation with an NPC' 
            };
        }

        const parts = args.split(' ');
        const npcName = parts[0];
        const topic = parts.slice(1).join(' ');

        // Get current room
        const room = this.world.getRoom(player.currentRoom);
        if (!room) {
            return { success: false, message: 'You cannot find anyone to talk to here.' };
        }

        // Find NPC in current room
        const npc = room.npcs?.find(n => 
            n.name.toLowerCase().includes(npcName.toLowerCase())
        );

        if (!npc) {
            return { 
                success: false, 
                message: `There is no one named '${npcName}' here to talk to.` 
            };
        }

        let response;
        if (!topic) {
            // Just greeting
            response = npc.getGreeting(player);
            npc.processInteraction(player, 'friendly_greeting');
        } else {
            // Asking about a specific topic
            response = npc.getTopicResponse(topic, player);
            npc.processInteraction(player, 'topic_discussion', { topic });
        }

        return { 
            success: true, 
            message: chalk.cyan.bold(`${npc.name}: `) + chalk.white(`"${response}"`)
        };
    }

    handleEquipment(player) {
        if (!player.equipment) {
            return { success: true, message: 'You are not wearing or wielding anything.' };
        }

        let output = [chalk.cyan.bold('=== Equipment ===')];
        const slots = ['weapon', 'armor', 'helmet', 'boots', 'accessory'];
        
        slots.forEach(slot => {
            const item = player.equipment[slot];
            const itemName = item ? item.name : 'nothing';
            const color = item ? chalk.green : chalk.gray;
            output.push(color(`${slot.charAt(0).toUpperCase() + slot.slice(1)}: ${itemName}`));
        });

        return { success: true, message: output.join('\n') };
    }

    handleRoll(player, args) {
        if (!args) {
            args = '1d20'; // Default to 1d20
        }

        const rollResult = this.parseAndRoll(args);
        if (!rollResult.success) {
            return rollResult;
        }

        const { total, rolls, modifier, formula } = rollResult;
        
        // Determine success levels for storytelling
        let outcome = '';
        if (total >= 20) outcome = chalk.green.bold(' (Critical Success!)');
        else if (total >= 15) outcome = chalk.green(' (Great Success)');
        else if (total >= 10) outcome = chalk.yellow(' (Success)');
        else if (total >= 5) outcome = chalk.red(' (Failure)');
        else outcome = chalk.red.bold(' (Critical Failure!)');

        const rollDetails = rolls.length > 1 ? ` [${rolls.join(', ')}]` : '';
        
        // Broadcast the roll to the room so others can see
        const room = this.gameEngine.world.getRoom(player.location);
        if (room) {
            const message = chalk.white(`${player.name} rolls ${formula}: ${total}${rollDetails}${outcome}`);
            this.gameEngine.broadcastToRoom(player.location, message, player.id);
        }

        return { 
            success: true, 
            message: chalk.white(`You roll ${formula}: ${chalk.bold(total)}${rollDetails}${outcome}`) 
        };
    }

    parseAndRoll(rollString) {
        // Support formats like: 1d20, 3d6+2, 2d10-1, d20, etc.
        const regex = /^(\d*)d(\d+)([+-]\d+)?$/i;
        const match = rollString.trim().match(regex);
        
        if (!match) {
            return { 
                success: false, 
                message: 'Invalid dice format. Use formats like: 1d20, 3d6+2, d20, etc.' 
            };
        }

        const numDice = parseInt(match[1]) || 1;
        const diceSize = parseInt(match[2]);
        const modifier = match[3] ? parseInt(match[3]) : 0;
        
        if (numDice > 20 || diceSize > 100) {
            return { 
                success: false, 
                message: 'Dice limits: maximum 20 dice, maximum d100.' 
            };
        }

        const rolls = [];
        let total = 0;
        
        for (let i = 0; i < numDice; i++) {
            const roll = Math.floor(Math.random() * diceSize) + 1;
            rolls.push(roll);
            total += roll;
        }
        
        total += modifier;
        
        const formula = `${numDice}d${diceSize}${modifier > 0 ? '+' + modifier : modifier < 0 ? modifier : ''}`;
        
        return {
            success: true,
            total,
            rolls,
            modifier,
            formula
        };
    }

    handleCoinFlip(player) {
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        
        // Broadcast to room
        const room = this.gameEngine.world.getRoom(player.location);
        if (room) {
            const message = chalk.white(`${player.name} flips a coin: ${result}!`);
            this.gameEngine.broadcastToRoom(player.location, message, player.id);
        }
        
        return { 
            success: true, 
            message: chalk.white(`You flip a coin: ${chalk.bold(result.toUpperCase())}!`) 
        };
    }

    handleAdvantage(player, args) {
        if (!args) {
            args = '1d20'; // Default to 1d20
        }

        const roll1 = this.parseAndRoll(args);
        const roll2 = this.parseAndRoll(args);
        
        if (!roll1.success || !roll2.success) {
            return { success: false, message: 'Invalid dice format for advantage roll.' };
        }

        const higherRoll = roll1.total > roll2.total ? roll1 : roll2;
        const lowerRoll = roll1.total <= roll2.total ? roll1 : roll2;
        
        // Generate story outcome based on roll
        const storyOutcome = this.generateStoryOutcome(higherRoll.total, 'advantage');
        
        // Broadcast to room
        const room = this.gameEngine.world.getRoom(player.location);
        if (room) {
            const message = chalk.white(`${player.name} rolls ${higherRoll.formula} with advantage: ${higherRoll.total} [${roll1.total}, ${roll2.total}] ${storyOutcome.broadcast}`);
            this.gameEngine.broadcastToRoom(player.location, message, player.id);
        }

        return { 
            success: true, 
            message: chalk.green(`Advantage Roll ${higherRoll.formula}: ${chalk.bold(higherRoll.total)} [${roll1.total}, ${roll2.total}] - Taking higher\n${storyOutcome.personal}`) 
        };
    }

    handleDisadvantage(player, args) {
        if (!args) {
            args = '1d20'; // Default to 1d20
        }

        const roll1 = this.parseAndRoll(args);
        const roll2 = this.parseAndRoll(args);
        
        if (!roll1.success || !roll2.success) {
            return { success: false, message: 'Invalid dice format for disadvantage roll.' };
        }

        const lowerRoll = roll1.total < roll2.total ? roll1 : roll2;
        const higherRoll = roll1.total >= roll2.total ? roll1 : roll2;
        
        // Generate story outcome based on roll
        const storyOutcome = this.generateStoryOutcome(lowerRoll.total, 'disadvantage');
        
        // Broadcast to room
        const room = this.gameEngine.world.getRoom(player.location);
        if (room) {
            const message = chalk.white(`${player.name} rolls ${lowerRoll.formula} with disadvantage: ${lowerRoll.total} [${roll1.total}, ${roll2.total}] ${storyOutcome.broadcast}`);
            this.gameEngine.broadcastToRoom(player.location, message, player.id);
        }

        return { 
            success: true, 
            message: chalk.red(`Disadvantage Roll ${lowerRoll.formula}: ${chalk.bold(lowerRoll.total)} [${roll1.total}, ${roll2.total}] - Taking lower\n${storyOutcome.personal}`) 
        };
    }

    handleStoryRoll(player, args) {
        // Story rolls are special d20 rolls that generate narrative outcomes
        const rollResult = this.parseAndRoll(args || '1d20');
        if (!rollResult.success) {
            return rollResult;
        }

        const { total } = rollResult;
        const storyOutcome = this.generateDetailedStoryOutcome(total, player);
        
        // Broadcast to room with story element
        const room = this.gameEngine.world.getRoom(player.location);
        if (room) {
            const message = chalk.magenta(`${player.name} makes a story roll (${total}): ${storyOutcome.event}`);
            this.gameEngine.broadcastToRoom(player.location, message, player.id);
        }

        return { 
            success: true, 
            message: chalk.magenta(`📖 Story Roll: ${chalk.bold(total)}\n${storyOutcome.detailed}`) 
        };
    }

    generateStoryOutcome(total, type = 'normal') {
        const outcomes = {
            20: {
                personal: chalk.green.bold('⭐ Legendary success! Everything goes perfectly.'),
                broadcast: chalk.green.bold('(Legendary Success!)'),
                event: 'achieves something extraordinary'
            },
            19: {
                personal: chalk.green.bold('🌟 Critical success! Far better than expected.'),
                broadcast: chalk.green.bold('(Critical Success!)'),
                event: 'succeeds brilliantly'
            },
            18: {
                personal: chalk.green('✨ Excellent result with unexpected benefits.'),
                broadcast: chalk.green('(Excellent!)'),
                event: 'succeeds with style'
            },
            15: {
                personal: chalk.green('✓ Great success! Things go very well.'),
                broadcast: chalk.green('(Great Success)'),
                event: 'succeeds admirably'
            },
            12: {
                personal: chalk.yellow('○ Good success with minor complications.'),
                broadcast: chalk.yellow('(Success)'),
                event: 'succeeds despite challenges'
            },
            10: {
                personal: chalk.yellow('~ Partial success. Mixed results.'),
                broadcast: chalk.yellow('(Partial Success)'),
                event: 'achieves mixed results'
            },
            8: {
                personal: chalk.orange('△ Marginal outcome. Barely succeeds.'),
                broadcast: chalk.orange('(Marginal)'),
                event: 'barely manages'
            },
            5: {
                personal: chalk.red('✗ Failure with complications.'),
                broadcast: chalk.red('(Failure)'),
                event: 'fails but learns something'
            },
            3: {
                personal: chalk.red('✗✗ Bad failure. Things go wrong.'),
                broadcast: chalk.red('(Bad Failure)'),
                event: 'fails badly'
            },
            1: {
                personal: chalk.red.bold('💥 Critical failure! Disaster strikes.'),
                broadcast: chalk.red.bold('(Critical Failure!)'),
                event: 'fails catastrophically'
            }
        };

        // Find the appropriate outcome tier
        let outcomeKey = 1;
        for (const key of Object.keys(outcomes).map(Number).sort((a, b) => b - a)) {
            if (total >= key) {
                outcomeKey = key;
                break;
            }
        }

        let outcome = outcomes[outcomeKey];
        
        // Modify for advantage/disadvantage
        if (type === 'advantage') {
            outcome = {
                personal: outcome.personal + chalk.cyan(' (Advantage helped!)'),
                broadcast: outcome.broadcast + chalk.cyan(' +ADV'),
                event: outcome.event + ' with fortune\'s favor'
            };
        } else if (type === 'disadvantage') {
            outcome = {
                personal: outcome.personal + chalk.red(' (Disadvantage hindered!)'),
                broadcast: outcome.broadcast + chalk.red(' -DIS'),
                event: outcome.event + ' despite setbacks'
            };
        }

        return outcome;
    }

    generateDetailedStoryOutcome(total, player) {
        const room = this.gameEngine.world.getRoom(player.location);
        const roomName = room ? room.name : 'this place';
        
        const storyEvents = {
            20: [
                `A surge of inspiration strikes ${player.name}! They discover a hidden aspect of ${roomName} that could change everything.`,
                `${player.name} experiences a moment of perfect clarity and understanding about their current situation.`,
                `Fortune smiles upon ${player.name} as an unexpected ally or resource appears in ${roomName}.`
            ],
            15: [
                `${player.name} notices something important that others have missed in ${roomName}.`,
                `A favorable turn of events occurs, giving ${player.name} a significant advantage.`,
                `${player.name} recalls crucial information that proves very helpful right now.`
            ],
            10: [
                `${player.name} has a moderate success, but with some unexpected complications.`,
                `Things go reasonably well for ${player.name}, though not quite as planned.`,
                `${player.name} achieves their goal but realizes there's more to discover in ${roomName}.`
            ],
            5: [
                `${player.name} encounters an unexpected obstacle that complicates their situation.`,
                `Something goes wrong for ${player.name}, but they learn valuable information in the process.`,
                `${player.name} fails at their attempt, but discovers a new approach to try.`
            ],
            1: [
                `${player.name} experiences a significant setback! Something in ${roomName} reacts poorly to their presence.`,
                `A critical mistake leads to immediate consequences for ${player.name}.`,
                `${player.name}'s action backfires spectacularly, attracting unwanted attention.`
            ]
        };

        // Find appropriate story tier
        let eventTier = 1;
        for (const tier of [20, 15, 10, 5, 1]) {
            if (total >= tier) {
                eventTier = tier;
                break;
            }
        }

        const events = storyEvents[eventTier];
        const selectedEvent = this.storyGenerator.randomChoice(events);
        
        // Add additional flavor based on room properties
        let additionalFlavor = '';
        if (room && room.properties) {
            if (room.properties.magical) {
                additionalFlavor = ' Magical energies in the area seem to respond to this event.';
            } else if (room.properties.dangerous) {
                additionalFlavor = ' The dangerous atmosphere of this place intensifies the outcome.';
            } else if (room.properties.safe) {
                additionalFlavor = ' The peaceful nature of this sanctuary influences the result.';
            }
        }

        return {
            event: selectedEvent,
            detailed: selectedEvent + additionalFlavor
        };
    }

    handleDMCommand(player, args) {
        if (!args) {
            return { 
                success: true, 
                message: chalk.cyan('DM Commands:\n' +
                    '  dm story - Generate a random story hook\n' +
                    '  dm npc - Generate a random NPC\n' +
                    '  dm quest - Generate a random quest\n' +
                    '  dm room - Generate enhanced room description\n' +
                    '  dm event - Generate a random event\n' +
                    '  dm encounter - Generate a random encounter')
            };
        }

        const command = args.split(' ')[0].toLowerCase();
        const additionalArgs = args.split(' ').slice(1).join(' ');

        switch (command) {
            case 'story':
                return this.generateStoryHook(player);
            case 'npc':
                return this.generateNPC(player, additionalArgs);
            case 'quest':
                return this.generateQuest(player, additionalArgs);
            case 'room':
                return this.generateRoomDescription(player);
            case 'event':
                return this.generateRandomEvent(player);
            case 'encounter':
                return this.generateEncounter(player);
            default:
                return { 
                    success: false, 
                    message: `Unknown DM command: ${command}. Use 'dm' for help.` 
                };
        }
    }

    generateStoryHook(player) {
        const hooks = [
            'A mysterious stranger approaches, offering a lucrative but dangerous job.',
            'Strange noises have been coming from the abandoned building nearby.',
            'A local merchant\'s caravan has gone missing on the trade route.',
            'Ancient ruins have been discovered, but something guards them.',
            'A plague of nightmares has been affecting the townspeople.',
            'Magical crystals are appearing randomly, causing strange effects.',
            'A rival adventuring party has challenged your group to a competition.',
            'The local noble has issued a call for heroes to address a crisis.'
        ];
        
        const hook = this.storyGenerator.randomChoice(hooks);
        
        return { 
            success: true, 
            message: chalk.magenta(`📖 Story Hook: ${hook}`) 
        };
    }

    generateNPC(player, role) {
        try {
            const npc = this.storyGenerator.generateNPC({ role: role || 'citizen' });
            
            let output = [];
            output.push(chalk.cyan.bold(`👤 Generated NPC: ${npc.name}`));
            output.push(chalk.white(`Race: ${npc.race}, Gender: ${npc.gender}`));
            output.push(chalk.white(`Appearance: ${npc.appearance.build} with ${npc.appearance.hair} and ${npc.appearance.eyes}`));
            output.push(chalk.white(`Personality: Values ${npc.personality.values.join(', ')}`));
            output.push(chalk.yellow(`Greeting: "${npc.speech.greeting}"`));
            
            if (npc.knowledge.secrets.length > 0) {
                output.push(chalk.red(`Secret: ${npc.knowledge.secrets[0]}`));
            }
            
            return { success: true, message: output.join('\n') };
        } catch (error) {
            return { success: false, message: 'Failed to generate NPC.' };
        }
    }

    generateQuest(player, difficulty) {
        try {
            const quest = this.storyGenerator.generateQuest({ 
                difficulty: difficulty || 'medium',
                level: player.level 
            });
            
            let output = [];
            output.push(chalk.cyan.bold(`⚔️ Generated Quest: ${quest.title}`));
            output.push(chalk.white(`Type: ${quest.type}, Difficulty: ${quest.difficulty}`));
            output.push(chalk.yellow(`Hook: ${quest.narrative.hook}`));
            output.push(chalk.white(`Stakes: ${quest.narrative.stakes}`));
            output.push(chalk.green(`Rewards: ${quest.rewards.experience} XP, ${quest.rewards.gold} gold`));
            
            return { success: true, message: output.join('\n') };
        } catch (error) {
            return { success: false, message: 'Failed to generate quest.' };
        }
    }

    generateRoomDescription(player) {
        const atmospheres = ['ancient', 'magical', 'dangerous', 'peaceful', 'mysterious', 'bustling'];
        const atmosphere = this.storyGenerator.randomChoice(atmospheres);
        const description = this.storyGenerator.generateRoomDescription({ atmosphere });
        
        return { 
            success: true, 
            message: chalk.cyan(`🏛️ Enhanced Room (${atmosphere}):\n`) + chalk.white(description) 
        };
    }

    generateRandomEvent(player) {
        const events = [
            'A sudden gust of wind carries an unusual scent.',
            'You hear distant music floating on the breeze.',
            'A shooting star streaks across the sky.',
            'You notice fresh tracks leading away from here.',
            'A small animal watches you curiously before running off.',
            'You find a small, interesting trinket on the ground.',
            'The weather suddenly changes, clouds gathering overhead.',
            'You hear the sound of approaching footsteps.'
        ];
        
        const event = this.storyGenerator.randomChoice(events);
        
        return { 
            success: true, 
            message: chalk.yellow(`🎲 Random Event: ${event}`) 
        };
    }

    generateEncounter(player) {
        const encounters = [
            'A group of bandits demands a toll to pass.',
            'A wounded traveler asks for help.',
            'A merchant offers to trade rare goods.',
            'Wild animals block your path.',
            'You stumble upon a hidden camp.',
            'A ghostly figure appears briefly before vanishing.',
            'You discover a locked chest partially buried.',
            'A friendly local offers directions and warnings.'
        ];
        
        const encounter = this.storyGenerator.randomChoice(encounters);
        
        return { 
            success: true, 
            message: chalk.red.bold(`⚔️ Encounter: ${encounter}`) 
        };
    }

    // Inventory Management Commands

    handleGet(player, target) {
        if (!target) {
            return { success: false, message: 'Get what?' };
        }

        const room = this.gameEngine.world.getRoom(player.location);
        if (!room) {
            return { success: false, message: 'You are in a void.' };
        }

        const item = room.findItem(target);
        if (!item) {
            return { success: false, message: `You don't see '${target}' here.` };
        }

        // Remove from room and add to player inventory
        room.removeItem(item.id);
        player.addItem(item);

        // Broadcast to room
        this.gameEngine.broadcastToRoom(
            player.location,
            chalk.cyan(`${player.name} picks up ${item.name}.`),
            player.id
        );

        return { 
            success: true, 
            message: chalk.green(`You pick up ${item.name}.`) 
        };
    }

    handleDrop(player, target) {
        if (!target) {
            return { success: false, message: 'Drop what?' };
        }

        const item = player.inventory.find(i => 
            i.name.toLowerCase().includes(target.toLowerCase()) ||
            i.id.toLowerCase() === target.toLowerCase()
        );

        if (!item) {
            return { success: false, message: `You don't have '${target}'.` };
        }

        const room = this.gameEngine.world.getRoom(player.location);
        if (!room) {
            return { success: false, message: 'You are in a void.' };
        }

        // Remove from player and add to room
        player.removeItem(item.id, 1);
        room.addItem(item);

        // Broadcast to room
        this.gameEngine.broadcastToRoom(
            player.location,
            chalk.cyan(`${player.name} drops ${item.name}.`),
            player.id
        );

        return { 
            success: true, 
            message: chalk.yellow(`You drop ${item.name}.`) 
        };
    }

    handleUse(player, target) {
        if (!target) {
            return { success: false, message: 'Use what?' };
        }

        const item = player.inventory.find(i => 
            i.name.toLowerCase().includes(target.toLowerCase()) ||
            i.id.toLowerCase() === target.toLowerCase()
        );

        if (!item) {
            return { success: false, message: `You don't have '${target}'.` };
        }

        if (item.type !== 'consumable') {
            return { success: false, message: `You can't use ${item.name}.` };
        }

        let output = [];
        
        // Apply item effects
        if (item.effects) {
            if (item.effects.heal && item.effects.heal > 0) {
                const healAmount = Math.min(item.effects.heal, player.maxHp - player.currentHp);
                player.heal(healAmount);
                output.push(chalk.green(`You heal ${healAmount} HP.`));
            }
            
            if (item.effects.restoreMana && item.effects.restoreMana > 0) {
                const manaAmount = Math.min(item.effects.restoreMana, player.maxMp - player.currentMp);
                player.restoreMana(manaAmount);
                output.push(chalk.blue(`You restore ${manaAmount} MP.`));
            }
        }

        // Remove the used item
        player.removeItem(item.id, 1);
        output.unshift(chalk.white(`You use ${item.name}.`));

        // Update player stats
        this.gameEngine.emit('playerUpdate', {
            playerId: player.id,
            hp: player.currentHp,
            maxHp: player.maxHp,
            mp: player.currentMp,
            maxMp: player.maxMp
        });

        return { 
            success: true, 
            message: output.join('\n')
        };
    }

    handleEquip(player, target) {
        if (!target) {
            return { success: false, message: 'Equip what?' };
        }

        const item = player.inventory.find(i => 
            i.name.toLowerCase().includes(target.toLowerCase()) ||
            i.id.toLowerCase() === target.toLowerCase()
        );

        if (!item) {
            return { success: false, message: `You don't have '${target}'.` };
        }

        if (!item.slot) {
            return { success: false, message: `You can't equip ${item.name}.` };
        }

        // Check level requirements
        if (item.requirements && item.requirements.level > player.level) {
            return { 
                success: false, 
                message: `You need to be level ${item.requirements.level} to equip ${item.name}.` 
            };
        }

        // Check stat requirements
        if (item.requirements) {
            for (const [stat, required] of Object.entries(item.requirements)) {
                if (stat !== 'level' && player.stats[stat] < required) {
                    return { 
                        success: false, 
                        message: `You need ${required} ${stat.toUpperCase()} to equip ${item.name}.` 
                    };
                }
            }
        }

        let output = [];
        const slot = item.slot;
        
        // Unequip current item if any
        if (player.equipment[slot]) {
            const oldItem = player.equipment[slot];
            player.addItem(oldItem);
            output.push(chalk.yellow(`You unequip ${oldItem.name}.`));
        }

        // Equip new item
        const success = player.equipItem(item);
        if (success) {
            output.push(chalk.green(`You equip ${item.name}.`));
            
            // Show stat changes if any
            if (item.stats) {
                const statChanges = Object.entries(item.stats)
                    .map(([stat, value]) => `${stat.toUpperCase()}: +${value}`)
                    .join(', ');
                output.push(chalk.cyan(`Stat bonuses: ${statChanges}`));
            }
            
            return { 
                success: true, 
                message: output.join('\n')
            };
        } else {
            return { success: false, message: `Failed to equip ${item.name}.` };
        }
    }

    handleUnequip(player, slot) {
        if (!slot) {
            return { success: false, message: 'Unequip what? (weapon, armor, helmet, boots, accessory)' };
        }

        const slotName = slot.toLowerCase();
        const validSlots = ['weapon', 'armor', 'helmet', 'boots', 'accessory'];
        
        if (!validSlots.includes(slotName)) {
            return { success: false, message: 'Invalid equipment slot.' };
        }

        if (!player.equipment[slotName]) {
            return { success: false, message: `You don't have anything equipped in your ${slotName} slot.` };
        }

        const item = player.equipment[slotName];
        const success = player.unequipItem(slotName);
        
        if (success) {
            return { 
                success: true, 
                message: chalk.yellow(`You unequip ${item.name}.`)
            };
        } else {
            return { success: false, message: `Failed to unequip ${item.name}.` };
        }
    }

    handleInspect(player, target) {
        if (!target) {
            return { success: false, message: 'Inspect what?' };
        }

        // Look for item in inventory first
        const inventoryItem = player.inventory.find(i => 
            i.name.toLowerCase().includes(target.toLowerCase()) ||
            i.id.toLowerCase() === target.toLowerCase()
        );

        if (inventoryItem) {
            const description = inventoryItem.getDetailedDescription ? 
                inventoryItem.getDetailedDescription(player) : 
                `${inventoryItem.name}\n${inventoryItem.description}`;
            return { 
                success: true, 
                message: chalk.cyan(description)
            };
        }

        // Check equipped items
        for (const [slot, item] of Object.entries(player.equipment)) {
            if (item && (
                item.name.toLowerCase().includes(target.toLowerCase()) ||
                item.id.toLowerCase() === target.toLowerCase()
            )) {
                const description = item.getDetailedDescription ? 
                    item.getDetailedDescription(player) : 
                    `${item.name}\n${item.description}`;
                return { 
                    success: true, 
                    message: chalk.cyan(`${description}\n\n${chalk.green('[Currently Equipped]')}`)
                };
            }
        }

        return { success: false, message: `You don't have '${target}' in your inventory or equipped.` };
    }

    // Shop Commands

    handleBuy(player, args) {
        const room = this.gameEngine.world.getRoom(player.location);
        if (!room || !room.properties.shop) {
            return { success: false, message: 'You are not in a shop.' };
        }

        const shop = this.gameEngine.world.getShop(player.location);
        if (!shop) {
            return { success: false, message: 'This shop is currently closed.' };
        }

        if (!shop.sellsItems) {
            return { success: false, message: `${shop.name} doesn't sell items.` };
        }

        if (!args) {
            return { success: false, message: 'Buy what? Use "list" to see available items.' };
        }

        // Parse quantity and item name
        const parts = args.split(' ');
        let quantity = 1;
        let itemName = args;

        if (!isNaN(parts[0]) && parts.length > 1) {
            quantity = parseInt(parts[0]);
            itemName = parts.slice(1).join(' ');
        }

        const result = shop.buyItem(player, itemName, quantity);
        
        if (result.success) {
            player.needsUpdate = true;
            
            // Broadcast to room
            this.gameEngine.broadcastToRoom(
                player.location,
                chalk.cyan(`${player.name} buys something from ${shop.shopkeeper}.`),
                player.id
            );
        }

        return result;
    }

    handleSell(player, args) {
        const room = this.gameEngine.world.getRoom(player.location);
        if (!room || !room.properties.shop) {
            return { success: false, message: 'You are not in a shop.' };
        }

        const shop = this.gameEngine.world.getShop(player.location);
        if (!shop) {
            return { success: false, message: 'This shop is currently closed.' };
        }

        if (!shop.buysItems) {
            return { success: false, message: `${shop.name} doesn't buy items from customers.` };
        }

        if (!args) {
            return { success: false, message: 'Sell what?' };
        }

        // Parse quantity and item name
        const parts = args.split(' ');
        let quantity = 1;
        let itemName = args;

        if (!isNaN(parts[0]) && parts.length > 1) {
            quantity = parseInt(parts[0]);
            itemName = parts.slice(1).join(' ');
        }

        const result = shop.sellItem(player, itemName, quantity);
        
        if (result.success) {
            player.needsUpdate = true;
            
            // Broadcast to room  
            this.gameEngine.broadcastToRoom(
                player.location,
                chalk.cyan(`${player.name} sells something to ${shop.shopkeeper}.`),
                player.id
            );
        }

        return result;
    }

    handleList(player) {
        const room = this.gameEngine.world.getRoom(player.location);
        if (!room || !room.properties.shop) {
            return { success: false, message: 'You are not in a shop.' };
        }

        const shop = this.gameEngine.world.getShop(player.location);
        if (!shop) {
            return { success: false, message: 'This shop is currently closed.' };
        }

        const items = shop.listItems();
        if (items.length === 0) {
            return { 
                success: true, 
                message: chalk.yellow(`${shop.name} is currently out of stock.`) 
            };
        }

        let output = [];
        output.push(chalk.cyan.bold(`=== ${shop.name} ===`));
        output.push(chalk.white(`Shopkeeper: ${shop.shopkeeper || 'Unknown'}`));
        
        if (shop.buysItems) {
            output.push(chalk.green('This shop buys items from customers.'));
        }
        
        output.push(chalk.cyan.bold('\n--- Items for Sale ---'));
        
        items.forEach((item, index) => {
            const rarity = item.rarity || 'common';
            const rarityColor = {
                'common': 'white',
                'uncommon': 'green', 
                'rare': 'blue',
                'epic': 'magenta',
                'legendary': 'yellow'
            }[rarity] || 'white';
            
            const itemLine = `${index + 1}. ${chalk[rarityColor](item.name)} - ${item.price} gold`;
            const quantityInfo = item.quantity > 1 ? ` (${item.quantity} available)` : '';
            
            output.push(chalk.white(itemLine + quantityInfo));
            output.push(chalk.gray(`   ${item.description}`));
        });
        
        output.push(chalk.cyan('\nUse "buy <item>" to purchase an item.'));
        if (shop.buysItems) {
            output.push(chalk.cyan('Use "sell <item>" to sell an item.'));
        }

        return { 
            success: true, 
            message: output.join('\n')
        };
    }

    async handleAdminCommand(player, args) {
        if (!args) {
            const commands = this.adminCommands.getAvailableCommands();
            const commandList = commands.map(cmd => `  admin ${cmd} - ${this.adminCommands.getCommandHelp(cmd)}`).join('\n');
            
            return {
                success: true,
                message: chalk.red('=== ADMIN COMMANDS ===\n') + chalk.white(commandList)
            };
        }

        const [subCommand, ...subArgs] = args.split(' ');
        const subArgsStr = subArgs.join(' ');

        try {
            const result = await this.adminCommands.executeCommand(
                player, 
                subCommand, 
                subArgsStr, 
                this.gameEngine
            );
            return result;
        } catch (error) {
            GameLogger.error('Admin command execution failed', error, {
                player: player.name,
                command: subCommand,
                args: subArgsStr
            });

            return {
                success: false,
                message: chalk.red(`Admin command failed: ${error.message}`)
            };
        }
    }

    // === QUEST SYSTEM COMMANDS ===

    handleQuests(player, args) {
        const questManager = this.gameEngine.questManager;
        if (!questManager) {
            return { success: false, message: 'Quest system not available.' };
        }

        if (!args) {
            // Show all available and active quests
            const availableQuests = questManager.getAvailableQuests(player);
            const activeQuests = questManager.getActiveQuests(player);
            const completedQuests = questManager.getCompletedQuests(player);

            let output = [];
            
            if (activeQuests.length > 0) {
                output.push(chalk.yellow.bold('=== ACTIVE QUESTS ==='));
                activeQuests.forEach(quest => {
                    const playerData = quest.player_data[player.id];
                    const completedObjectives = playerData.objectives.filter(obj => obj.completed).length;
                    const totalObjectives = playerData.objectives.filter(obj => !obj.optional).length;
                    
                    output.push(chalk.cyan(`${quest.title} [${quest.category.toUpperCase()}]`));
                    output.push(chalk.white(`  ${quest.description}`));
                    output.push(chalk.green(`  Progress: ${completedObjectives}/${totalObjectives} objectives`));
                    output.push('');
                });
            }

            if (completedQuests.length > 0) {
                output.push(chalk.green.bold('=== READY TO TURN IN ==='));
                completedQuests.forEach(quest => {
                    output.push(chalk.green(`${quest.title} - Ready for completion!`));
                    output.push(chalk.gray(`  Rewards: ${quest.rewards.experience} XP, ${quest.rewards.gold} gold`));
                    output.push('');
                });
            }

            if (availableQuests.length > 0) {
                output.push(chalk.blue.bold('=== AVAILABLE QUESTS ==='));
                availableQuests.forEach(quest => {
                    const difficulty = quest.difficulty.toUpperCase();
                    const difficultyColor = {
                        'EASY': chalk.green,
                        'MEDIUM': chalk.yellow, 
                        'HARD': chalk.red,
                        'EPIC': chalk.magenta
                    }[difficulty] || chalk.white;

                    output.push(chalk.cyan(`${quest.title} [${difficultyColor(difficulty)}]`));
                    output.push(chalk.white(`  ${quest.description}`));
                    output.push(chalk.gray(`  Level ${quest.level_requirement} • ${quest.rewards.experience} XP`));
                    output.push('');
                });
            }

            if (output.length === 0) {
                output.push(chalk.gray('No quests available at your current level.'));
                output.push(chalk.gray('Try exploring more areas or talking to NPCs!'));
            } else {
                output.push(chalk.gray('Use "quest <name>" for more details or "objectives" to see current tasks.'));
            }

            return { success: true, message: output.join('\n') };
        }

        // Show specific quest details
        const questName = args.toLowerCase();
        const availableQuests = questManager.getAvailableQuests(player);
        const activeQuests = questManager.getActiveQuests(player);
        const completedQuests = questManager.getCompletedQuests(player);
        
        const allQuests = [...availableQuests, ...activeQuests, ...completedQuests];
        const quest = allQuests.find(q => q.title.toLowerCase().includes(questName));

        if (!quest) {
            return { success: false, message: `Quest "${args}" not found.` };
        }

        return this.handleQuestInfo(player, quest.id);
    }

    handleQuestInfo(player, questId) {
        const questManager = this.gameEngine.questManager;
        const quest = questManager.getQuestTemplate(questId);
        
        if (!quest) {
            return { success: false, message: 'Quest not found.' };
        }

        const status = quest.getPlayerStatus(player.id);
        let output = [];

        // Quest header
        const difficulty = quest.difficulty.toUpperCase();
        const difficultyColor = {
            'EASY': chalk.green,
            'MEDIUM': chalk.yellow,
            'HARD': chalk.red,
            'EPIC': chalk.magenta
        }[difficulty] || chalk.white;

        output.push(chalk.cyan.bold(`${quest.title} [${difficultyColor(difficulty)}]`));
        output.push(chalk.yellow(`Category: ${quest.category.toUpperCase()} | Level: ${quest.level_requirement} | Type: ${quest.type.toUpperCase()}`));
        output.push('');
        
        // Description
        output.push(chalk.white(quest.description));
        if (quest.long_description) {
            output.push('');
            output.push(chalk.gray(quest.long_description));
        }
        output.push('');

        // Status-specific information
        if (status === 'active') {
            const objectives = quest.getObjectivesForPlayer(player.id);
            output.push(chalk.yellow.bold('OBJECTIVES:'));
            objectives.forEach(obj => {
                const checkmark = obj.completed ? '✓' : '○';
                const color = obj.completed ? chalk.green : chalk.white;
                const optional = obj.optional ? chalk.gray(' (optional)') : '';
                
                output.push(color(`${checkmark} ${obj.description} [${obj.progress}]${optional}`));
            });
            output.push('');
        }

        // Rewards
        output.push(chalk.green.bold('REWARDS:'));
        if (quest.rewards.experience > 0) {
            output.push(chalk.green(`  Experience: ${quest.rewards.experience}`));
        }
        if (quest.rewards.gold > 0) {
            output.push(chalk.yellow(`  Gold: ${quest.rewards.gold}`));
        }
        if (quest.rewards.items.length > 0) {
            quest.rewards.items.forEach(item => {
                const qty = item.quantity > 1 ? `${item.quantity}x ` : '';
                output.push(chalk.cyan(`  Item: ${qty}${item.id}`));
            });
        }

        // Quest status
        output.push('');
        const statusMessages = {
            'not_started': chalk.blue('Status: Available'),
            'active': chalk.yellow('Status: In Progress'),
            'completed': chalk.green('Status: Ready to Turn In'),
            'turned_in': chalk.gray('Status: Completed')
        };
        output.push(statusMessages[status] || chalk.red('Status: Unknown'));

        return { success: true, message: output.join('\n') };
    }

    handleObjectives(player, args) {
        const questManager = this.gameEngine.questManager;
        const activeQuests = questManager.getActiveQuests(player);

        if (activeQuests.length === 0) {
            return { 
                success: true, 
                message: chalk.gray('You have no active quests. Use "quests" to see available quests.') 
            };
        }

        let output = [chalk.yellow.bold('=== CURRENT OBJECTIVES ===')];

        activeQuests.forEach(quest => {
            const objectives = quest.getObjectivesForPlayer(player.id);
            
            output.push('');
            output.push(chalk.cyan.bold(quest.title));
            
            objectives.forEach(obj => {
                const checkmark = obj.completed ? '✓' : '○';
                const color = obj.completed ? chalk.green : chalk.white;
                const optional = obj.optional ? chalk.gray(' (optional)') : '';
                
                output.push(color(`  ${checkmark} ${obj.description} [${obj.progress}]${optional}`));
            });
        });

        output.push('');
        output.push(chalk.gray('Complete objectives by performing the required actions in the world.'));

        return { success: true, message: output.join('\n') };
    }

    handleAbandonQuest(player, args) {
        if (!args) {
            return { 
                success: false, 
                message: 'Usage: abandon <quest name>\nUse "quests" to see your active quests.' 
            };
        }

        const questManager = this.gameEngine.questManager;
        const activeQuests = questManager.getActiveQuests(player);
        
        const questName = args.toLowerCase();
        const quest = activeQuests.find(q => q.title.toLowerCase().includes(questName));

        if (!quest) {
            return { 
                success: false, 
                message: `No active quest found matching "${args}".` 
            };
        }

        if (!quest.can_abandon) {
            return { 
                success: false, 
                message: `The quest "${quest.title}" cannot be abandoned.` 
            };
        }

        // Remove quest from player data
        delete quest.player_data[player.id];
        const playerQuestSet = questManager.playerQuests.get(player.id);
        if (playerQuestSet) {
            playerQuestSet.delete(quest.id);
        }

        GameLogger.playerAction(player.id, player.name, 'quest_abandoned', { 
            questId: quest.id, 
            questTitle: quest.title 
        });

        return { 
            success: true, 
            message: chalk.yellow(`You have abandoned the quest: ${quest.title}`) 
        };
    }

    // Class-related command handlers
    handleClass(player, args) {
        const currentClass = this.classManager.getClassInfo(player.className);
        
        if (!currentClass) {
            return { 
                success: false, 
                message: 'Unable to retrieve your class information.' 
            };
        }

        const progression = this.classManager.getClassProgression(player);
        
        let output = [
            chalk.yellow.bold('=== CLASS INFORMATION ==='),
            '',
            chalk.cyan.bold(`Current Class: ${currentClass.name}`),
            chalk.white(currentClass.description),
            '',
            chalk.green(`Tier: ${currentClass.tier}`),
            chalk.green(`Level Requirement: ${currentClass.requirements.level}`),
            ''
        ];

        // Show stat bonuses
        if (currentClass.stat_bonuses && Object.keys(currentClass.stat_bonuses).length > 0) {
            output.push(chalk.magenta.bold('Class Bonuses:'));
            Object.entries(currentClass.stat_bonuses).forEach(([stat, bonus]) => {
                if (typeof bonus === 'number') {
                    output.push(chalk.magenta(`  +${bonus} ${stat.toUpperCase()}`));
                } else if (stat.includes('multiplier')) {
                    output.push(chalk.magenta(`  ${bonus}x ${stat.replace('_multiplier', '').toUpperCase()}`));
                } else {
                    output.push(chalk.magenta(`  ${stat}: ${bonus}`));
                }
            });
            output.push('');
        }

        // Show base skills
        if (currentClass.base_skills && currentClass.base_skills.length > 0) {
            output.push(chalk.blue.bold('Class Skills:'));
            currentClass.base_skills.forEach(skill => {
                output.push(chalk.blue(`  • ${skill.replace('_', ' ')}`));
            });
            output.push('');
        }

        // Show advancement information
        if (progression.canAdvance) {
            output.push(chalk.yellow.bold('🎯 ADVANCEMENT AVAILABLE!'));
            output.push(chalk.yellow(`You can advance at level ${progression.advancementLevel}`));
            output.push(chalk.gray('Use "classes" to see advancement options.'));
        } else {
            output.push(chalk.gray(`Next advancement available at level ${progression.advancementLevel}`));
        }

        return { success: true, message: output.join('\n') };
    }

    handleClasses(player, args) {
        const availableAdvancements = this.classManager.getAvailableAdvancements(player);
        
        if (availableAdvancements.length === 0) {
            return { 
                success: true, 
                message: chalk.gray('No class advancements are currently available. Continue leveling up!') 
            };
        }

        let output = [
            chalk.yellow.bold('=== AVAILABLE CLASS ADVANCEMENTS ==='),
            ''
        ];

        availableAdvancements.forEach(advancement => {
            const cls = advancement.class;
            const available = advancement.available;
            const reason = advancement.reason;

            output.push(chalk.cyan.bold(`${cls.name} (Tier ${cls.tier})`));
            output.push(chalk.white(`  ${cls.description}`));
            
            if (available) {
                output.push(chalk.green('  ✓ AVAILABLE - Use "advance ' + cls.id + '" to advance'));
            } else {
                output.push(chalk.red(`  ✗ ${reason}`));
            }

            // Show requirements
            if (cls.requirements) {
                const reqs = [];
                if (cls.requirements.level) reqs.push(`Level ${cls.requirements.level}`);
                if (cls.requirements.stats) {
                    Object.entries(cls.requirements.stats).forEach(([stat, value]) => {
                        if (stat !== 'reputation') {
                            reqs.push(`${stat.toUpperCase()} ${value}`);
                        }
                    });
                }
                if (reqs.length > 0) {
                    output.push(chalk.gray(`  Requirements: ${reqs.join(', ')}`));
                }
            }

            // Show stat bonuses
            if (cls.stat_bonuses && Object.keys(cls.stat_bonuses).length > 0) {
                const bonuses = [];
                Object.entries(cls.stat_bonuses).forEach(([stat, bonus]) => {
                    if (typeof bonus === 'number') {
                        bonuses.push(`+${bonus} ${stat.toUpperCase()}`);
                    }
                });
                if (bonuses.length > 0) {
                    output.push(chalk.magenta(`  Bonuses: ${bonuses.join(', ')}`));
                }
            }

            output.push('');
        });

        return { success: true, message: output.join('\n') };
    }

    handleAdvance(player, args) {
        if (!args) {
            return { 
                success: false, 
                message: 'Usage: advance <class_name>\nUse "classes" to see available advancements.' 
            };
        }

        const className = args.toLowerCase();
        const availableAdvancements = this.classManager.getAvailableAdvancements(player);
        
        // Find the class
        const advancement = availableAdvancements.find(adv => 
            adv.class.id.toLowerCase() === className || 
            adv.class.name.toLowerCase().includes(className)
        );

        if (!advancement) {
            return { 
                success: false,
                message: chalk.red(`Class "${args}" not found or not available for advancement.`) +
                        chalk.gray('\nUse "classes" to see available options.')
            };
        }

        if (!advancement.available) {
            return { 
                success: false,
                message: chalk.red(`Cannot advance to ${advancement.class.name}: ${advancement.reason}`)
            };
        }

        // Attempt advancement
        const result = this.classManager.advancePlayerClass(player, advancement.class.id);
        
        if (result.success) {
            return { 
                success: true, 
                message: chalk.green.bold(result.message) + '\n' +
                        chalk.yellow('Your stats and abilities have been updated!') + '\n' +
                        chalk.gray('Use "class" to view your new class information.')
            };
        } else {
            return { 
                success: false, 
                message: chalk.red(result.message) 
            };
        }
    }

    handleSkills(player, args) {
        const playerSkills = player.skills || [];
        const currentClass = this.classManager.getClassInfo(player.className);
        
        if (!currentClass) {
            return { 
                success: false, 
                message: 'Unable to retrieve your class information.' 
            };
        }

        let output = [
            chalk.yellow.bold('=== YOUR SKILLS ==='),
            ''
        ];

        if (playerSkills.length === 0) {
            output.push(chalk.gray('You have not learned any skills yet.'));
            output.push(chalk.gray('Skills are gained through class advancement and training.'));
        } else {
            output.push(chalk.cyan.bold('Active Skills:'));
            playerSkills.forEach(skill => {
                output.push(chalk.green(`  • ${skill.replace(/_/g, ' ')}`));
            });
        }

        // Show available skill trees if any
        const skillTrees = this.classManager.skillTrees[player.className];
        if (skillTrees && Object.keys(skillTrees).length > 0) {
            output.push('');
            output.push(chalk.magenta.bold('Available Skill Trees:'));
            
            Object.entries(skillTrees).forEach(([treeId, tree]) => {
                output.push(chalk.magenta(`  ${tree.name}`));
                
                if (tree.skills) {
                    Object.entries(tree.skills).forEach(([skillId, skill]) => {
                        const learned = playerSkills.includes(skillId);
                        const status = learned ? chalk.green('✓ Learned') : chalk.gray(`Requires Level ${skill.level}`);
                        output.push(`    ${skillId.replace(/_/g, ' ')} - ${status}`);
                    });
                }
            });
        }

        output.push('');
        output.push(chalk.gray('Note: Full skill system implementation coming soon!'));

        return { success: true, message: output.join('\n') };
    }

    /**
     * Initialize crafting system after GameEngine is ready
     */
    initializeCrafting() {
        if (!this.craftingCommands && this.gameEngine.craftingSystem) {
            this.craftingCommands = new (require('../commands/CraftingCommands'))(this.gameEngine);
            GameLogger.info('Crafting commands initialized');
        }
    }

    /**
     * Handle crafting commands - proxy to crafting system
     */
    handleCraft(player, args, command) {
        if (!this.craftingCommands) {
            this.initializeCrafting();
        }

        if (!this.craftingCommands) {
            return { success: false, message: 'Crafting system not available yet.' };
        }

        // Route to appropriate crafting method based on command
        switch (command.toLowerCase()) {
            case 'craft':
                return this.craftingCommands.handleCraft(player, args);
            case 'recipes':
                return this.craftingCommands.listRecipes(player, args);
            case 'forge':
                return this.craftingCommands.handleCraft(player, `make ${args}`);
            case 'brew':
                return this.craftingCommands.handleAlchemy(player, args);
            case 'enchant':
                return this.craftingCommands.handleEnchanting(player, args);
            default:
                return this.craftingCommands.handleCraft(player, args);
        }
    }

    // Quality of Life command implementations
    handleGo(player, args) {
        if (!args) return { success: false, message: 'Go where?' };
        return this.handleMove(player, args.toLowerCase());
    }

    handleWhereis(player, args) {
        if (!args) return { success: false, message: 'Find what?' };
        const searchTerm = args.toLowerCase();
        let results = [];

        // Search for NPCs
        for (const [roomId, room] of Object.entries(this.gameEngine.worldData.rooms)) {
            if (room.npcs) {
                for (const npcId of room.npcs) {
                    const npc = this.gameEngine.worldData.npcs[npcId];
                    if (npc && npc.name.toLowerCase().includes(searchTerm)) {
                        results.push(`${npc.name} can be found in ${room.name}`);
                    }
                }
            }
        }

        if (results.length === 0) {
            return { success: false, message: `Could not find "${args}" anywhere.` };
        }
        return { success: true, message: results.join('\n') };
    }

    handleFind(player, args) {
        return this.handleWhereis(player, args);
    }

    handleSearch(player, args) {
        if (!args) {
            return this.handleLook(player, 'search');
        }
        const room = this.gameEngine.worldData.getRoom(player.currentRoom);
        const searchTerm = args.toLowerCase();
        
        // Search for hidden items or secrets
        let found = [];
        if (room.items) {
            room.items.forEach(itemId => {
                const item = this.gameEngine.worldData.getItem(itemId);
                if (item && item.name.toLowerCase().includes(searchTerm)) {
                    found.push(`You find a ${item.name} here.`);
                }
            });
        }
        
        if (found.length > 0) {
            return { success: true, message: found.join('\n') };
        }
        return { success: false, message: `You don't find anything matching "${args}".` };
    }

    handleScan(player, args) {
        const room = this.gameEngine.worldData.getRoom(player.currentRoom);
        let output = '=== Room Scan ===\n';
        
        output += `Location: ${room.name}\n`;
        output += `Players here: ${this.gameEngine.getPlayersInRoom(room.id).length}\n`;
        output += `NPCs here: ${room.npcs ? room.npcs.length : 0}\n`;
        output += `Items here: ${room.items ? room.items.length : 0}\n`;
        output += `Monsters here: ${room.monsters ? room.monsters.length : 0}\n`;
        output += `Exits: ${Object.keys(room.exits || {}).join(', ')}\n`;
        
        return { success: true, message: output };
    }

    handleCompare(player, args) {
        if (!args) return { success: false, message: 'Compare what items?' };
        const items = args.split(' and ');
        if (items.length !== 2) {
            return { success: false, message: 'Usage: compare <item1> and <item2>' };
        }
        
        const item1 = player.inventory.findItem(items[0].trim());
        const item2 = player.inventory.findItem(items[1].trim());
        
        if (!item1 || !item2) {
            return { success: false, message: 'You must have both items to compare them.' };
        }
        
        let comparison = `=== Comparing ${item1.name} vs ${item2.name} ===\n`;
        if (item1.stats && item2.stats) {
            for (const stat in item1.stats) {
                const val1 = item1.stats[stat] || 0;
                const val2 = item2.stats[stat] || 0;
                const diff = val1 - val2;
                const symbol = diff > 0 ? '+' : diff < 0 ? '-' : '=';
                comparison += `${stat}: ${val1} vs ${val2} (${symbol}${Math.abs(diff)})\n`;
            }
        }
        
        return { success: true, message: comparison };
    }

    handleValue(player, args) {
        if (!args) return { success: false, message: 'Check the value of what?' };
        const item = player.inventory.findItem(args);
        if (!item) {
            return { success: false, message: `You don't have "${args}".` };
        }
        
        const condition = Math.floor((item.durability / item.maxDurability) * 100);
        let conditionText = 'perfect';
        if (condition < 90) conditionText = 'excellent';
        if (condition < 75) conditionText = 'good';
        if (condition < 50) conditionText = 'fair';
        if (condition < 25) conditionText = 'poor';
        if (condition < 10) conditionText = 'terrible';
        
        return { 
            success: true, 
            message: `${item.name} is worth ${item.value} gold and is in ${conditionText} condition (${condition}%).` 
        };
    }

    handleRepair(player, args) {
        if (!args) return { success: false, message: 'Repair what?' };
        return { success: false, message: 'You need to find a blacksmith or repair shop to fix items.' };
    }

    handleRest(player, args) {
        if (player.inCombat) {
            return { success: false, message: 'You cannot rest while in combat!' };
        }
        
        player.isResting = true;
        setTimeout(() => {
            if (player.isResting) {
                const healAmount = Math.floor(player.maxHealth * 0.25);
                const manaAmount = Math.floor(player.maxMana * 0.25);
                player.health = Math.min(player.maxHealth, player.health + healAmount);
                player.mana = Math.min(player.maxMana, player.mana + manaAmount);
                player.isResting = false;
                this.gameEngine.sendToPlayer(player.id, `You feel refreshed after your rest. (+${healAmount} HP, +${manaAmount} MP)`);
            }
        }, 30000); // 30 second rest
        
        return { success: true, message: 'You begin resting to recover your strength...' };
    }

    handleRecall(player, args) {
        if (player.inCombat) {
            return { success: false, message: 'You cannot recall while in combat!' };
        }
        
        const startingRoom = 'town_square'; // Default starting location
        player.currentRoom = startingRoom;
        
        return { 
            success: true, 
            message: 'You recall back to town!\n\n' + this.handleLook(player, '').message 
        };
    }

    handleFollow(player, args) {
        return { success: false, message: 'Group functionality not yet implemented.' };
    }

    handleUnfollow(player, args) {
        return { success: false, message: 'Group functionality not yet implemented.' };
    }

    handleGroup(player, args) {
        return { success: false, message: 'Group functionality not yet implemented.' };
    }

    handleIgnore(player, args) {
        if (!args) return { success: false, message: 'Ignore who?' };
        if (!player.ignoredPlayers) player.ignoredPlayers = [];
        
        if (player.ignoredPlayers.includes(args)) {
            return { success: false, message: `You are already ignoring ${args}.` };
        }
        
        player.ignoredPlayers.push(args);
        return { success: true, message: `You are now ignoring ${args}.` };
    }

    handleUnignore(player, args) {
        if (!args) return { success: false, message: 'Unignore who?' };
        if (!player.ignoredPlayers) player.ignoredPlayers = [];
        
        const index = player.ignoredPlayers.indexOf(args);
        if (index === -1) {
            return { success: false, message: `You are not ignoring ${args}.` };
        }
        
        player.ignoredPlayers.splice(index, 1);
        return { success: true, message: `You are no longer ignoring ${args}.` };
    }
}

module.exports = CommandParser;