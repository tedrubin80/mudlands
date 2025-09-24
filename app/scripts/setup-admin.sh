#!/bin/bash

echo "Setting up admin user in MudLands database..."

# Run PostgreSQL commands as postgres superuser
sudo -u postgres psql -d mudlands << EOF
-- Set mudlands_admin as admin
UPDATE players SET is_admin = TRUE WHERE username = 'mudlands_admin';

-- Verify it worked
SELECT username, email, is_admin FROM players WHERE username = 'mudlands_admin';

-- Reset the mudlands_user password to simple123
ALTER USER mudlands_user WITH PASSWORD 'simple123';

-- Show success message
SELECT 'Admin setup complete!' as status;
EOF

echo "Admin user setup complete!"
echo "You can now log into the admin panel at https://mudlands.online/admin"
echo "Credentials:"
echo "  Email: ted@theorubin.com"
echo "  Username: mudlands_admin"
echo "  Password: kekpiv-mypxox-1pyrRo"