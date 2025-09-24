#!/bin/bash

echo "🔄 Running role system migration..."

# Run the SQL migration as postgres superuser
sudo -u postgres psql -d mudlands -f /home/southerns/mudlands/app/src/database/migrations/001_create_user_roles.sql

if [ $? -eq 0 ]; then
    echo "✅ Role system migration completed successfully!"

    # Display current role statistics
    echo ""
    echo "📊 Current role statistics:"
    sudo -u postgres psql -d mudlands -c "
        SELECT
            ur.role_name,
            ur.role_level,
            COUNT(p.id) as user_count
        FROM user_roles ur
        LEFT JOIN players p ON p.role_id = ur.role_level
        GROUP BY ur.role_name, ur.role_level
        ORDER BY ur.role_level;
    "

    echo ""
    echo "🎉 Multi-level user permission system is now active!"
    echo "🔗 Access role management at: https://mudlands.online/admin/roles"

else
    echo "❌ Migration failed!"
    exit 1
fi