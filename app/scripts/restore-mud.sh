#!/bin/bash

# MUDlands Online Restore Script
# Restores from backup archive

set -e

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <backup_archive.tar.gz>"
    echo "Available backups:"
    echo "External Drive:"
    ls -la /mnt/HC_Volume_103143258/mudlands-backups/*.tar.gz 2>/dev/null | tail -5 || echo "No backups found"
    echo "FTP Directory:"
    ls -la /home/southerns/ftp/mud/*.tar.gz 2>/dev/null | tail -5 || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"
MUD_DIR="/home/southerns/mud"
RESTORE_DIR="/tmp/mudlands_restore_$(date +%Y%m%d_%H%M%S)"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file $BACKUP_FILE not found!"
    exit 1
fi

echo "WARNING: This will restore from $BACKUP_FILE and may overwrite current data!"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

echo "Creating restore directory..."
mkdir -p "$RESTORE_DIR"
cd "$RESTORE_DIR"

echo "Extracting backup..."
tar -xzf "$BACKUP_FILE"

BACKUP_DIR=$(find . -maxdepth 1 -type d -name "mudlands_backup_*" | head -1)
if [ -z "$BACKUP_DIR" ]; then
    echo "Error: No backup directory found in archive!"
    exit 1
fi

cd "$BACKUP_DIR"

echo "Stopping MUD application..."
pkill -f "node server.js" || true

echo "Restoring application files..."
cd "$MUD_DIR"
tar -xzf "$RESTORE_DIR/$BACKUP_DIR/app_files.tar.gz"

echo "Restoring database..."
export PGPASSWORD='your_secure_password_here'
dropdb -h localhost -U mudlands_user mudlands || true
createdb -h localhost -U mudlands_user mudlands
psql -h localhost -U mudlands_user -d mudlands < "$RESTORE_DIR/$BACKUP_DIR/database_dump.sql"

echo "Restoring logs..."
cp -r "$RESTORE_DIR/$BACKUP_DIR/logs/"* "$MUD_DIR/logs/" 2>/dev/null || true

echo "Installing dependencies..."
cd "$MUD_DIR"
npm install

echo "Starting MUD application..."
npm start &

echo "Cleanup..."
rm -rf "$RESTORE_DIR"

echo "Restore completed successfully!"
echo "Check the application logs to ensure everything is working properly."