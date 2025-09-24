#!/bin/bash

# monitor_ai_characters.sh
# Monitors AI-generated character files and notifies the game system

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOG_FILE="$SCRIPT_DIR/implementation_logs/character_deployment.log"

# Ensure log directory exists
mkdir -p "$SCRIPT_DIR/implementation_logs"

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S'): $1" >> "$LOG_FILE"
}

# Function to send notification to game server
notify_server() {
    local endpoint=$1
    local data=$2

    # Check if server is running
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health | grep -q "200"; then
        curl -X POST "http://localhost:3000/api/$endpoint" \
             -H "Content-Type: application/json" \
             -d "$data" \
             2>/dev/null
    else
        log_message "WARNING: Game server not responding, notification skipped"
    fi
}

# Check for new characters ready for testing
check_new_characters() {
    local new_chars_dir="$SCRIPT_DIR/character_profiles/manual_test_queue/ready_for_testing"
    local new_count=0

    if [ -d "$new_chars_dir" ]; then
        new_count=$(find "$new_chars_dir" -name "*.json" -type f 2>/dev/null | wc -l)

        if [ $new_count -gt 0 ]; then
            log_message "Found $new_count new characters ready for manual testing"

            # Get character names for notification
            char_names=$(find "$new_chars_dir" -name "*.json" -type f -exec basename {} .json \; | tr '\n' ',')

            # Send notification to game server
            notify_server "notify/new-characters" "{\"count\": $new_count, \"characters\": \"$char_names\"}"

            echo "New characters ready for testing: $new_count"
        fi
    fi
}

# Check for characters currently being tested
check_testing_characters() {
    local testing_dir="$SCRIPT_DIR/character_profiles/manual_test_queue/currently_testing"
    local testing_count=0

    if [ -d "$testing_dir" ]; then
        testing_count=$(find "$testing_dir" -name "*.json" -type f 2>/dev/null | wc -l)

        if [ $testing_count -gt 0 ]; then
            log_message "Characters currently in testing: $testing_count"
        fi
    fi
}

# Check for approved characters ready for auto-play
check_approved_characters() {
    local approved_dir="$SCRIPT_DIR/character_profiles/manual_test_queue/approved_for_auto"
    local active_dir="$SCRIPT_DIR/character_profiles/auto_players/active"
    local approved_count=0

    if [ -d "$approved_dir" ]; then
        approved_count=$(find "$approved_dir" -name "*.json" -type f 2>/dev/null | wc -l)

        if [ $approved_count -gt 0 ]; then
            log_message "Found $approved_count characters approved for auto-play activation"

            # Create active directory if it doesn't exist
            mkdir -p "$active_dir"

            # Move approved characters to active auto-players
            for char_file in "$approved_dir"/*.json; do
                if [ -f "$char_file" ]; then
                    char_name=$(basename "$char_file")
                    mv "$char_file" "$active_dir/"
                    log_message "Activated auto-player: $char_name"

                    # Notify server of new auto-player
                    notify_server "auto-players/activate" "{\"character\": \"$char_name\"}"
                fi
            done
        fi
    fi
}

# Check active auto-players
check_active_autoplayers() {
    local active_dir="$SCRIPT_DIR/character_profiles/auto_players/active"
    local active_count=0

    if [ -d "$active_dir" ]; then
        active_count=$(find "$active_dir" -name "*.json" -type f 2>/dev/null | wc -l)

        if [ $active_count -gt 0 ]; then
            log_message "Active auto-players: $active_count"
            echo "Active auto-players: $active_count"
        fi
    fi
}

# Generate daily report
generate_daily_report() {
    local report_date=$(date '+%Y-%m-%d')
    local report_file="$SCRIPT_DIR/daily_reports/${report_date}_session_summary.md"

    # Create report directory if it doesn't exist
    mkdir -p "$SCRIPT_DIR/daily_reports"

    cat > "$report_file" << EOF
# Mudlands AI Character System - Daily Report
## Date: $report_date

### Character Pipeline Status

#### Ready for Testing
$(find "$SCRIPT_DIR/character_profiles/manual_test_queue/ready_for_testing" -name "*.json" 2>/dev/null | wc -l) characters

#### Currently Testing
$(find "$SCRIPT_DIR/character_profiles/manual_test_queue/currently_testing" -name "*.json" 2>/dev/null | wc -l) characters

#### Approved for Auto-Play
$(find "$SCRIPT_DIR/character_profiles/manual_test_queue/approved_for_auto" -name "*.json" 2>/dev/null | wc -l) characters

#### Active Auto-Players
$(find "$SCRIPT_DIR/character_profiles/auto_players/active" -name "*.json" 2>/dev/null | wc -l) characters

### Recent Activity
$(tail -n 10 "$LOG_FILE" 2>/dev/null || echo "No recent activity")

### Recommendations
- Review characters in ready_for_testing queue
- Monitor active auto-players for issues
- Check implementation logs for errors

Generated at: $(date '+%Y-%m-%d %H:%M:%S')
EOF

    log_message "Daily report generated: $report_file"
}

# Main monitoring loop
main() {
    log_message "=== Character monitoring started ==="

    # Run checks
    check_new_characters
    check_testing_characters
    check_approved_characters
    check_active_autoplayers

    # Generate report if it's a new day
    if [ "$1" == "--report" ] || [ "$(date '+%H')" == "00" ]; then
        generate_daily_report
    fi

    log_message "=== Character monitoring completed ==="
}

# Handle command line arguments
case "$1" in
    --continuous)
        # Run continuously with 5-minute intervals
        while true; do
            main
            sleep 300
        done
        ;;
    --report)
        # Generate report only
        generate_daily_report
        ;;
    --status)
        # Quick status check
        echo "Character System Status:"
        echo "----------------------"
        check_new_characters
        check_active_autoplayers
        ;;
    *)
        # Single run
        main
        ;;
esac