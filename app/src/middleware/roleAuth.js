/**
 * Role-based Access Control Middleware
 * Implements multi-level user permission system
 */

const jwt = require('jsonwebtoken');
const db = require('../config/database');
const GameLogger = require('../utils/logger');

class RoleAuth {
    /**
     * Authentication middleware that also loads user role
     */
    static async authenticateWithRole(req, res, next) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.authToken;

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Load user with role information
            const userQuery = `
                SELECT p.*, ur.role_name, ur.role_level, ur.permissions, ur.description as role_description
                FROM players p
                LEFT JOIN user_roles ur ON p.role_id = ur.role_level
                WHERE p.id = $1
            `;

            const result = await db.pool.query(userQuery, [decoded.userId]);

            if (result.rows.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const user = result.rows[0];
            req.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                role: {
                    id: user.role_id || 0,
                    name: user.role_name || 'player',
                    level: user.role_level || 0,
                    permissions: user.permissions || {},
                    description: user.role_description || 'Standard player'
                }
            };

            next();

        } catch (error) {
            GameLogger.security('Role authentication failed', {
                error: error.message,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });

            return res.status(401).json({
                success: false,
                message: 'Invalid authentication token'
            });
        }
    }

    /**
     * Require minimum role level
     */
    static requireRole(minimumLevel) {
        return (req, res, next) => {
            if (!req.user || !req.user.role) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            if (req.user.role.level < minimumLevel) {
                GameLogger.security('Insufficient role level', {
                    userId: req.user.id,
                    username: req.user.username,
                    requiredLevel: minimumLevel,
                    userLevel: req.user.role.level,
                    ip: req.ip
                });

                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions for this action'
                });
            }

            next();
        };
    }

    /**
     * Check specific permission
     */
    static requirePermission(permission) {
        return (req, res, next) => {
            if (!req.user || !req.user.role) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const permissions = req.user.role.permissions || {};

            if (!permissions[permission]) {
                GameLogger.security('Missing permission', {
                    userId: req.user.id,
                    username: req.user.username,
                    requiredPermission: permission,
                    userPermissions: Object.keys(permissions),
                    ip: req.ip
                });

                return res.status(403).json({
                    success: false,
                    message: `Permission required: ${permission}`
                });
            }

            next();
        };
    }

    /**
     * Admin-only access (role level 3+)
     */
    static adminOnly(req, res, next) {
        return RoleAuth.requireRole(3)(req, res, next);
    }

    /**
     * Moderator+ access (role level 2+)
     */
    static moderatorPlus(req, res, next) {
        return RoleAuth.requireRole(2)(req, res, next);
    }

    /**
     * Tester+ access (role level 1+)
     */
    static testerPlus(req, res, next) {
        return RoleAuth.requireRole(1)(req, res, next);
    }

    /**
     * Super Admin only (role level 4)
     */
    static superAdminOnly(req, res, next) {
        return RoleAuth.requireRole(4)(req, res, next);
    }

    /**
     * Get user's role information
     */
    static async getUserRole(userId) {
        try {
            const query = `
                SELECT p.role_id, ur.role_name, ur.role_level, ur.permissions, ur.description
                FROM players p
                LEFT JOIN user_roles ur ON p.role_id = ur.role_level
                WHERE p.id = $1
            `;

            const result = await db.pool.query(query, [userId]);

            if (result.rows.length === 0) {
                return null;
            }

            const row = result.rows[0];
            return {
                id: row.role_id || 0,
                name: row.role_name || 'player',
                level: row.role_level || 0,
                permissions: row.permissions || {},
                description: row.description || 'Standard player'
            };

        } catch (error) {
            GameLogger.error('Failed to get user role', { error: error.message, userId });
            return null;
        }
    }

    /**
     * Change user's role (Super Admin only)
     */
    static async changeUserRole(userId, newRoleLevel, changedBy, reason = '') {
        try {
            const client = await db.pool.connect();

            try {
                await client.query('BEGIN');

                // Get current role
                const currentRoleQuery = 'SELECT role_id FROM players WHERE id = $1';
                const currentResult = await client.query(currentRoleQuery, [userId]);

                if (currentResult.rows.length === 0) {
                    throw new Error('User not found');
                }

                const oldRoleId = currentResult.rows[0].role_id;

                // Update role
                const updateQuery = 'UPDATE players SET role_id = $1 WHERE id = $2';
                await client.query(updateQuery, [newRoleLevel, userId]);

                // Log the change
                const logQuery = `
                    INSERT INTO role_change_logs (player_id, old_role_id, new_role_id, changed_by, reason)
                    VALUES ($1, $2, $3, $4, $5)
                `;
                await client.query(logQuery, [userId, oldRoleId, newRoleLevel, changedBy, reason]);

                await client.query('COMMIT');

                GameLogger.info('User role changed', {
                    userId,
                    oldRoleId,
                    newRoleLevel,
                    changedBy,
                    reason
                });

                return true;

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }

        } catch (error) {
            GameLogger.error('Failed to change user role', {
                error: error.message,
                userId,
                newRoleLevel,
                changedBy
            });
            return false;
        }
    }

    /**
     * Get all available roles
     */
    static async getAllRoles() {
        try {
            const query = 'SELECT * FROM user_roles ORDER BY role_level';
            const result = await db.pool.query(query);
            return result.rows;
        } catch (error) {
            GameLogger.error('Failed to get roles', { error: error.message });
            return [];
        }
    }
}

module.exports = RoleAuth;