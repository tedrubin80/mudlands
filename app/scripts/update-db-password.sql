-- Update PostgreSQL user password
-- Run this with: sudo -u postgres psql -f update-db-password.sql

-- Update the mudlands_user password
ALTER USER mudlands_user WITH PASSWORD 'OggMx(x<4^fy^=+cifCOi#&ETr-)Lc(7';

-- Verify the change
\echo 'Password updated for mudlands_user'
\echo 'Remember to restart the application after this change'