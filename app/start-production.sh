#!/bin/bash

# MUDlands Online Production Startup Script
# Ensures proper FQDN usage and secure configuration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}MUDlands Online Production Startup${NC}"
echo -e "${GREEN}==================================${NC}"

# Check if production env file exists
if [ ! -f "$APP_DIR/.env.production" ]; then
    echo -e "${RED}Error: .env.production file not found${NC}"
    echo -e "${YELLOW}Please ensure .env.production exists with proper configuration${NC}"
    exit 1
fi

# Copy production env to active env
echo -e "${YELLOW}Loading production configuration...${NC}"
cp "$APP_DIR/.env.production" "$APP_DIR/.env"

# Verify domain configuration
DOMAIN=$(grep "^DOMAIN=" "$APP_DIR/.env" | cut -d'=' -f2)
if [ "$DOMAIN" != "mudlands.online" ]; then
    echo -e "${RED}Error: Domain not set to mudlands.online${NC}"
    echo -e "${YELLOW}Current domain: $DOMAIN${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Domain configured: $DOMAIN${NC}"

# Check SSL certificates
SSL_CERT_PATH="/etc/letsencrypt/live/mudlands.online/fullchain.pem"
SSL_KEY_PATH="/etc/letsencrypt/live/mudlands.online/privkey.pem"

if [ ! -f "$SSL_CERT_PATH" ] || [ ! -f "$SSL_KEY_PATH" ]; then
    echo -e "${YELLOW}Warning: SSL certificates not found${NC}"
    echo -e "${YELLOW}Expected locations:${NC}"
    echo -e "  Cert: $SSL_CERT_PATH"
    echo -e "  Key: $SSL_KEY_PATH"
    echo -e "${YELLOW}The server will start but HTTPS may not work properly${NC}"
fi

# Verify no localhost references in client files
echo -e "${YELLOW}Verifying client configuration...${NC}"
if grep -q "localhost\|127.0.0.1" "$APP_DIR/public/js/config.js" 2>/dev/null; then
    echo -e "${YELLOW}Warning: localhost references found in client config${NC}"
    echo -e "${YELLOW}These will be overridden by production detection${NC}"
fi

# Check if AI services are running
echo -e "${YELLOW}Checking AI services...${NC}"
if curl -f http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
    echo -e "${GREEN}✓ AI services (Ollama) are running${NC}"
else
    echo -e "${YELLOW}AI services not detected - AI features will use fallback${NC}"
fi

# Check Redis
echo -e "${YELLOW}Checking Redis...${NC}"
if redis-cli ping >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis is running${NC}"
else
    echo -e "${RED}Warning: Redis is not running${NC}"
    echo -e "${YELLOW}Starting Redis...${NC}"
    sudo systemctl start redis-server || echo -e "${RED}Failed to start Redis${NC}"
fi

# Check PostgreSQL
echo -e "${YELLOW}Checking PostgreSQL...${NC}"
if pg_isready >/dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
else
    echo -e "${RED}Warning: PostgreSQL is not running${NC}"
    echo -e "${YELLOW}Starting PostgreSQL...${NC}"
    sudo systemctl start postgresql || echo -e "${RED}Failed to start PostgreSQL${NC}"
fi

# Create necessary directories
mkdir -p "$APP_DIR/logs"
mkdir -p "$APP_DIR/data/ai/cache"
mkdir -p "$APP_DIR/data/ai/generated"

# Install dependencies if needed
if [ ! -d "$APP_DIR/node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install --production
fi

# Initialize database if needed
echo -e "${YELLOW}Ensuring database is initialized...${NC}"
node "$APP_DIR/src/config/database-setup.js" || echo -e "${YELLOW}Database already initialized${NC}"

# Start the server with PM2 (if available) or node
if command -v pm2 >/dev/null 2>&1; then
    echo -e "${GREEN}Starting MUDlands with PM2...${NC}"
    
    # Stop existing instance if running
    pm2 stop mudlands 2>/dev/null || true
    
    # Start with PM2
    pm2 start "$APP_DIR/server.js" \
        --name "mudlands" \
        --env production \
        --log "$APP_DIR/logs/mudlands.log" \
        --error "$APP_DIR/logs/mudlands-error.log" \
        --merge-logs \
        --time \
        --watch false \
        --max-memory-restart 1G
    
    pm2 save
    
    echo -e "${GREEN}✓ MUDlands started with PM2${NC}"
    echo -e "${YELLOW}View logs: pm2 logs mudlands${NC}"
    echo -e "${YELLOW}Monitor: pm2 monit${NC}"
    echo -e "${YELLOW}Stop: pm2 stop mudlands${NC}"
else
    echo -e "${GREEN}Starting MUDlands with Node.js...${NC}"
    echo -e "${YELLOW}Consider installing PM2 for production: npm install -g pm2${NC}"
    
    # Start with node (will run in foreground)
    NODE_ENV=production node "$APP_DIR/server.js"
fi

echo -e "\n${GREEN}==================================${NC}"
echo -e "${GREEN}MUDlands Online is now running!${NC}"
echo -e "${GREEN}==================================${NC}"
echo -e "\n${YELLOW}Access Points:${NC}"
echo -e "  Web: https://mudlands.online"
echo -e "  API: https://mudlands.online/api"
echo -e "  AI Health: https://mudlands.online/api/ai/health"
echo -e "\n${YELLOW}Admin Credentials:${NC}"
echo -e "  Username: mudlands_admin"
echo -e "  Password: [Check .env.production]"
echo -e "\n${GREEN}All services use internal connections (127.0.0.1)${NC}"
echo -e "${GREEN}External access only through mudlands.online domain${NC}"