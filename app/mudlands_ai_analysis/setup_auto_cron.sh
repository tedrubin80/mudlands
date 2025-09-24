#!/bin/bash

# Mudlands Auto Character Cron Setup Script
# Sets up automated character activation at specific times

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CRON_USER=$(whoami)

echo "==================================="
echo "Mudlands Auto Character Cron Setup"
echo "==================================="
echo ""

# Function to add cron job
add_cron_job() {
    local schedule=$1
    local command=$2
    local description=$3

    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "$command"; then
        echo "✓ Cron job already exists: $description"
    else
        # Add the cron job
        (crontab -l 2>/dev/null; echo "# $description"; echo "$schedule $command") | crontab -
        echo "✓ Added cron job: $description"
    fi
}

# Create log directory if it doesn't exist
mkdir -p "$SCRIPT_DIR/implementation_logs"

echo "Setting up automated character schedules..."
echo ""

# Morning activation (6:00 AM)
add_cron_job \
    "0 6 * * *" \
    "cd $SCRIPT_DIR && /usr/bin/node auto_character_scheduler.js start >> implementation_logs/cron.log 2>&1 &" \
    "Morning character activation (6:00 AM)"

# Midday activation (11:00 AM)
add_cron_job \
    "0 11 * * *" \
    "cd $SCRIPT_DIR && /usr/bin/node auto_character_scheduler.js once >> implementation_logs/cron.log 2>&1" \
    "Midday character activation (11:00 AM)"

# Evening activation (6:00 PM) - Peak hours
add_cron_job \
    "0 18 * * *" \
    "cd $SCRIPT_DIR && /usr/bin/node auto_character_scheduler.js start >> implementation_logs/cron.log 2>&1 &" \
    "Evening character activation (6:00 PM - Peak)"

# Late evening story event (9:00 PM)
add_cron_job \
    "0 21 * * *" \
    "cd $SCRIPT_DIR && /usr/bin/node auto_character_scheduler.js once >> implementation_logs/cron.log 2>&1" \
    "Late evening story event (9:00 PM)"

# Mysterious night activation (11:00 PM)
add_cron_job \
    "0 23 * * *" \
    "cd $SCRIPT_DIR && /usr/bin/node auto_character_scheduler.js start >> implementation_logs/cron.log 2>&1 &" \
    "Night character activation (11:00 PM)"

# Daily report generation (12:05 AM)
add_cron_job \
    "5 0 * * *" \
    "$SCRIPT_DIR/monitor_ai_characters.sh --report >> implementation_logs/cron.log 2>&1" \
    "Daily report generation (12:05 AM)"

# Character monitoring every 10 minutes
add_cron_job \
    "*/10 * * * *" \
    "$SCRIPT_DIR/monitor_ai_characters.sh >> implementation_logs/cron.log 2>&1" \
    "Character monitoring (every 10 minutes)"

# Story state backup (3:00 AM)
add_cron_job \
    "0 3 * * *" \
    "cp $SCRIPT_DIR/world_data/story_state.json $SCRIPT_DIR/world_data/story_state.backup.\$(date +\%Y\%m\%d).json" \
    "Story state backup (3:00 AM)"

# Clean old logs weekly (Sunday 4:00 AM)
add_cron_job \
    "0 4 * * 0" \
    "find $SCRIPT_DIR/implementation_logs -name '*.log' -mtime +30 -delete" \
    "Clean old logs (Weekly - Sunday 4:00 AM)"

echo ""
echo "==================================="
echo "Cron Setup Complete!"
echo "==================================="
echo ""
echo "Current cron jobs for $CRON_USER:"
echo ""
crontab -l | grep -E "(Mudlands|character)" || echo "No Mudlands cron jobs found"

echo ""
echo "==================================="
echo "Manual Control Commands:"
echo "==================================="
echo ""
echo "Start scheduler manually:"
echo "  node $SCRIPT_DIR/auto_character_scheduler.js start"
echo ""
echo "Run single cycle:"
echo "  node $SCRIPT_DIR/auto_character_scheduler.js once"
echo ""
echo "Check status:"
echo "  node $SCRIPT_DIR/auto_character_scheduler.js status"
echo ""
echo "Monitor characters:"
echo "  $SCRIPT_DIR/monitor_ai_characters.sh --status"
echo ""
echo "View logs:"
echo "  tail -f $SCRIPT_DIR/implementation_logs/auto_character.log"
echo ""
echo "Disable cron jobs:"
echo "  crontab -l | grep -v 'auto_character_scheduler\|monitor_ai_characters' | crontab -"
echo ""

# Create systemd service file for persistent process (optional)
cat > /tmp/mudlands-ai-characters.service << EOF
[Unit]
Description=Mudlands AI Character System
After=network.target

[Service]
Type=simple
User=$CRON_USER
WorkingDirectory=$SCRIPT_DIR
ExecStart=/usr/bin/node $SCRIPT_DIR/auto_character_scheduler.js start
Restart=always
RestartSec=10
StandardOutput=append:$SCRIPT_DIR/implementation_logs/systemd.log
StandardError=append:$SCRIPT_DIR/implementation_logs/systemd.log

[Install]
WantedBy=multi-user.target
EOF

echo "==================================="
echo "Optional: Install as systemd service"
echo "==================================="
echo ""
echo "To install as a system service (runs continuously):"
echo "  sudo cp /tmp/mudlands-ai-characters.service /etc/systemd/system/"
echo "  sudo systemctl daemon-reload"
echo "  sudo systemctl enable mudlands-ai-characters"
echo "  sudo systemctl start mudlands-ai-characters"
echo ""
echo "Service commands:"
echo "  sudo systemctl status mudlands-ai-characters"
echo "  sudo systemctl stop mudlands-ai-characters"
echo "  sudo systemctl restart mudlands-ai-characters"
echo "  sudo journalctl -u mudlands-ai-characters -f"
echo ""