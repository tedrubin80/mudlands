#!/bin/bash

# Mudlands Online Backup Script
# Comprehensive backup for database, codebase, and AI-generated content

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_BASE_DIR="/mnt/HC_Volume_103339423/CurrentMudlands"
LOCAL_BACKUP_DIR="$BACKUP_BASE_DIR"
REMOTE_BACKUP_DIR="$BACKUP_BASE_DIR/archive"
DATE_STAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="/var/log/mudlands-backup.log"

# Database Configuration (from .env)
DB_NAME="mudlands"
DB_USER="mudlands_user"
DB_HOST="127.0.0.1"
DB_PORT="5432"

# Retention periods (in days)
LOCAL_RETENTION_DAYS=30
REMOTE_RETENTION_DAYS=90

# Backup file names
DB_BACKUP_FILE="mudlands_db_${DATE_STAMP}.sql"
CODE_BACKUP_FILE="mudlands_code_${DATE_STAMP}.tar.gz"
AI_BACKUP_FILE="mudlands_ai_${DATE_STAMP}.tar.gz"
FULL_BACKUP_FILE="mudlands_full_${DATE_STAMP}.tar.gz"
CHECKSUM_FILE="mudlands_checksums_${DATE_STAMP}.json"

# Create backup directories
mkdir -p "$LOCAL_BACKUP_DIR"
mkdir -p "$REMOTE_BACKUP_DIR"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Error handling
handle_error() {
    log "ERROR: $1"
    exit 1
}

# Check if required commands exist
check_dependencies() {
    local deps=("pg_dump" "tar" "gzip")

    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            handle_error "$dep is not installed or not in PATH"
        fi
    done
}

# Get database password from .env file
get_db_password() {
    if [ -f "$SCRIPT_DIR/.env" ]; then
        grep "^DB_PASSWORD=" "$SCRIPT_DIR/.env" | cut -d'=' -f2
    else
        handle_error ".env file not found"
    fi
}

# Database backup
backup_database() {
    log "Starting database backup..."

    # Use postgres user for full database access
    sudo -u postgres pg_dump -d "$DB_NAME" \
        --verbose --clean --no-owner --no-privileges \
        > "$LOCAL_BACKUP_DIR/$DB_BACKUP_FILE" 2>> "$LOG_FILE"

    if [ $? -eq 0 ]; then
        log "Database backup completed: $DB_BACKUP_FILE"

        # Compress the SQL file
        gzip "$LOCAL_BACKUP_DIR/$DB_BACKUP_FILE"
        DB_BACKUP_FILE="${DB_BACKUP_FILE}.gz"

        log "Database backup compressed: $DB_BACKUP_FILE"
    else
        handle_error "Database backup failed"
    fi
}

# Codebase backup
backup_codebase() {
    log "Starting codebase backup..."

    # Exclude unnecessary files and directories
    tar -czf "$LOCAL_BACKUP_DIR/$CODE_BACKUP_FILE" \
        -C "$(dirname "$SCRIPT_DIR")" \
        --exclude="node_modules" \
        --exclude="*.log" \
        --exclude=".git" \
        --exclude="tmp" \
        --exclude="*.tmp" \
        --exclude="uploads" \
        --exclude="cache" \
        --exclude="mudlands_ai_analysis/implementation_logs" \
        "$(basename "$SCRIPT_DIR")" 2>> "$LOG_FILE"

    if [ $? -eq 0 ]; then
        log "Codebase backup completed: $CODE_BACKUP_FILE"
    else
        handle_error "Codebase backup failed"
    fi
}

# AI Content backup
backup_ai_content() {
    log "Starting AI content backup..."

    local ai_dir="$SCRIPT_DIR/mudlands_ai_analysis"

    if [ -d "$ai_dir" ]; then
        tar -czf "$LOCAL_BACKUP_DIR/$AI_BACKUP_FILE" \
            -C "$SCRIPT_DIR" \
            --exclude="implementation_logs/*.log" \
            --exclude="*.tmp" \
            "mudlands_ai_analysis" 2>> "$LOG_FILE"

        if [ $? -eq 0 ]; then
            log "AI content backup completed: $AI_BACKUP_FILE"
        else
            handle_error "AI content backup failed"
        fi
    else
        log "AI content directory not found, skipping AI backup"
    fi
}

# Create combined backup
create_full_backup() {
    log "Creating full backup archive..."

    cd "$LOCAL_BACKUP_DIR"

    # Create combined archive
    tar -czf "$FULL_BACKUP_FILE" \
        "$DB_BACKUP_FILE" \
        "$CODE_BACKUP_FILE" \
        "$AI_BACKUP_FILE" 2>> "$LOG_FILE"

    if [ $? -eq 0 ]; then
        log "Full backup archive created: $FULL_BACKUP_FILE"

        # Remove individual files to save space
        rm -f "$DB_BACKUP_FILE" "$CODE_BACKUP_FILE" "$AI_BACKUP_FILE"
        log "Individual backup files cleaned up"
    else
        handle_error "Full backup creation failed"
    fi
}

