const { Pool } = require('pg');
const GameLogger = require('../utils/logger');

// PostgreSQL connection pool
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Database initialization
async function initDatabase() {
    try {
        // Create tables if they don't exist
        await createTables();
        GameLogger.database('initialization', true);
    } catch (error) {
        GameLogger.error('Database initialization failed', error);
        // Continue running even if DB is not available for development
    }
}

async function createTables() {
    const queries = [
        // Players table
        `CREATE TABLE IF NOT EXISTS players (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            is_admin BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        )`,
        
        // Player stats table
        `CREATE TABLE IF NOT EXISTS player_stats (
            player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
            level INTEGER DEFAULT 1,
            experience INTEGER DEFAULT 0,
            class VARCHAR(50) DEFAULT 'Novice',
            str INTEGER DEFAULT 5,
            agi INTEGER DEFAULT 5,
            vit INTEGER DEFAULT 5,
            int INTEGER DEFAULT 5,
            dex INTEGER DEFAULT 5,
            luk INTEGER DEFAULT 5,
            stat_points INTEGER DEFAULT 0,
            skill_points INTEGER DEFAULT 0,
            current_hp INTEGER,
            max_hp INTEGER,
            current_mp INTEGER,
            max_mp INTEGER,
            location VARCHAR(100) DEFAULT 'town_square'
        )`,
        
        // Inventory table
        `CREATE TABLE IF NOT EXISTS inventory (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            player_id UUID REFERENCES players(id) ON DELETE CASCADE,
            item_id VARCHAR(100),
            quantity INTEGER DEFAULT 1,
            equipped BOOLEAN DEFAULT FALSE,
            slot VARCHAR(50)
        )`,
        
        // Items table
        `CREATE TABLE IF NOT EXISTS items (
            id VARCHAR(100) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            type VARCHAR(50),
            rarity VARCHAR(50),
            stats JSONB,
            requirements JSONB,
            value INTEGER DEFAULT 0
        )`,
        
        // Rooms table
        `CREATE TABLE IF NOT EXISTS rooms (
            id VARCHAR(100) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            exits JSONB,
            properties JSONB,
            npcs JSONB
        )`,
        
        // NPCs table
        `CREATE TABLE IF NOT EXISTS npcs (
            id VARCHAR(100) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            data JSONB NOT NULL,
            location VARCHAR(100) REFERENCES rooms(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Game logs table
        `CREATE TABLE IF NOT EXISTS game_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            player_id UUID REFERENCES players(id) ON DELETE CASCADE,
            action VARCHAR(255),
            details JSONB,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // AI Generated Content table
        `CREATE TABLE IF NOT EXISTS ai_content (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            content_type VARCHAR(50) NOT NULL,
            content_key VARCHAR(255),
            parameters JSONB NOT NULL,
            generated_content JSONB NOT NULL,
            cache_key VARCHAR(255),
            generation_time_ms INTEGER,
            ai_model VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            use_count INTEGER DEFAULT 1,
            quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
            approved BOOLEAN DEFAULT FALSE,
            created_by UUID REFERENCES players(id) ON DELETE SET NULL
        )`,
        
        // AI Content Usage Tracking
        `CREATE TABLE IF NOT EXISTS ai_content_usage (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            content_id UUID REFERENCES ai_content(id) ON DELETE CASCADE,
            player_id UUID REFERENCES players(id) ON DELETE SET NULL,
            session_id VARCHAR(255),
            usage_context VARCHAR(100),
            feedback_rating INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
            feedback_notes TEXT,
            used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // AI Generation Stats
        `CREATE TABLE IF NOT EXISTS ai_generation_stats (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            date DATE DEFAULT CURRENT_DATE,
            content_type VARCHAR(50) NOT NULL,
            total_requests INTEGER DEFAULT 0,
            successful_generations INTEGER DEFAULT 0,
            failed_generations INTEGER DEFAULT 0,
            fallback_used INTEGER DEFAULT 0,
            avg_generation_time_ms INTEGER DEFAULT 0,
            cache_hits INTEGER DEFAULT 0,
            cache_misses INTEGER DEFAULT 0,
            UNIQUE(date, content_type)
        )`
    ];

    for (const query of queries) {
        try {
            await pool.query(query);
        } catch (error) {
            GameLogger.error('Failed to create table', error);
        }
    }
}

// Player operations
async function savePlayer(player) {
    // Skip saving guest players to avoid UUID issues
    if (player.id.startsWith('guest-')) {
        return true;
    }
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Upsert player basic info
        const playerQuery = `
            INSERT INTO players (id, username, email, password_hash, is_admin, last_login)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO UPDATE SET
                is_admin = $5,
                last_login = CURRENT_TIMESTAMP
        `;
        await client.query(playerQuery, [
            player.id,
            player.name,
            player.email,
            player.password,
            player.isAdmin || false
        ]);
        
        // Upsert player stats
        const statsQuery = `
            INSERT INTO player_stats (
                player_id, level, experience, class, 
                str, agi, vit, int, dex, luk,
                stat_points, skill_points,
                current_hp, max_hp, current_mp, max_mp, location
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            ON CONFLICT (player_id) DO UPDATE SET
                level = $2, experience = $3, class = $4,
                str = $5, agi = $6, vit = $7, int = $8, dex = $9, luk = $10,
                stat_points = $11, skill_points = $12,
                current_hp = $13, max_hp = $14, current_mp = $15, max_mp = $16,
                location = $17
        `;
        await client.query(statsQuery, [
            player.id,
            player.level,
            player.experience,
            player.className,
            player.stats.str,
            player.stats.agi,
            player.stats.vit,
            player.stats.int,
            player.stats.dex,
            player.stats.luk,
            player.statPoints,
            player.skillPoints,
            player.currentHp,
            player.maxHp,
            player.currentMp,
            player.maxMp,
            player.location
        ]);
        
        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        GameLogger.error('Failed to save player', error, { playerId: player.id, playerName: player.name });
        return false;
    } finally {
        client.release();
    }
}

async function loadPlayer(playerId) {
    try {
        const playerQuery = `
            SELECT p.*, ps.*
            FROM players p
            JOIN player_stats ps ON p.id = ps.player_id
            WHERE p.id = $1
        `;
        const result = await pool.query(playerQuery, [playerId]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        const data = result.rows[0];
        return {
            id: data.id,
            name: data.username,
            email: data.email,
            password: data.password_hash,
            isAdmin: data.is_admin,
            level: data.level,
            experience: data.experience,
            className: data.class,
            stats: {
                str: data.str,
                agi: data.agi,
                vit: data.vit,
                int: data.int,
                dex: data.dex,
                luk: data.luk
            },
            statPoints: data.stat_points,
            skillPoints: data.skill_points,
            currentHp: data.current_hp,
            maxHp: data.max_hp,
            currentMp: data.current_mp,
            maxMp: data.max_mp,
            location: data.location
        };
    } catch (error) {
        GameLogger.error('Failed to load player', error, { playerId });
        return null;
    }
}

async function getPlayerByUsername(username) {
    try {
        const query = `
            SELECT p.*, ps.*
            FROM players p
            JOIN player_stats ps ON p.id = ps.player_id
            WHERE p.username = $1
        `;
        const result = await pool.query(query, [username]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return result.rows[0];
    } catch (error) {
        GameLogger.error('Failed to get player by username', error, { username });
        return null;
    }
}

module.exports = {
    pool,
    initDatabase,
    savePlayer,
    loadPlayer,
    getPlayerByUsername
};