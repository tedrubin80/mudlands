#!/bin/bash

# MUDlands Online Backup Script
# Creates comprehensive backups of the game database, files, and logs

set -e  # Exit on any error

# Configuration
BACKUP_DIR="/home/southerns/mudlands/backups"
MOUNT_BACKUP_DIR="/mnt/backups/mudlands"
FTP_BACKUP_DIR="/var/ftp/backups/mudlands"
APP_DIR="/home/southerns/mudlands/app"
DB_NAME="mudlands"
DB_USER="mudlands_user"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="mudlands_backup_${DATE}"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

log "${GREEN}=== MUDlands Backup Started ===${NC}"

# Create backup subdirectory
FULL_BACKUP_DIR="${BACKUP_DIR}/${BACKUP_NAME}"
mkdir -p "$FULL_BACKUP_DIR"

# 1. Database Backup
log "${YELLOW}Backing up PostgreSQL database...${NC}"
if pg_dump -h localhost -U "$DB_USER" -d "$DB_NAME" -f "${FULL_BACKUP_DIR}/database.sql"; then
    log "${GREEN}✓ Database backup completed${NC}"
    
    # Compress database backup
    gzip "${FULL_BACKUP_DIR}/database.sql"
    log "${GREEN}✓ Database backup compressed${NC}"
else
    log "${RED}✗ Database backup failed${NC}"
    exit 1
fi

# 2. Application Files Backup
log "${YELLOW}Backing up application files...${NC}"
if tar -czf "${FULL_BACKUP_DIR}/app_files.tar.gz" \
    -C "/home/southerns/mudlands" \
    --exclude="node_modules" \
    --exclude="logs/*.log" \
    --exclude="backups" \
    --exclude=".git" \
    "app/"; then
    log "${GREEN}✓ Application files backup completed${NC}"
else
    log "${RED}✗ Application files backup failed${NC}"
    exit 1
fi

# 3. World Data Backup (separate for easy access)
log "${YELLOW}Backing up world data...${NC}"
if cp "${APP_DIR}/src/data/world.json" "${FULL_BACKUP_DIR}/world.json"; then
    log "${GREEN}✓ World data backup completed${NC}"
else
    log "${RED}✗ World data backup failed${NC}"
fi

# 4. Configuration Backup
log "${YELLOW}Backing up configuration files...${NC}"
mkdir -p "${FULL_BACKUP_DIR}/config"
cp "${APP_DIR}/.env" "${FULL_BACKUP_DIR}/config/" 2>/dev/null || log "${YELLOW}Warning: .env file not found${NC}"
cp "${APP_DIR}/package.json" "${FULL_BACKUP_DIR}/config/"
cp "${APP_DIR}/package-lock.json" "${FULL_BACKUP_DIR}/config/" 2>/dev/null || true

# 5. Recent Logs Backup
log "${YELLOW}Backing up recent logs...${NC}"
mkdir -p "${FULL_BACKUP_DIR}/logs"
find "${APP_DIR}/logs" -name "*.log" -mtime -7 -exec cp {} "${FULL_BACKUP_DIR}/logs/" \; 2>/dev/null || true

# 6. Create backup manifest
log "${YELLOW}Creating backup manifest...${NC}"
cat > "${FULL_BACKUP_DIR}/BACKUP_INFO.txt" << EOF
MUDlands Online Backup Information
===================================
Backup Date: $(date)
Backup Name: ${BACKUP_NAME}
Server: $(hostname)
Application Version: $(cd "$APP_DIR" && npm list mudlands --depth=0 2>/dev/null | grep mudlands || echo "Unknown")

Contents:
- database.sql.gz: PostgreSQL database dump
- app_files.tar.gz: Application source code and assets
- world.json: Game world data
- config/: Configuration files (.env, package.json)
- logs/: Recent log files (last 7 days)

Restore Instructions:
1. Extract app_files.tar.gz to restore application files
2. Restore database: gunzip -c database.sql.gz | psql -U $DB_USER -d $DB_NAME
3. Copy world.json back to src/data/
4. Restore configuration files from config/
EOF

# 7. Calculate backup size
BACKUP_SIZE=$(du -sh "$FULL_BACKUP_DIR" | cut -f1)
log "${GREEN}✓ Backup manifest created (Size: ${BACKUP_SIZE})${NC}"

# 8. Create compressed archive of entire backup
log "${YELLOW}Creating compressed backup archive...${NC}"
cd "$BACKUP_DIR"
if tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"; then
    # Remove uncompressed backup directory
    rm -rf "$BACKUP_NAME"
    FINAL_SIZE=$(du -sh "${BACKUP_NAME}.tar.gz" | cut -f1)
    log "${GREEN}✓ Compressed backup created: ${BACKUP_NAME}.tar.gz (${FINAL_SIZE})${NC}"
else
    log "${RED}✗ Failed to create compressed backup${NC}"
    exit 1
fi

# 9. Cleanup old backups (keep last 30 days)
log "${YELLOW}Cleaning up old backups...${NC}"
find "$BACKUP_DIR" -name "mudlands_backup_*.tar.gz" -mtime +30 -delete 2>/dev/null || true
OLD_LOGS=$(find "$BACKUP_DIR" -name "backup.log.*" -mtime +30 -delete 2>/dev/null | wc -l)
if [ "$OLD_LOGS" -gt 0 ]; then
    log "${GREEN}✓ Cleaned up $OLD_LOGS old backup logs${NC}"
fi

# 10. Rotate log file if it gets too large (>10MB)
if [ -f "$LOG_FILE" ] && [ $(stat -c%s "$LOG_FILE") -gt 10485760 ]; then
    mv "$LOG_FILE" "${LOG_FILE}.$(date +%Y%m%d)"
    log "${GREEN}✓ Backup log rotated${NC}"
fi

# 11. Send notification (if curl is available and webhook is configured)
WEBHOOK_URL="${MUDLANDS_BACKUP_WEBHOOK:-}"
if [ -n "$WEBHOOK_URL" ] && command -v curl >/dev/null 2>&1; then
    curl -X POST "$WEBHOOK_URL" \
         -H "Content-Type: application/json" \
         -d "{\"text\":\"MUDlands backup completed successfully: ${BACKUP_NAME}.tar.gz (${FINAL_SIZE})\"}" \
         >/dev/null 2>&1 || true
fi

log "${GREEN}=== MUDlands Backup Completed Successfully ===${NC}"
log "Backup location: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
log "Backup size: ${FINAL_SIZE}"

# Return success
exit 0