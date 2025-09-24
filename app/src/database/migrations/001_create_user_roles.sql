-- Create user roles table for multi-level permission system
-- Role hierarchy: Player (0) -> Tester (1) -> Moderator (2) -> Admin (3) -> Super Admin (4)

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

-- Create index for faster role lookups
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

-- Add trigger to log role changes
CREATE OR REPLACE FUNCTION log_role_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.role_id IS DISTINCT FROM NEW.role_id THEN
        INSERT INTO role_change_logs (player_id, old_role_id, new_role_id)
        VALUES (NEW.id, OLD.role_id, NEW.role_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS role_change_trigger ON players;
CREATE TRIGGER role_change_trigger
    AFTER UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION log_role_changes();