#!/bin/bash

# Database Backup Script for MudLands Online
# Backs up the PostgreSQL database with rotation

BACKUP_DIR="/mnt/HC_Volume_103339423/mudlands-backups/database"
DB_NAME="mudlands"
DB_USER="mudlands_user"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="mudlands_backup_${DATE}.sql"
DAYS_TO_KEEP=7

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting database backup..."
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"
echo "Timestamp: $DATE"

# Perform the backup using sudo as postgres user
echo 'jazqen-mezMy8-hukrys' | sudo -S -u postgres pg_dump -d $DB_NAME > "$BACKUP_DIR/$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Database backup completed successfully!"

    # Compress the backup
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    echo "🗜️  Backup compressed to ${BACKUP_FILE}.gz"

    # Clean up old backups (keep only last 7 days)
    echo "🧹 Cleaning up old backups (keeping last $DAYS_TO_KEEP days)..."
    find "$BACKUP_DIR" -name "mudlands_backup_*.sql.gz" -mtime +$DAYS_TO_KEEP -delete

    # Show current backup files
    echo "📂 Current backup files:"
    ls -lah "$BACKUP_DIR"/mudlands_backup_*.sql.gz 2>/dev/null || echo "   No previous backups found"

    echo "✨ Database backup process completed!"
else
    echo "❌ Database backup failed!"
    exit 1
fi