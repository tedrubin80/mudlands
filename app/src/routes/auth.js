const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Player = require('../models/Player');
const db = require('../config/database');
const ValidationUtils = require('../utils/validation');
const GameLogger = require('../utils/logger');
const CSRFProtection = require('../middleware/csrf');
const tokenBlacklist = require('../utils/tokenBlacklist');

// Get CSRF token
router.get('/csrf-token', (req, res) => {
    res.json({ 
        success: true, 
        csrfToken: req.session ? req.session.csrfToken || 'temp-token' : 'temp-token' 
    });
});

// Rate limiter for registration (prevent abuse)
const registerLimiter = require('express-rate-limit')({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many registration attempts from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    // Fix for trust proxy issue
    keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress;
    }
});

// Register new player
router.post('/register', registerLimiter, async (req, res) => {
    try {
        const { username, password, email } = req.body;

        // Validate input using our validation utilities
        const usernameValidation = ValidationUtils.validateUsername(username);
        if (!usernameValidation.isValid) {
            return res.status(400).json({ 
                success: false, 
                message: usernameValidation.message 
            });
        }

        const passwordValidation = ValidationUtils.validatePassword(password);
        if (!passwordValidation.isValid) {
            return res.status(400).json({ 
                success: false, 
                message: passwordValidation.message 
            });
        }

        const emailValidation = ValidationUtils.validateEmail(email);
        if (!emailValidation.isValid) {
            return res.status(400).json({ 
                success: false, 
                message: emailValidation.message 
            });
        }

        const sanitizedUsername = usernameValidation.sanitized;
        const sanitizedEmail = emailValidation.sanitized;

        // Check if username already exists (using sanitized version)
        const existingPlayer = await db.getPlayerByUsername(sanitizedUsername);
        if (existingPlayer) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username already exists' 
            });
        }

        // Check if email already exists (using sanitized version)
        const existingEmail = await db.pool.query('SELECT id FROM players WHERE email = $1', [sanitizedEmail]);
        if (existingEmail.rows.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email already exists' 
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new player with sanitized data
        const newPlayer = new Player({
            name: sanitizedUsername,
            password: hashedPassword,
            email: sanitizedEmail,
            level: 1,
            location: 'town_square'
        });

        // Save to database
        const saveResult = await db.savePlayer(newPlayer);
        if (!saveResult) {
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to create player account' 
            });
        }

        // Generate JWT token with unique JTI
        const jti = require('uuid').v4();
        const token = jwt.sign(
            {
                id: newPlayer.id,
                username: newPlayer.name
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRE || '7d',
                jwtid: jti
            }
        );

        res.json({
            success: true,
            message: 'Registration successful',
            token,
            player: {
                id: newPlayer.id,
                name: newPlayer.name,
                level: newPlayer.level
            }
        });

    } catch (error) {
        GameLogger.error('Registration failed', error, { username: req.body.username });
        res.status(500).json({ 
            success: false, 
            message: 'Server error during registration' 
        });
    }
});

// Login existing player
router.post('/login', /* CSRFProtection.rotateToken, */ async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username and password are required' 
            });
        }

        // Look up player in database
        const playerData = await db.getPlayerByUsername(username);
        
        if (!playerData) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, playerData.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Generate JWT token with unique JTI
        const jti = require('uuid').v4();
        const token = jwt.sign(
            {
                id: playerData.id,
                username: playerData.username
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRE || '7d',
                jwtid: jti
            }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            player: {
                id: playerData.id,
                name: playerData.username,
                level: playerData.level,
                experience: playerData.experience,
                className: playerData.class,
                stats: {
                    str: playerData.str,
                    agi: playerData.agi,
                    vit: playerData.vit,
                    int: playerData.int,
                    dex: playerData.dex,
                    luk: playerData.luk
                },
                location: playerData.location
            }
        });

    } catch (error) {
        GameLogger.error('Login failed', error, { username: req.body.username });
        res.status(500).json({ 
            success: false, 
            message: 'Server error during login' 
        });
    }
});

// Verify token
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // In production, fetch current player data from database
        res.json({
            success: true,
            player: {
                id: decoded.id,
                username: decoded.username
            }
        });

    } catch (error) {
        res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired token' 
        });
    }
});

// Logout (mainly for session cleanup)
router.post('/logout', (req, res) => {
    // If using sessions, destroy session here
    if (req.session) {
        req.session.destroy();
    }
    
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Logout route
router.post('/logout', CSRFProtection.rotateToken, async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'No token provided'
            });
        }

        // Verify and decode the token
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: false });
            
            // Add token to blacklist
            if (decoded.jti) {
                tokenBlacklist.blacklistToken(decoded.jti, decoded.exp);
            }
            
            GameLogger.info('User logged out', { 
                userId: decoded.id, 
                username: decoded.username,
                jti: decoded.jti 
            });
            
        } catch (jwtError) {
            // Token is invalid or expired, but still return success
            GameLogger.warn('Logout attempt with invalid token', { 
                error: jwtError.message 
            });
        }

        // Destroy session
        req.session.destroy((err) => {
            if (err) {
                GameLogger.error('Session destruction failed', err);
            }
        });

        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        GameLogger.error('Logout failed', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
});

module.exports = router;