# Generate checksums
generate_checksums() {
    log "Generating checksums..."

    cd "$LOCAL_BACKUP_DIR"

    # Calculate checksums for verification
    local full_backup_path="$LOCAL_BACKUP_DIR/$FULL_BACKUP_FILE"

    if [ -f "$full_backup_path" ]; then
        local md5_sum=$(md5sum "$FULL_BACKUP_FILE" | cut -d' ' -f1)
        local sha256_sum=$(sha256sum "$FULL_BACKUP_FILE" | cut -d' ' -f1)
        local file_size=$(stat -c%s "$FULL_BACKUP_FILE")

        # Create checksum JSON
        cat > "$CHECKSUM_FILE" << EOF
{
    "backup_date": "$(date -Iseconds)",
    "full_backup_file": "$FULL_BACKUP_FILE",
    "file_size_bytes": $file_size,
    "md5_checksum": "$md5_sum",
    "sha256_checksum": "$sha256_sum",
    "components": {
        "database": "$DB_BACKUP_FILE",
        "codebase": "$CODE_BACKUP_FILE",
        "ai_content": "$AI_BACKUP_FILE"
    },
    "retention": {
        "local_days": $LOCAL_RETENTION_DAYS,
        "remote_days": $REMOTE_RETENTION_DAYS
    }
}
EOF

        log "Checksums generated: $CHECKSUM_FILE"
    else
        handle_error "Full backup file not found for checksum generation"
    fi
}

# Copy to web accessible location for download
copy_to_downloads() {
    log "Copying backup to web downloads..."

    local download_dir="$SCRIPT_DIR/public/downloads"
    mkdir -p "$download_dir"

    # Copy latest backup to downloads with generic name
    cp "$LOCAL_BACKUP_DIR/$FULL_BACKUP_FILE" "$download_dir/mudlands_latest_backup.tar.gz"
    cp "$LOCAL_BACKUP_DIR/$CHECKSUM_FILE" "$download_dir/mudlands_latest_checksums.json"

    # Also keep timestamped version
    cp "$LOCAL_BACKUP_DIR/$FULL_BACKUP_FILE" "$download_dir/$FULL_BACKUP_FILE"

    log "Backup copied to downloads directory"
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up old backups..."

    # Local cleanup
    find "$LOCAL_BACKUP_DIR" -name "mudlands_full_*.tar.gz" -mtime +$LOCAL_RETENTION_DAYS -delete
    find "$LOCAL_BACKUP_DIR" -name "mudlands_checksums_*.json" -mtime +$LOCAL_RETENTION_DAYS -delete

    # Downloads cleanup (keep last 7 timestamped backups)
    if [ -d "$SCRIPT_DIR/public/downloads" ]; then
        find "$SCRIPT_DIR/public/downloads" -name "mudlands_full_*.tar.gz" -mtime +7 -delete
    fi

    log "Old backup cleanup completed"
}

# Verify backup integrity
verify_backup() {
    log "Verifying backup integrity..."

    local backup_path="$LOCAL_BACKUP_DIR/$FULL_BACKUP_FILE"

    if [ -f "$backup_path" ]; then
        # Test archive integrity
        if tar -tzf "$backup_path" > /dev/null 2>&1; then
            log "Backup archive integrity verified"

            # Verify against checksum
            local current_md5=$(md5sum "$backup_path" | cut -d' ' -f1)
            local stored_md5=$(grep '"md5_checksum"' "$LOCAL_BACKUP_DIR/$CHECKSUM_FILE" | cut -d'"' -f4)

            if [ "$current_md5" = "$stored_md5" ]; then
                log "Backup checksum verification passed"
                return 0
            else
                log "WARNING: Backup checksum verification failed"
                return 1
            fi
        else
            handle_error "Backup archive integrity check failed"
        fi
    else
        handle_error "Backup file not found for verification"
    fi
}

# Send notification (optional - can be extended)
send_notification() {
    local status=$1
    local message=$2

    # Log the notification (extend this for email/slack/etc)
    log "NOTIFICATION [$status]: $message"

    # Optional: Send to admin email if configured
    # echo "$message" | mail -s "Mudlands Backup $status" "$ADMIN_EMAIL"
}

# Main backup process
main() {
    log "=== Starting Mudlands Backup Process ==="

    local start_time=$(date +%s)

    check_dependencies

    # Perform backups
    backup_database
    backup_codebase
    backup_ai_content
    create_full_backup
    generate_checksums
    copy_to_downloads

    # Verification
    if verify_backup; then
        cleanup_old_backups

        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        local backup_size=$(du -h "$LOCAL_BACKUP_DIR/$FULL_BACKUP_FILE" | cut -f1)

        local success_msg="Backup completed successfully in ${duration}s. Size: $backup_size"
        log "$success_msg"
        send_notification "SUCCESS" "$success_msg"
    else
        local error_msg="Backup verification failed"
        log "ERROR: $error_msg"
        send_notification "FAILED" "$error_msg"
        exit 1
    fi

    log "=== Backup Process Complete ==="
}

# Handle command line arguments
case "${1:-full}" in
    "full")
        main
        ;;
    "database")
        log "=== Database Only Backup ==="
        check_dependencies
        backup_database
        log "=== Database Backup Complete ==="
        ;;
    "code")
        log "=== Codebase Only Backup ==="
        check_dependencies
        backup_codebase
        log "=== Codebase Backup Complete ==="
        ;;
    "ai")
        log "=== AI Content Only Backup ==="
        check_dependencies
        backup_ai_content
        log "=== AI Backup Complete ==="
        ;;
    "verify")
        if [ -n "$2" ]; then
            FULL_BACKUP_FILE="$2"
            verify_backup
        else
            echo "Usage: $0 verify <backup_filename>"
            exit 1
        fi
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    *)
        echo "Usage: $0 [full|database|code|ai|verify|cleanup]"
        echo "  full     - Complete backup (default)"
        echo "  database - Database only"
        echo "  code     - Codebase only"
        echo "  ai       - AI content only"
        echo "  verify   - Verify backup integrity"
        echo "  cleanup  - Clean old backups"
        exit 1
        ;;
esac