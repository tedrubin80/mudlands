const fs = require('fs');
const path = require('path');
const { pool } = require('./database');
const GameLogger = require('../utils/logger');

class DatabaseSetup {
    constructor() {
        this.backupDir = path.join(__dirname, '../../backups');
        this.dataDir = path.join(__dirname, '../data');
        this.ensureDirectories();
    }

    ensureDirectories() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    async createFullBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backup = {
            timestamp,
            metadata: {
                version: '1.0.0',
                nodeEnv: process.env.NODE_ENV,
                created: new Date().toISOString()
            },
            players: [],
            rooms: [],
            npcs: [],
            items: [],
            game_logs: []
        };

        try {
            // Backup players
            const playersResult = await pool.query(`
                SELECT p.*, ps.* FROM players p 
                LEFT JOIN player_stats ps ON p.id = ps.player_id
            `);
            backup.players = playersResult.rows;

            // Backup rooms
            const roomsResult = await pool.query('SELECT * FROM rooms ORDER BY id');
            backup.rooms = roomsResult.rows;

            // Backup NPCs (if table exists)
            try {
                const npcsResult = await pool.query('SELECT * FROM npcs ORDER BY id');
                backup.npcs = npcsResult.rows;
            } catch (e) {
                GameLogger.warn('NPCs table does not exist yet', { error: e.message });
            }

            // Backup items
            const itemsResult = await pool.query('SELECT * FROM items ORDER BY id');
            backup.items = itemsResult.rows;

            // Backup recent game logs (last 30 days)
            const logsResult = await pool.query(`
                SELECT * FROM game_logs 
                WHERE timestamp > NOW() - INTERVAL '30 days'
                ORDER BY timestamp DESC
            `);
            backup.game_logs = logsResult.rows;

            // Write backup file
            const backupFile = path.join(this.backupDir, `mudlands-backup-${timestamp}.json`);
            fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

            GameLogger.gameEvent('database_backup_created', {
                filename: `mudlands-backup-${timestamp}.json`,
                players: backup.players.length,
                rooms: backup.rooms.length,
                npcs: backup.npcs.length,
                items: backup.items.length,
                logs: backup.game_logs.length
            });

            return backupFile;
        } catch (error) {
            GameLogger.error('Failed to create database backup', error);
            throw error;
        }
    }

    async restoreFromBackup(backupFile) {
        try {
            if (!fs.existsSync(backupFile)) {
                throw new Error(`Backup file not found: ${backupFile}`);
            }

            const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
            
            GameLogger.info('Starting database restore', { 
                backupTimestamp: backupData.timestamp,
                players: backupData.players.length,
                rooms: backupData.rooms.length
            });

            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // Clear existing data (in reverse dependency order)
                await client.query('DELETE FROM game_logs');
                await client.query('DELETE FROM inventory');
                await client.query('DELETE FROM player_stats');
                await client.query('DELETE FROM players');
                await client.query('DELETE FROM items');
                await client.query('DELETE FROM rooms');
                
                try {
                    await client.query('DELETE FROM npcs');
                } catch (e) {
                    // NPCs table might not exist yet
                }

                // Restore rooms
                for (const room of backupData.rooms) {
                    await client.query(`
                        INSERT INTO rooms (id, name, description, exits, properties, npcs)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [
                        room.id, room.name, room.description,
                        room.exits, room.properties, room.npcs || []
                    ]);
                }

                // Restore items
                for (const item of backupData.items) {
                    await client.query(`
                        INSERT INTO items (id, name, description, type, rarity, stats, requirements, value)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    `, [
                        item.id, item.name, item.description, item.type,
                        item.rarity, item.stats, item.requirements, item.value
                    ]);
                }

                // Restore NPCs (if table exists)
                if (backupData.npcs.length > 0) {
                    try {
                        for (const npc of backupData.npcs) {
                            await client.query(`
                                INSERT INTO npcs (id, name, data, location, created_at, updated_at)
                                VALUES ($1, $2, $3, $4, $5, $6)
                            `, [
                                npc.id, npc.name, npc.data, npc.location,
                                npc.created_at, npc.updated_at
                            ]);
                        }
                    } catch (e) {
                        GameLogger.warn('Could not restore NPCs', { error: e.message });
                    }
                }

                // Restore players
                for (const player of backupData.players) {
                    // Insert player
                    await client.query(`
                        INSERT INTO players (id, username, email, password_hash, created_at, last_login)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [
                        player.id, player.username, player.email,
                        player.password_hash, player.created_at, player.last_login
                    ]);

                    // Insert player stats if they exist
                    if (player.player_id) {
                        await client.query(`
                            INSERT INTO player_stats (
                                player_id, level, experience, class, str, agi, vit, int, dex, luk,
                                stat_points, skill_points, current_hp, max_hp, current_mp, max_mp, location
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                        `, [
                            player.player_id, player.level, player.experience, player.class,
                            player.str, player.agi, player.vit, player.int, player.dex, player.luk,
                            player.stat_points, player.skill_points,
                            player.current_hp, player.max_hp, player.current_mp, player.max_mp,
                            player.location
                        ]);
                    }
                }

                await client.query('COMMIT');
                GameLogger.gameEvent('database_restore_complete', {
                    backupFile: path.basename(backupFile),
                    restoredPlayers: backupData.players.length,
                    restoredRooms: backupData.rooms.length
                });

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }

        } catch (error) {
            GameLogger.error('Failed to restore database from backup', error);
            throw error;
        }
    }

    async syncWorldFileToDatabase() {
        const worldFile = path.join(this.dataDir, 'world.json');
        
        if (!fs.existsSync(worldFile)) {
            GameLogger.warn('World file not found, skipping sync');
            return;
        }

        try {
            const worldData = JSON.parse(fs.readFileSync(worldFile, 'utf8'));
            const client = await pool.connect();

            try {
                await client.query('BEGIN');

                // Sync rooms
                if (worldData.rooms) {
                    for (const room of worldData.rooms) {
                        await client.query(`
                            INSERT INTO rooms (id, name, description, exits, properties, npcs)
                            VALUES ($1, $2, $3, $4, $5, $6)
                            ON CONFLICT (id) DO UPDATE SET
                                name = $2,
                                description = $3,
                                exits = $4,
                                properties = $5,
                                npcs = $6
                        `, [
                            room.id, room.name, room.description,
                            JSON.stringify(room.exits || {}),
                            JSON.stringify(room.properties || {}),
                            JSON.stringify(room.npcs || [])
                        ]);
                    }
                }

                // Sync monster templates as items (for crafting materials)
                if (worldData.monsters) {
                    for (const monster of worldData.monsters) {
                        await client.query(`
                            INSERT INTO items (id, name, description, type, rarity, stats, requirements, value)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                            ON CONFLICT (id) DO UPDATE SET
                                name = $2,
                                description = $3,
                                type = $4,
                                rarity = $5,
                                stats = $6,
                                requirements = $7,
                                value = $8
                        `, [
                            monster.id + '_trophy',
                            monster.name + ' Trophy',
                            'A trophy obtained from defeating a ' + monster.name,
                            'trophy',
                            monster.rarity || 'common',
                            JSON.stringify({}),
                            JSON.stringify({}),
                            monster.experience || 10
                        ]);
                    }
                }

                await client.query('COMMIT');
                GameLogger.gameEvent('world_file_synced_to_database', {
                    rooms: worldData.rooms?.length || 0,
                    monsters: worldData.monsters?.length || 0
                });

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }

        } catch (error) {
            GameLogger.error('Failed to sync world file to database', error);
            throw error;
        }
    }

    async getBackupList() {
        try {
            const files = fs.readdirSync(this.backupDir)
                .filter(file => file.startsWith('mudlands-backup-') && file.endsWith('.json'))
                .map(file => {
                    const filePath = path.join(this.backupDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                        filename: file,
                        path: filePath,
                        created: stats.birthtime,
                        size: stats.size,
                        sizeFormatted: this.formatBytes(stats.size)
                    };
                })
                .sort((a, b) => b.created - a.created);

            return files;
        } catch (error) {
            GameLogger.error('Failed to get backup list', error);
            return [];
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async cleanupOldBackups(keepCount = 10) {
        try {
            const backups = await this.getBackupList();
            
            if (backups.length <= keepCount) {
                return;
            }

            const toDelete = backups.slice(keepCount);
            for (const backup of toDelete) {
                fs.unlinkSync(backup.path);
                GameLogger.info('Deleted old backup', { filename: backup.filename });
            }

            GameLogger.gameEvent('old_backups_cleaned', {
                deleted: toDelete.length,
                kept: keepCount
            });

        } catch (error) {
            GameLogger.error('Failed to cleanup old backups', error);
        }
    }
}

module.exports = DatabaseSetup;