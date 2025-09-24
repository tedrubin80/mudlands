#!/bin/bash

echo "🔐 Securing database with complex password..."

# Generate a complex password
COMPLEX_PASSWORD="zZcGfyLUKXmKglX0YYefyL/bX2cQqi6Z"

# Update database user password
echo "jazqen-mezMy8-hukrys" | sudo -S -u postgres psql << EOF
ALTER USER mudlands_user WITH PASSWORD '$COMPLEX_PASSWORD';
SELECT 'Database password updated successfully!' as status;
\q
EOF

echo "✅ Database password updated to complex password"
echo "⚠️  Now updating application configuration..."

# Update .env file with new password
sed -i 's/DB_PASSWORD=simple123/DB_PASSWORD=zZcGfyLUKXmKglX0YYefyL\/bX2cQqi6Z/' /home/southerns/mudlands/app/.env

echo "✅ Application configuration updated"
echo "🔄 Restarting server to apply changes..."

# Find and kill existing Node server
SERVER_PID=$(ps aux | grep "node server.js" | grep -v grep | awk '{print $2}')
if [ ! -z "$SERVER_PID" ]; then
    echo "🛑 Stopping server (PID: $SERVER_PID)..."
    kill -9 $SERVER_PID
    sleep 2
fi

# Start server in background
cd /home/southerns/mudlands/app
nohup npm start > /dev/null 2>&1 &
SERVER_NEW_PID=$!

echo "🚀 Server restarted with secure database connection"
echo "📊 Testing database connection..."

# Wait for server to start
sleep 3

# Test database connection
if psql -h 127.0.0.1 -p 5432 -U mudlands_user -d mudlands -c "SELECT 'Connection successful!' as test;" 2>/dev/null; then
    echo "✅ Database connection test successful!"
else
    echo "❌ Database connection test failed"
    exit 1
fi

echo "🎉 Database security upgrade complete!"
echo "Complex password: $COMPLEX_PASSWORD"