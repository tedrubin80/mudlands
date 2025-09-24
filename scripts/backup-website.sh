#!/bin/bash

# Website Backup Script for MudLands Online
# Backs up the entire application directory with rotation

BACKUP_DIR="/mnt/HC_Volume_103339423/mudlands-backups/website"
SOURCE_DIR="/var/www/mudlands.online"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="mudlands_website_${DATE}.tar.gz"
DAYS_TO_KEEP=7

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting website backup..."
echo "Source: $SOURCE_DIR"
echo "Backup file: $BACKUP_FILE"
echo "Timestamp: $DATE"

# Create the backup (excluding backups directory and node_modules)
tar -czf "$BACKUP_DIR/$BACKUP_FILE" \
    --exclude="backups" \
    --exclude="app/node_modules" \
    --exclude="app/logs" \
    --exclude="*.log" \
    --warning=no-file-changed \
    -C "$(dirname $SOURCE_DIR)" \
    "$(basename $SOURCE_DIR)"

if [ $? -eq 0 ]; then
    echo "✅ Website backup completed successfully!"

    # Show backup size
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    echo "📦 Backup size: $BACKUP_SIZE"

    # Clean up old backups (keep only last 7 days)
    echo "🧹 Cleaning up old backups (keeping last $DAYS_TO_KEEP days)..."
    find "$BACKUP_DIR" -name "mudlands_website_*.tar.gz" -mtime +$DAYS_TO_KEEP -delete

    # Show current backup files
    echo "📂 Current backup files:"
    ls -lah "$BACKUP_DIR"/mudlands_website_*.tar.gz 2>/dev/null || echo "   No previous backups found"

    echo "✨ Website backup process completed!"
else
    echo "❌ Website backup failed!"
    exit 1
fi