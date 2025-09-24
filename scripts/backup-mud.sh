#!/bin/bash

# MudLands Online - Complete Backup Script
# This script backs up both the application files and database

# Configuration
APP_DIR="/var/www/mudlands.online"
BACKUP_DIR="/mnt/HC_Volume_103339423/mudlands-backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="mudlands_complete_${DATE}"

# Database configuration
DB_NAME="mudlands"
DB_USER="mudlands_user"
DB_HOST="localhost"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting MudLands complete backup: $BACKUP_NAME"

# Create temporary backup directory
TEMP_BACKUP_DIR="/tmp/${BACKUP_NAME}"
mkdir -p "$TEMP_BACKUP_DIR"

# Backup application files
log "Backing up application files..."
tar -czf "$TEMP_BACKUP_DIR/mudlands_app.tar.gz" \
    --exclude='node_modules' \
    --exclude='logs/*.log' \
    --exclude='.env.backup.*' \
    --exclude='*.tmp' \
    -C "$APP_DIR" .

if [ $? -eq 0 ]; then
    log "Application files backup completed successfully"
else
    log "ERROR: Application files backup failed"
    exit 1
fi

# Backup database
log "Backing up database..."
echo 'jazqen-mezMy8-hukrys' | sudo -S -u postgres pg_dump -d $DB_NAME > "$TEMP_BACKUP_DIR/mudlands_database.sql"

if [ $? -eq 0 ]; then
    log "Database backup completed successfully"
else
    log "ERROR: Database backup failed"
    exit 1
fi

# Create final compressed backup
log "Creating final backup archive..."
cd /tmp
tar -czf "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}/"

if [ $? -eq 0 ]; then
    log "Final backup archive created successfully: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
else
    log "ERROR: Failed to create final backup archive"
    exit 1
fi

# Cleanup temporary files
rm -rf "$TEMP_BACKUP_DIR"

# Remove backups older than 30 days
log "Cleaning up old backups (older than 30 days)..."
find "$BACKUP_DIR" -name "mudlands_complete_*.tar.gz" -mtime +30 -delete

log "MudLands backup completed successfully"

# Display backup information
BACKUP_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" | cut -f1)
log "Backup size: $BACKUP_SIZE"
log "Backup location: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"