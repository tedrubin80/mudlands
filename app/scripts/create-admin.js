#!/usr/bin/env node

/**
 * Script to create admin user in the database
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../src/config/database');

async function createAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL || 'ted@theorubin.com';
    const adminUsername = process.env.ADMIN_USERNAME || 'mudlands_admin'; 
    const adminPassword = process.env.ADMIN_PASSWORD || 'kekpiv-mypxox-1pyrRo';
    
    console.log('Creating admin user...');
    console.log('Email:', adminEmail);
    console.log('Username:', adminUsername);
    
    try {
        // Hash the password
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        const adminId = uuidv4();
        
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Check if admin already exists
            const existingAdmin = await client.query(
                'SELECT id FROM players WHERE email = $1 OR username = $2',
                [adminEmail, adminUsername]
            );
            
            if (existingAdmin.rows.length > 0) {
                console.log('Admin user already exists, updating...');
                // Update existing admin
                await client.query(
                    'UPDATE players SET password_hash = $1, is_admin = TRUE WHERE email = $2 OR username = $3',
                    [passwordHash, adminEmail, adminUsername]
                );
            } else {
                console.log('Creating new admin user...');
                // Insert new admin user
                await client.query(
                    'INSERT INTO players (id, username, email, password_hash, is_admin) VALUES ($1, $2, $3, $4, TRUE)',
                    [adminId, adminUsername, adminEmail, passwordHash]
                );
                
                // Create admin player stats
                await client.query(`
                    INSERT INTO player_stats (
                        player_id, level, experience, class, 
                        str, agi, vit, int, dex, luk,
                        stat_points, skill_points,
                        current_hp, max_hp, current_mp, max_mp, location
                    )
                    VALUES ($1, 99, 999999, 'Admin', 99, 99, 99, 99, 99, 99, 0, 0, 9999, 9999, 9999, 9999, 'admin_room')
                `, [adminId]);
            }
            
            await client.query('COMMIT');
            console.log('✅ Admin user created/updated successfully!');
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Failed to create admin user:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run the script
createAdmin().catch(console.error);