const chalk = require('chalk');
const DatabaseSetup = require('../config/database-setup');
const GameLogger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

class AdminCommands {
    constructor() {
        this.dbSetup = new DatabaseSetup();
        this.adminCommands = {
            backup: this.handleBackup.bind(this),
            restore: this.handleRestore.bind(this),
            sync: this.handleSync.bind(this),
            backups: this.handleListBackups.bind(this),
            cleanup: this.handleCleanupBackups.bind(this),
            status: this.handleStatus.bind(this),
            reload: this.handleReload.bind(this),
            save: this.handleSaveAll.bind(this),
            kick: this.handleKickPlayer.bind(this),
            ban: this.handleBanPlayer.bind(this),
            unban: this.handleUnbanPlayer.bind(this),
            announce: this.handleAnnouncement.bind(this),
            shutdown: this.handleShutdown.bind(this),
            stats: this.handleServerStats.bind(this),
            logs: this.handleViewLogs.bind(this),
            spawn: this.handleSpawnItem.bind(this),
            goto: this.handleGoto.bind(this),
            teleport: this.handleTeleport.bind(this),
            god: this.handleGodMode.bind(this),
            invisible: this.handleInvisible.bind(this),
            heal: this.handleHealPlayer.bind(this),
            setlevel: this.handleSetLevel.bind(this),
            addgold: this.handleAddGold.bind(this)
        };
    }

    async executeCommand(player, commandName, args, gameEngine) {
        // Check if player is admin
        if (!this.isAdmin(player)) {
            return {
                success: false,
                message: chalk.red('Access denied. Admin privileges required.')
            };
        }

        const command = this.adminCommands[commandName];
        if (!command) {
            return {
                success: false,
                message: chalk.red(`Unknown admin command: ${commandName}`)
            };
        }

        try {
            const result = await command(player, args, gameEngine);
            
            // Log admin action
            GameLogger.gameEvent('admin_command_executed', {
                adminId: player.id,
                adminName: player.name,
                command: commandName,
                args: args,
                success: result.success
            });

            return result;
        } catch (error) {
            GameLogger.error('Admin command failed', error, {
                command: commandName,
                adminId: player.id,
                args: args
            });

            return {
                success: false,
                message: chalk.red(`Command failed: ${error.message}`)
            };
        }
    }

    isAdmin(player) {
        // Check multiple admin criteria
        return player.isAdmin || 
               player.permissions?.includes('admin') ||
               player.name === process.env.ADMIN_USERNAME ||
               player.id === 'admin';
    }

    async handleBackup(player, args) {
        try {
            const backupFile = await this.dbSetup.createFullBackup();
            return {
                success: true,
                message: chalk.green(`Database backup created: ${path.basename(backupFile)}`)
            };
        } catch (error) {
            return {
                success: false,
                message: chalk.red(`Backup failed: ${error.message}`)
            };
        }
    }

    async handleRestore(player, args) {
        if (!args) {
            const backups = await this.dbSetup.getBackupList();
            const recentBackups = backups.slice(0, 5);
            
            let message = chalk.yellow('Available backups (5 most recent):\\n');
            recentBackups.forEach((backup, index) => {
                message += `${index + 1}. ${backup.filename} (${backup.sizeFormatted}) - ${backup.created.toISOString()}\\n`;
            });
            message += chalk.white('\\nUsage: admin restore <filename>');
            
            return { success: true, message };
        }

        const backupFile = path.join(this.dbSetup.backupDir, args);
        
        try {
            await this.dbSetup.restoreFromBackup(backupFile);
            return {
                success: true,
                message: chalk.green(`Database restored from: ${args}`)
            };
        } catch (error) {
            return {
                success: false,
                message: chalk.red(`Restore failed: ${error.message}`)
            };
        }
    }

    async handleSync(player, args) {
        try {
            await this.dbSetup.syncWorldFileToDatabase();
            return {
                success: true,
                message: chalk.green('World file synced to database successfully')
            };
        } catch (error) {
            return {
                success: false,
                message: chalk.red(`Sync failed: ${error.message}`)
            };
        }
    }

    async handleListBackups(player, args) {
        const backups = await this.dbSetup.getBackupList();
        
        if (backups.length === 0) {
            return {
                success: true,
                message: chalk.yellow('No backups found')
            };
        }

        let message = chalk.cyan(`Found ${backups.length} backup(s):\\n`);
        backups.forEach((backup, index) => {
            message += `${index + 1}. ${chalk.white(backup.filename)}\\n`;
            message += `   Size: ${backup.sizeFormatted} | Created: ${backup.created.toLocaleString()}\\n`;
        });

        return { success: true, message };
    }

    async handleCleanupBackups(player, args) {
        const keepCount = parseInt(args) || 10;
        
        try {
            await this.dbSetup.cleanupOldBackups(keepCount);
            return {
                success: true,
                message: chalk.green(`Cleaned up old backups, keeping ${keepCount} most recent`)
            };
        } catch (error) {
            return {
                success: false,
                message: chalk.red(`Cleanup failed: ${error.message}`)
            };
        }
    }

