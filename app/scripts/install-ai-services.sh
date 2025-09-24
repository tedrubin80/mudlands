#!/bin/bash

# MUDlands AI Services Installation Script
# This script sets up the AI infrastructure for content generation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
DOCKER_DIR="$APP_DIR/docker"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}MUDlands AI Services Installation${NC}"
echo -e "${GREEN}==================================${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to create directory if it doesn't exist
ensure_directory() {
    if [ ! -d "$1" ]; then
        echo -e "${YELLOW}Creating directory: $1${NC}"
        sudo mkdir -p "$1"
        sudo chown $USER:$USER "$1"
    fi
}

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command_exists docker; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
    echo -e "${RED}Docker Compose is not available. Please install Docker Compose first.${NC}"
    exit 1
fi

# Check Docker daemon
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}Docker daemon is not running. Please start Docker.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites met${NC}"

# Create AI storage directories
echo -e "\n${YELLOW}Setting up AI storage directories...${NC}"

# Check if we need to use sudo for /mnt
if [ -w /mnt ]; then
    SUDO_CMD=""
else
    SUDO_CMD="sudo"
    echo -e "${YELLOW}Note: sudo required for /mnt directory operations${NC}"
fi

# Create storage directories
$SUDO_CMD mkdir -p /mnt/ai-storage/models
$SUDO_CMD mkdir -p /mnt/ai-storage/content
$SUDO_CMD mkdir -p /mnt/ai-storage/cache

# Set permissions
$SUDO_CMD chown -R $USER:$USER /mnt/ai-storage
chmod -R 755 /mnt/ai-storage

echo -e "${GREEN}✓ Storage directories created${NC}"

# Check available disk space
echo -e "\n${YELLOW}Checking disk space...${NC}"
AVAILABLE_SPACE=$(df -BG /mnt | awk 'NR==2 {print $4}' | sed 's/G//')

if [ "$AVAILABLE_SPACE" -lt 50 ]; then
    echo -e "${RED}Warning: Less than 50GB available on /mnt${NC}"
    echo -e "${YELLOW}Available: ${AVAILABLE_SPACE}GB${NC}"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ Sufficient disk space available: ${AVAILABLE_SPACE}GB${NC}"
fi

# Build custom Ollama image
echo -e "\n${YELLOW}Building custom Ollama Docker image...${NC}"
cd "$DOCKER_DIR/ollama"

if [ -f Dockerfile ]; then
    docker build -t mudlands-ollama:latest .
    echo -e "${GREEN}✓ Custom Ollama image built${NC}"
else
    echo -e "${YELLOW}No custom Dockerfile found, using default Ollama image${NC}"
fi

# Start AI services
echo -e "\n${YELLOW}Starting AI services...${NC}"
cd "$DOCKER_DIR"

docker compose -f docker-compose.ai.yml up -d

# Wait for services to be healthy
echo -e "\n${YELLOW}Waiting for services to be healthy...${NC}"

MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker exec mudlands-ollama curl -f http://localhost:11434/api/tags >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Ollama service is healthy${NC}"
        break
    fi
    echo -n "."
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "\n${RED}Ollama service failed to start properly${NC}"
    docker-compose -f docker-compose.ai.yml logs ollama
    exit 1
fi

# Pull Llama model
echo -e "\n${YELLOW}Pulling Llama 3.1 8B model (this may take several minutes)...${NC}"
docker exec mudlands-ollama ollama pull llama3.1:8b

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Llama 3.1 8B model downloaded successfully${NC}"
else
    echo -e "${RED}Failed to download Llama model${NC}"
    exit 1
fi

# Verify Redis AI cache
echo -e "\n${YELLOW}Verifying Redis AI cache...${NC}"
if docker exec mudlands-redis-ai redis-cli ping >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis AI cache is running${NC}"
else
    echo -e "${RED}Redis AI cache failed to start${NC}"
    exit 1
fi

# Create AI directories in app
echo -e "\n${YELLOW}Creating AI application directories...${NC}"
mkdir -p "$APP_DIR/src/ai/prompts"
mkdir -p "$APP_DIR/src/ai/validators"
mkdir -p "$APP_DIR/src/ai/processors"
mkdir -p "$APP_DIR/data/ai/cache"
mkdir -p "$APP_DIR/data/ai/generated"
mkdir -p "$APP_DIR/data/ai/templates"

echo -e "${GREEN}✓ Application directories created${NC}"

# Display service status
echo -e "\n${GREEN}==================================${NC}"
echo -e "${GREEN}AI Services Installation Complete${NC}"
echo -e "${GREEN}==================================${NC}"

echo -e "\n${YELLOW}Service Status:${NC}"
docker compose -f "$DOCKER_DIR/docker-compose.ai.yml" ps

echo -e "\n${YELLOW}Available Models:${NC}"
docker exec mudlands-ollama ollama list

echo -e "\n${GREEN}Services are running at:${NC}"
echo -e "  Ollama API: http://localhost:11434"
echo -e "  Redis AI Cache: localhost:6380"
echo -e "  Monitoring: http://localhost:9100/metrics"

echo -e "\n${YELLOW}To stop services:${NC}"
echo -e "  cd $DOCKER_DIR && docker compose -f docker-compose.ai.yml down"

echo -e "\n${YELLOW}To view logs:${NC}"
echo -e "  cd $DOCKER_DIR && docker compose -f docker-compose.ai.yml logs -f"

echo -e "\n${GREEN}Next steps:${NC}"
echo -e "  1. Update .env file with AI service configuration"
echo -e "  2. Run the application with AI features enabled"
echo -e "  3. Monitor AI content generation in logs"

exit 0