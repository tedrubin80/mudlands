const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Player = require('../models/Player');
const db = require('../config/database');
const ValidationUtils = require('../utils/validation');
const GameLogger = require('../utils/logger');
const CSRFProtection = require('../middleware/csrf');

// Character creation endpoint
router.post('/create', async (req, res) => {
    try {
        const { name, class: className, stats, description, email, password } = req.body;

        // Validate character data
        const validation = validateCharacterData({ name, className, stats, description });
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }

        // For new users, require email and password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required for new characters'
            });
        }

        // Validate email and password
        const emailValidation = ValidationUtils.validateEmail(email);
        const passwordValidation = ValidationUtils.validatePassword(password);

        if (!emailValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: emailValidation.message
            });
        }

        if (!passwordValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: passwordValidation.message
            });
        }

        // Check if character name already exists
        const existingPlayer = await db.getPlayerByUsername(validation.sanitizedName);
        if (existingPlayer) {
            return res.status(400).json({
                success: false,
                message: 'Character name already exists'
            });
        }

        // Check if email already exists
        const existingEmail = await db.pool.query('SELECT id FROM players WHERE email = $1', [emailValidation.sanitized]);
        if (existingEmail.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new character with validated stats
        const newPlayer = new Player({
            name: validation.sanitizedName,
            password: hashedPassword,
            email: emailValidation.sanitized,
            level: 1,
            className: className,
            stats: validation.validatedStats,
            description: validation.sanitizedDescription,
            location: 'town_square',
            gold: 100, // Starting gold
            inventory: getStartingInventory(className),
            equipment: getStartingEquipment(className)
        });

        // Calculate initial HP/MP based on stats
        newPlayer.maxHp = newPlayer.calculateMaxHp();
        newPlayer.maxMp = newPlayer.calculateMaxMp();
        newPlayer.currentHp = newPlayer.maxHp;
        newPlayer.currentMp = newPlayer.maxMp;

        // Save to database
        const saveResult = await db.savePlayer(newPlayer);
        if (!saveResult) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create character'
            });
        }

        // Generate JWT token
        const jti = require('uuid').v4();
        const token = jwt.sign(
            {
                id: newPlayer.id,
                username: newPlayer.name,
                jti: jti
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRE || '7d'
            }
        );

        GameLogger.info('New character created', {
            playerId: newPlayer.id,
            playerName: newPlayer.name,
            className: newPlayer.className,
            stats: newPlayer.stats
        });

        res.json({
            success: true,
            message: 'Character created successfully',
            token,
            player: {
                id: newPlayer.id,
                name: newPlayer.name,
                level: newPlayer.level,
                className: newPlayer.className,
                stats: newPlayer.stats,
                maxHp: newPlayer.maxHp,
                maxMp: newPlayer.maxMp,
                currentHp: newPlayer.currentHp,
                currentMp: newPlayer.currentMp,
                location: newPlayer.location
            }
        });

    } catch (error) {
        GameLogger.error('Character creation failed', error);
        res.status(500).json({
            success: false,
            message: 'Server error during character creation'
        });
    }
});

// Validate character creation data
function validateCharacterData({ name, className, stats, description }) {
    // Validate name
    const nameValidation = ValidationUtils.validateUsername(name);
    if (!nameValidation.isValid) {
        return { isValid: false, message: nameValidation.message };
    }

    // Validate class
    const validClasses = ['Novice'];
    if (!validClasses.includes(className)) {
        return { isValid: false, message: 'Invalid character class' };
    }

    // Validate stats
    const statValidation = validateStats(stats);
    if (!statValidation.isValid) {
        return { isValid: false, message: statValidation.message };
    }

    // Validate description
    let sanitizedDescription = '';
    if (description && description.trim()) {
        if (description.length > 500) {
            return { isValid: false, message: 'Description too long (max 500 characters)' };
        }
        sanitizedDescription = ValidationUtils.sanitizeText(description, 500);
    }

    return {
        isValid: true,
        sanitizedName: nameValidation.sanitized,
        validatedStats: statValidation.stats,
        sanitizedDescription
    };
}

// Validate stat allocation
function validateStats(stats) {
    const requiredStats = ['str', 'agi', 'vit', 'int', 'dex', 'luk'];
    
    // Check if all stats are present
    for (const stat of requiredStats) {
        if (typeof stats[stat] !== 'number') {
            return { isValid: false, message: `Missing or invalid ${stat} stat` };
        }
    }

    // Check stat ranges
    for (const stat of requiredStats) {
        if (stats[stat] < 5 || stats[stat] > 50) {
            return { isValid: false, message: `${stat.toUpperCase()} must be between 5 and 50` };
        }
    }

    // Check total stat points (starting stats: 60, allocated points: 30 = 90 total)
    const totalStats = Object.values(stats).reduce((sum, value) => sum + value, 0);
    const expectedTotal = 90; // 6 stats * 10 base + 30 allocation points
    
    if (totalStats !== expectedTotal) {
        return { isValid: false, message: 'Invalid stat point allocation' };
    }

    return { isValid: true, stats };
}

// Get starting inventory based on class
function getStartingInventory(className) {
    const baseInventory = [
        {
            id: 'bread',
            name: 'Bread',
            description: 'A simple loaf of bread. Restores a small amount of health.',
            type: 'consumable',
            quantity: 5,
            stackable: true,
            value: 5,
            effects: { heal: 25 }
        },
        {
            id: 'water',
            name: 'Water',
            description: 'Clean drinking water. Restores a small amount of mana.',
            type: 'consumable',
            quantity: 3,
            stackable: true,
            value: 3,
            effects: { restoreMana: 15 }
        }
    ];

    // Class-specific starting items
    const classItems = {
        'Novice': [
            {
                id: 'training_manual',
                name: 'Training Manual',
                description: 'A basic guide for new adventurers. Contains helpful tips and information.',
                type: 'misc',
                quantity: 1,
                stackable: false,
                value: 10
            }
        ]
    };

    return [...baseInventory, ...(classItems[className] || [])];
}

// Get starting equipment based on class
function getStartingEquipment(className) {
    const baseEquipment = {
        weapon: null,
        armor: null,
        helmet: null,
        boots: null,
        accessory: null
    };

    // All classes start with basic equipment
    const startingItems = {
        'Novice': {
            weapon: {
                id: 'rusty_sword',
                name: 'Rusty Sword',
                description: 'An old, worn sword. Better than nothing.',
                type: 'weapon',
                slot: 'weapon',
                stats: { str: 2 },
                damage: { min: 3, max: 7 },
                value: 15,
                durability: 100,
                requirements: { level: 1 }
            },
            armor: {
                id: 'cloth_shirt',
                name: 'Cloth Shirt',
                description: 'A simple cloth shirt. Provides minimal protection.',
                type: 'armor',
                slot: 'armor',
                stats: { vit: 1 },
                defense: 2,
                value: 10,
                durability: 100,
                requirements: { level: 1 }
            }
        }
    };

    const classEquipment = startingItems[className] || {};
    return { ...baseEquipment, ...classEquipment };
}

module.exports = router;