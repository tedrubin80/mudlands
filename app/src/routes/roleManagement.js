/**
 * Role Management API Routes
 * For Super Admins to manage user roles and permissions
 */

const express = require('express');
const RoleAuth = require('../middleware/roleAuth');
const CSRFProtection = require('../middleware/csrf');
const GameLogger = require('../utils/logger');
const db = require('../config/database');
const router = express.Router();

// All role management routes require authentication
router.use(RoleAuth.authenticateWithRole);

/**
 * Get all available roles
 */
router.get('/roles', RoleAuth.testerPlus, async (req, res) => {
    try {
        const roles = await RoleAuth.getAllRoles();

        res.json({
            success: true,
            roles
        });
    } catch (error) {
        GameLogger.error('Failed to get roles', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve roles'
        });
    }
});

/**
 * Get users with their roles (Moderator+)
 */
router.get('/users', RoleAuth.moderatorPlus, async (req, res) => {
    try {
        const query = `
            SELECT
                p.id,
                p.username,
                p.email,
                p.created_at,
                p.last_login,
                p.role_id,
                ur.role_name,
                ur.role_level,
                ur.description as role_description
            FROM players p
            LEFT JOIN user_roles ur ON p.role_id = ur.role_level
            ORDER BY ur.role_level DESC, p.username ASC
        `;

        const result = await db.pool.query(query);

        res.json({
            success: true,
            users: result.rows
        });
    } catch (error) {
        GameLogger.error('Failed to get users with roles', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve users'
        });
    }
});

/**
 * Change user role (Super Admin only)
 */
router.post('/users/:userId/role', RoleAuth.superAdminOnly, CSRFProtection.verifyToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const { roleLevel, reason } = req.body;

        if (typeof roleLevel !== 'number' || roleLevel < 0 || roleLevel > 4) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role level. Must be 0-4.'
            });
        }

        // Prevent users from changing their own role
        if (userId === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot change your own role'
            });
        }

        const success = await RoleAuth.changeUserRole(
            userId,
            roleLevel,
            req.user.id,
            reason || 'Role change via admin panel'
        );

        if (success) {
            // Get updated user info
            const userQuery = `
                SELECT p.username, ur.role_name
                FROM players p
                LEFT JOIN user_roles ur ON p.role_id = ur.role_level
                WHERE p.id = $1
            `;
            const userResult = await db.pool.query(userQuery, [userId]);
            const user = userResult.rows[0];

            GameLogger.info('User role changed by admin', {
                targetUser: user.username,
                newRole: user.role_name,
                changedBy: req.user.username,
                reason
            });

            res.json({
                success: true,
                message: `User ${user.username} role changed to ${user.role_name}`
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to change user role'
            });
        }

    } catch (error) {
        GameLogger.error('Role change error', { error: error.message, userId: req.params.userId });
        res.status(500).json({
            success: false,
            message: 'Failed to change user role'
        });
    }
});

/**
 * Get role change history (Admin+)
 */
router.get('/users/:userId/role-history', RoleAuth.adminOnly, async (req, res) => {
    try {
        const { userId } = req.params;

        const query = `
            SELECT
                rcl.*,
                old_role.role_name as old_role_name,
                new_role.role_name as new_role_name,
                changer.username as changed_by_username
            FROM role_change_logs rcl
            LEFT JOIN user_roles old_role ON rcl.old_role_id = old_role.role_level
            LEFT JOIN user_roles new_role ON rcl.new_role_id = new_role.role_level
            LEFT JOIN players changer ON rcl.changed_by = changer.id
            WHERE rcl.player_id = $1
            ORDER BY rcl.created_at DESC
        `;

        const result = await db.pool.query(query, [userId]);

        res.json({
            success: true,
            history: result.rows
        });
    } catch (error) {
        GameLogger.error('Failed to get role history', { error: error.message, userId: req.params.userId });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve role history'
        });
    }
});

/**
 * Get current user's role info
 */
router.get('/me', async (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email,
            role: req.user.role
        }
    });
});

/**
 * Get role statistics (Admin+)
 */
router.get('/stats', RoleAuth.adminOnly, async (req, res) => {
    try {
        const query = `
            SELECT
                ur.role_name,
                ur.role_level,
                ur.description,
                COUNT(p.id) as user_count
            FROM user_roles ur
            LEFT JOIN players p ON p.role_id = ur.role_level
            GROUP BY ur.role_name, ur.role_level, ur.description
            ORDER BY ur.role_level
        `;

        const result = await db.pool.query(query);

        res.json({
            success: true,
            stats: result.rows
        });
    } catch (error) {
        GameLogger.error('Failed to get role stats', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve role statistics'
        });
    }
});

module.exports = router;