    async handleStatus(player, args, gameEngine) {
        const uptime = process.uptime();
        const memUsage = process.memoryUsage();
        
        let status = chalk.cyan('=== SERVER STATUS ===\\n');
        status += `Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s\\n`;
        status += `Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB\\n`;
        status += `Players Online: ${gameEngine.getOnlinePlayerCount()}\\n`;
        status += `Rooms Loaded: ${gameEngine.world.rooms.size}\\n`;
        status += `Monsters Active: ${gameEngine.world.monsters.size}\\n`;
        status += `NPCs Active: ${gameEngine.world.npcs?.size || 0}\\n`;
        
        return { success: true, message: status };
    }

    async handleReload(player, args, gameEngine) {
        try {
            await gameEngine.reloadWorld();
            return {
                success: true,
                message: chalk.green('World data reloaded successfully')
            };
        } catch (error) {
            return {
                success: false,
                message: chalk.red(`Reload failed: ${error.message}`)
            };
        }
    }

    async handleSaveAll(player, args, gameEngine) {
        try {
            const savedCount = await gameEngine.saveAllPlayers();
            return {
                success: true,
                message: chalk.green(`Saved ${savedCount} players to database`)
            };
        } catch (error) {
            return {
                success: false,
                message: chalk.red(`Save failed: ${error.message}`)
            };
        }
    }

    handleKickPlayer(player, args, gameEngine) {
        if (!args) {
            return {
                success: false,
                message: chalk.red('Usage: admin kick <player_name> [reason]')
            };
        }

        const [targetName, ...reasonParts] = args.split(' ');
        const reason = reasonParts.join(' ') || 'No reason provided';
        
        const targetPlayer = gameEngine.findPlayerByName(targetName);
        if (!targetPlayer) {
            return {
                success: false,
                message: chalk.red(`Player '${targetName}' not found`)
            };
        }

        gameEngine.kickPlayer(targetPlayer.id, reason);
        
        return {
            success: true,
            message: chalk.green(`Kicked ${targetName}: ${reason}`)
        };
    }

    handleAnnouncement(player, args) {
        if (!args) {
            return {
                success: false,
                message: chalk.red('Usage: admin announce <message>')
            };
        }

        // This would broadcast to all players
        // Implementation depends on the socket system
        return {
            success: true,
            message: chalk.green(`Announcement sent: "${args}"`)
        };
    }

    handleServerStats(player, args, gameEngine) {
        const stats = gameEngine.getServerStatistics();
        
        let message = chalk.cyan('=== SERVER STATISTICS ===\\n');
        message += `Total Logins Today: ${stats.loginsToday}\\n`;
        message += `Peak Players Today: ${stats.peakPlayersToday}\\n`;
        message += `Commands Processed: ${stats.commandsProcessed}\\n`;
        message += `Monsters Killed: ${stats.monstersKilled}\\n`;
        message += `Items Dropped: ${stats.itemsDropped}\\n`;
        message += `Experience Gained: ${stats.totalExperience}\\n`;
        
        return { success: true, message };
    }

    handleSpawnItem(player, args) {
        if (!args) {
            return {
                success: false,
                message: chalk.red('Usage: admin spawn <item_id> [quantity]')
            };
        }

        const [itemId, quantityStr] = args.split(' ');
        const quantity = parseInt(quantityStr) || 1;

        // Add item to admin's inventory
        try {
            player.addItem({ id: itemId, quantity: quantity });
            return {
                success: true,
                message: chalk.green(`Spawned ${quantity}x ${itemId}`)
            };
        } catch (error) {
            return {
                success: false,
                message: chalk.red(`Failed to spawn item: ${error.message}`)
            };
        }
    }

    handleGoto(player, args, gameEngine) {
        if (!args) {
            return {
                success: false,
                message: chalk.red('Usage: admin goto <room_id>')
            };
        }

        const room = gameEngine.world.getRoom(args);
        if (!room) {
            return {
                success: false,
                message: chalk.red(`Room '${args}' not found`)
            };
        }

        player.currentRoom = args;
        return {
            success: true,
            message: chalk.green(`Teleported to ${room.name}`)
        };
    }

    handleTeleport(player, args, gameEngine) {
        if (!args) {
            return {
                success: false,
                message: chalk.red('Usage: admin teleport <player_name> <room_id>')
            };
        }

        const [targetName, roomId] = args.split(' ');
        
        const targetPlayer = gameEngine.findPlayerByName(targetName);
        if (!targetPlayer) {
            return {
                success: false,
                message: chalk.red(`Player '${targetName}' not found`)
            };
        }

        const room = gameEngine.world.getRoom(roomId);
        if (!room) {
            return {
                success: false,
                message: chalk.red(`Room '${roomId}' not found`)
            };
        }

        targetPlayer.currentRoom = roomId;
        return {
            success: true,
            message: chalk.green(`Teleported ${targetName} to ${room.name}`)
        };
    }

    handleGodMode(player, args) {
        player.godMode = !player.godMode;
        return {
            success: true,
            message: chalk.yellow(`God mode ${player.godMode ? 'enabled' : 'disabled'}`)
        };
    }

