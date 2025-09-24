-- Run this manually: sudo -u postgres psql -d mudlands -f run-migration.sql

-- Create user roles table for multi-level permission system
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    role_level INTEGER UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO user_roles (role_name, role_level, description, permissions) VALUES
(
    'player',
    0,
    'Standard game player with basic access',
    '{"game_access": true, "chat": true, "character_management": true}'
),
(
    'tester',
    1,
    'Beta tester with bug reporting and testing tools access',
    '{"game_access": true, "chat": true, "character_management": true, "bug_reports": true, "testing_tools": true, "feedback_system": true}'
),
(
    'moderator',
    2,
    'Player moderator with limited administrative powers',
    '{"game_access": true, "chat": true, "character_management": true, "player_management": true, "chat_moderation": true, "kick_players": true, "mute_players": true, "view_player_logs": true}'
),
(
    'admin',
    3,
    'Game administrator with full system access',
    '{"game_access": true, "chat": true, "character_management": true, "player_management": true, "chat_moderation": true, "kick_players": true, "mute_players": true, "view_player_logs": true, "server_management": true, "world_editing": true, "ai_tools": true, "broadcast": true, "game_commands": true}'
),
(
    'super_admin',
    4,
    'Super administrator with role management and system configuration access',
    '{"game_access": true, "chat": true, "character_management": true, "player_management": true, "chat_moderation": true, "kick_players": true, "mute_players": true, "view_player_logs": true, "server_management": true, "world_editing": true, "ai_tools": true, "broadcast": true, "game_commands": true, "role_management": true, "system_config": true, "security_settings": true, "user_role_assignment": true}'
)
ON CONFLICT (role_name) DO NOTHING;

-- Add role_id column to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS role_id INTEGER DEFAULT 0 REFERENCES user_roles(role_level);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_players_role_id ON players(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_level ON user_roles(role_level);

-- Update existing admin user to admin role
UPDATE players SET role_id = 3 WHERE is_admin = TRUE;

-- Create audit log for role changes
CREATE TABLE IF NOT EXISTS role_change_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    old_role_id INTEGER,
    new_role_id INTEGER,
    changed_by UUID REFERENCES players(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Show results
SELECT 'Migration completed successfully!' as status;

-- Show role statistics
SELECT
    ur.role_name,
    ur.role_level,
    COUNT(p.id) as user_count
FROM user_roles ur
LEFT JOIN players p ON p.role_id = ur.role_level
GROUP BY ur.role_name, ur.role_level
ORDER BY ur.role_level;