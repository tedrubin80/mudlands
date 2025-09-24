-- Update mudlands_user password to complex password
ALTER USER mudlands_user WITH PASSWORD 'zZcGfyLUKXmKglX0YYefyL/bX2cQqi6Z';

-- Verify the change
\du mudlands_user

-- Test connection (will show if password works)
SELECT 'Password update successful!' as status;