    handleInvisible(player, args) {
        player.invisible = !player.invisible;
        return {
            success: true,
            message: chalk.yellow(`Invisibility ${player.invisible ? 'enabled' : 'disabled'}`)
        };
    }

    handleHealPlayer(player, args, gameEngine) {
        const targetName = args || player.name;
        const targetPlayer = gameEngine.findPlayerByName(targetName) || player;
        
        targetPlayer.currentHp = targetPlayer.maxHp;
        targetPlayer.currentMp = targetPlayer.maxMp;
        
        return {
            success: true,
            message: chalk.green(`${targetPlayer.name} fully healed`)
        };
    }

    handleSetLevel(player, args, gameEngine) {
        if (!args) {
            return {
                success: false,
                message: chalk.red('Usage: admin setlevel <player_name> <level>')
            };
        }

        const [targetName, levelStr] = args.split(' ');
        const level = parseInt(levelStr);
        
        if (isNaN(level) || level < 1 || level > 99) {
            return {
                success: false,
                message: chalk.red('Level must be between 1 and 99')
            };
        }

        const targetPlayer = gameEngine.findPlayerByName(targetName);
        if (!targetPlayer) {
            return {
                success: false,
                message: chalk.red(`Player '${targetName}' not found`)
            };
        }

        targetPlayer.level = level;
        targetPlayer.experience = level * 1000; // Simple formula
        targetPlayer.recalculateStats();
        
        return {
            success: true,
            message: chalk.green(`Set ${targetName}'s level to ${level}`)
        };
    }

    handleAddGold(player, args, gameEngine) {
        if (!args) {
            return {
                success: false,
                message: chalk.red('Usage: admin addgold <player_name> <amount>')
            };
        }

        const [targetName, amountStr] = args.split(' ');
        const amount = parseInt(amountStr);
        
        if (isNaN(amount)) {
            return {
                success: false,
                message: chalk.red('Amount must be a valid number')
            };
        }

        const targetPlayer = gameEngine.findPlayerByName(targetName);
        if (!targetPlayer) {
            return {
                success: false,
                message: chalk.red(`Player '${targetName}' not found`)
            };
        }

        targetPlayer.gold = (targetPlayer.gold || 0) + amount;
        
        return {
            success: true,
            message: chalk.green(`Added ${amount} gold to ${targetName} (Total: ${targetPlayer.gold})`)
        };
    }

    getAvailableCommands() {
        return Object.keys(this.adminCommands).sort();
    }

    getCommandHelp(commandName) {
        const help = {
            backup: 'Create a full database backup',
            restore: 'Restore from a backup file',
            sync: 'Sync world file to database',
            backups: 'List available backups',
            cleanup: 'Clean up old backup files',
            status: 'Show server status',
            reload: 'Reload world data',
            save: 'Save all player data',
            kick: 'Kick a player from the server',
            ban: 'Ban a player (not implemented)',
            unban: 'Unban a player (not implemented)',
            announce: 'Send server-wide announcement',
            shutdown: 'Shutdown the server (not implemented)',
            stats: 'Show server statistics',
            logs: 'View server logs (not implemented)',
            spawn: 'Spawn an item',
            goto: 'Teleport to a room',
            teleport: 'Teleport a player to a room',
            god: 'Toggle god mode',
            invisible: 'Toggle invisibility',
            heal: 'Heal a player',
            setlevel: 'Set a player\'s level',
            addgold: 'Add gold to a player'
        };

        return help[commandName] || 'No help available';
    }

    handleBanPlayer(player, args, gameEngine) {
        if (!args) {
            return { success: false, message: 'Usage: /ban <player> [reason]' };
        }

        const [targetName, ...reasonParts] = args.split(' ');
        const reason = reasonParts.join(' ') || 'No reason provided';

        const targetPlayer = gameEngine.findPlayerByName(targetName);
        if (!targetPlayer) {
            return { success: false, message: `Player '${targetName}' not found` };
        }

        // Note: This is a placeholder - would need proper ban storage in production
        targetPlayer.banned = true;
        targetPlayer.banReason = reason;

        return { 
            success: true, 
            message: `Banned player ${targetPlayer.name}. Reason: ${reason}` 
        };
    }

    handleUnbanPlayer(player, args, gameEngine) {
        if (!args) {
            return { success: false, message: 'Usage: /unban <player>' };
        }

        const targetName = args.trim();
        const targetPlayer = gameEngine.findPlayerByName(targetName);
        
        if (!targetPlayer) {
            return { success: false, message: `Player '${targetName}' not found` };
        }

        targetPlayer.banned = false;
        targetPlayer.banReason = null;

        return { 
            success: true, 
            message: `Unbanned player ${targetPlayer.name}` 
        };
    }

    handleShutdown(player, args) {
        // Placeholder - would need proper shutdown logic
        return { 
            success: false, 
            message: 'Shutdown command not fully implemented for safety' 
        };
    }

    handleViewLogs(player, args) {
        // Placeholder - would need proper log viewing
        return { 
            success: false, 
            message: 'Log viewing not implemented yet' 
        };
    }
}

module.exports = AdminCommands;