#!/bin/bash

# MUDlands Online Backup Script
# Backs up application, database, and logs to external drive and FTP

set -e

# Configuration
MUD_DIR="/home/southerns/mudlands/app"
EXTERNAL_BACKUP_DIR="/mnt/HC_Volume_103143258/mudlands-backups"
FTP_SITE_DIR="/home/southerns/ftp/mudlands.online"
FTP_BACKUP_DIR="/home/southerns/ftp/mudlands.online/backup"
FTP_MIRROR_DIR="/home/southerns/ftp/mudlands.online/mirror"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="mudlands_backup_$DATE"
LOG_FILE="/var/log/mudlands-backup.log"

# Ensure backup directories exist
echo "$(date): Starting MUDlands backup..." | tee -a "$LOG_FILE"

mkdir -p "$EXTERNAL_BACKUP_DIR"
mkdir -p "$FTP_SITE_DIR"
mkdir -p "$FTP_BACKUP_DIR"
mkdir -p "$FTP_MIRROR_DIR"

# Create temporary backup directory
TEMP_BACKUP_DIR="/tmp/$BACKUP_NAME"
mkdir -p "$TEMP_BACKUP_DIR"

# Function to log with timestamp
log() {
    echo "$(date): $1" | tee -a "$LOG_FILE"
}

# Backup application files
log "Backing up application files..."
cd "$MUD_DIR"
tar -czf "$TEMP_BACKUP_DIR/app_files.tar.gz" \
    --exclude=node_modules \
    --exclude=logs/*.log \
    --exclude=.git \
    .

# Backup database
log "Backing up PostgreSQL database..."
export PGPASSWORD='your_secure_password_here'
pg_dump -h localhost -U mudlands_user -d mudlands > "$TEMP_BACKUP_DIR/database_dump.sql"

# Backup logs (last 30 days)
log "Backing up recent logs..."
mkdir -p "$TEMP_BACKUP_DIR/logs"
find "$MUD_DIR/logs" -name "*.log" -mtime -30 -exec cp {} "$TEMP_BACKUP_DIR/logs/" \;

# Create system info file
log "Creating system info file..."
cat > "$TEMP_BACKUP_DIR/system_info.txt" << EOF
MUDlands Online Backup Info
===========================
Backup Date: $(date)
Server: $(hostname)
MUD Directory: $MUD_DIR
Node Version: $(node --version)
NPM Version: $(npm --version)
PostgreSQL Version: $(psql --version)

Database Status:
$(systemctl status postgresql --no-pager -l)

Disk Usage:
$(df -h)

Application Status:
$(ps aux | grep node | grep -v grep)
EOF

# Create final backup archive
log "Creating final backup archive..."
cd /tmp
tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME/"

# Copy to external drive
log "Copying backup to external drive..."
cp "$BACKUP_NAME.tar.gz" "$EXTERNAL_BACKUP_DIR/"

# Copy to FTP directory
log "Copying backup to FTP directory..."
cp "$BACKUP_NAME.tar.gz" "$FTP_BACKUP_DIR/"

# Create mirror copy in FTP with current application state
log "Creating mirror copy in FTP..."
rsync -av --delete \
    --exclude=node_modules \
    --exclude=logs/*.log \
    --exclude=.git \
    "$MUD_DIR/" "$FTP_MIRROR_DIR/app/"

# Copy database dump to mirror
mkdir -p "$FTP_MIRROR_DIR/database/"
cp "$TEMP_BACKUP_DIR/database_dump.sql" "$FTP_MIRROR_DIR/database/latest_dump.sql"

# Copy system info to mirror
cp "$TEMP_BACKUP_DIR/system_info.txt" "$FTP_MIRROR_DIR/system_info_latest.txt"

# Cleanup old backups (keep last 4 weeks on external, 2 weeks on FTP)
log "Cleaning up old backups..."

# External drive - keep 4 weeks
find "$EXTERNAL_BACKUP_DIR" -name "mudlands_backup_*.tar.gz" -mtime +28 -delete

# FTP - keep 2 weeks
find "$FTP_BACKUP_DIR" -name "mudlands_backup_*.tar.gz" -mtime +14 -delete

# Cleanup temp files
rm -rf "$TEMP_BACKUP_DIR"
rm "/tmp/$BACKUP_NAME.tar.gz"

# Backup verification
EXTERNAL_SIZE=$(stat -c%s "$EXTERNAL_BACKUP_DIR/$BACKUP_NAME.tar.gz" 2>/dev/null || echo "0")
FTP_SIZE=$(stat -c%s "$FTP_BACKUP_DIR/$BACKUP_NAME.tar.gz" 2>/dev/null || echo "0")

log "Backup completed successfully!"
log "External backup size: $EXTERNAL_SIZE bytes"
log "FTP backup size: $FTP_SIZE bytes"

# Send notification (if mail is configured)
if command -v mail >/dev/null 2>&1; then
    echo "MUDlands backup completed at $(date). Backup size: $EXTERNAL_SIZE bytes" | \
        mail -s "MUDlands Backup Success" root
fi

log "=== Backup script finished ==="