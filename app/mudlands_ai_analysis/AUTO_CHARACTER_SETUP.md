# Mudlands Automated Character System - Setup & Usage Guide

## 🎭 Overview

This system provides fully automated NPCs that activate at specific times, perform realistic behaviors, and evolve the story through randomized events. Characters will run automatically, interact with players, and drive the narrative forward without human intervention.

## 🚀 Quick Setup

### 1. Install the System
```bash
cd /var/www/mudlands.online/app/mudlands_ai_analysis
./setup_auto_cron.sh
```

### 2. Integrate with Game Server
Add to your `server.js`:

```javascript
// Add AI Character routes
const { router: aiCharacterRouter, initializeAI } = require('./src/routes/aiCharacters');
app.use('/api/ai-characters', aiCharacterRouter);

// Initialize AI system after world and socket setup
const aiController = initializeAI(world, socketHandler);
```

### 3. Test Manual Activation
```bash
# Run single character cycle
node auto_character_scheduler.js once

# Start continuous monitoring
node auto_character_scheduler.js start

# Check status
./monitor_ai_characters.sh --status
```

## ⏰ Automatic Schedule

### Daily Schedule:
- **6:00 AM** - Morning activities (moderate intensity)
- **11:00 AM** - Midday events (low intensity)
- **6:00 PM** - Evening peak (high intensity)
- **9:00 PM** - Late evening stories
- **11:00 PM** - Mysterious night activities

### Characters Auto-Activate Based On:
- **Time of day** (different behaviors for morning/evening/night)
- **Story tensions** (higher tensions = more active characters)
- **Random events** (30% chance per cycle)
- **Player activity** (more active during peak hours)

## 🎲 Random Story Events

The system generates random events that evolve the story:

### Political Events:
- Public debates about restoration vs adaptation
- Council announcements about Beast-kin rights
- Citizen protests and civil unrest

### Religious Events:
- Sister Morwyn receives divine visions
- Pilgrims arrive seeking the Forgotten shrine
- Unexplained miracles occur

### Shadowblight Events:
- Corruption outbreaks in farmlands
- Discovery of tainted artifacts
- NPCs show early infection symptoms

### Beast-kin Events:
- Secret gatherings in the forest
- Confrontations with townspeople
- Trade negotiations and agreements

## 🤖 Character Behaviors

### Elder Thaddeus (Political Leader):
- **Morning**: Council meetings, town inspections, citizen audiences
- **Evening**: Private meetings, document reviews, memorial visits
- **Night**: Insomnia walks, secret correspondence, nightmare memories

### Sister Morwyn (Religious Figure):
- **Morning**: Prayers, healing services, shrine maintenance
- **Evening**: Vespers, mystical meditation, vision seeking
- **Night**: Divine communion, prophecy study, forgotten prayers

### Razorclaw (Beast-kin):
- **Morning**: Hunting, territory patrol, forest reconnaissance
- **Evening**: Beast-kin meetings, night hunting, boundary marking
- **Night**: Pack howling, wilderness patrol, protection duties

### The Veiled Scholar (Hidden Antagonist):
- **Morning**: Artifact study, research, visitor consultations
- **Evening**: Secret rituals, corruption experiments
- **Night**: Shadowblight rituals, artifact corruption, cult recruitment

### Grizelda Ironfoot (Dwarven Foreman):
- **Morning**: Mine inspection, worker briefing, equipment check
- **Evening**: Tavern socializing, trade negotiations, story sharing
- **Night**: Deep mine exploration, ancient texts study, ceremonies

## 📊 Story Evolution System

### Faction Tensions (0-100):
- **Restoration vs Adaptation** - Philosophical divide
- **Human vs Beast-kin** - Species relations
- **Trust in Council** - Government confidence
- **Shadowblight Awareness** - Corruption knowledge
- **Religious Fervor** - Faith levels
- **Economic Stability** - Town prosperity

### Milestone Triggers:
- **Shadowblight Awareness 40+** → Public panic
- **Trust in Council 30-** → Civil unrest begins
- **Human vs Beast-kin 80+** → Violent confrontations
- **Restoration vs Adaptation 80+** → Town splits into factions

## 🎮 Player Integration

### Automatic Player Interactions:
- NPCs recognize returning players
- Contextual greetings based on current events
- Dynamic quest offerings based on story state
- Emotional responses to player actions

### Services Automatically Available:
- **Elder Thaddeus**: Political quests, faction reputation
- **Sister Morwyn**: Healing, curse removal, divine magic
- **Razorclaw**: Wilderness tracking, Beast-kin relations
- **Veiled Scholar**: Artifact identification (dangerous!)
- **Grizelda**: Mining access, technology repair

## 📁 File Structure

```
mudlands_ai_analysis/
├── auto_character_scheduler.js    # Main scheduler
├── monitor_ai_characters.sh       # Monitoring script
├── setup_auto_cron.sh            # Cron installation
├── world_data/story_state.json   # Current story state
├── daily_reports/                 # Analysis reports
├── character_profiles/
│   ├── auto_players/active/       # Active AI characters
│   └── manual_test_queue/         # Testing pipeline
└── implementation_logs/           # System logs
```

## 🔧 Management Commands

### Manual Control:
```bash
# Start/stop scheduler
node auto_character_scheduler.js start
pkill -f auto_character_scheduler.js

# Run single event cycle
node auto_character_scheduler.js once

# Character monitoring
./monitor_ai_characters.sh --status
./monitor_ai_characters.sh --report

# View current activity
tail -f implementation_logs/auto_character.log
cat implementation_logs/current_status.json
```

### API Endpoints:
```bash
# Activate specific character
curl -X POST http://localhost:3000/api/ai-characters/activate \
  -H "Content-Type: application/json" \
  -d '{"characterId":"elder_thaddeus_001","behavior":"council_meeting","duration":30}'

# Check AI status
curl http://localhost:3000/api/ai-characters/status

# Trigger story event
curl -X POST http://localhost:3000/api/ai-characters/story-event \
  -H "Content-Type: application/json" \
  -d '{"type":"outbreak","description":"Shadowblight symptoms in east district"}'
```

## 🛠️ Troubleshooting

### Check System Status:
```bash
# View active cron jobs
crontab -l | grep -E "(character|mudlands)"

# Check if scheduler is running
ps aux | grep auto_character_scheduler

# View recent logs
tail -20 implementation_logs/auto_character.log
tail -20 implementation_logs/cron.log
```

### Common Issues:

**Characters not activating:**
- Check if game server is running on localhost:3000
- Verify character files exist in auto_players/active/
- Check cron logs for errors

**Story events not appearing:**
- Ensure AICharacterController is integrated in server.js
- Check socket connections are working
- Verify world object is properly passed

**Cron jobs not running:**
- Check crontab installation: `crontab -l`
- Verify script permissions: `ls -la *.sh`
- Check system cron service: `systemctl status cron`

### Debug Mode:
```bash
# Run with verbose logging
DEBUG=true node auto_character_scheduler.js once

# Manual character activation test
node -e "
const controller = require('./src/services/AICharacterController.js');
console.log('Testing character activation...');
"
```

## 🔄 Continuous Operation

### Option 1: Cron-based (Recommended)
- Uses system cron for reliability
- Multiple scheduled activations per day
- Automatic cleanup and monitoring
- Low resource usage

### Option 2: Systemd Service
```bash
# Install as system service
sudo cp /tmp/mudlands-ai-characters.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable mudlands-ai-characters
sudo systemctl start mudlands-ai-characters

# Monitor service
sudo systemctl status mudlands-ai-characters
sudo journalctl -u mudlands-ai-characters -f
```

## 📈 Story Progression Examples

### Typical Day Evolution:

**Morning (6:00 AM):**
- Elder Thaddeus holds council meeting
- Grizelda inspects mine operations
- Sister Morwyn tends to shrine

**Random Event:** *Beast-kin traders request market access*
- Razorclaw becomes mediator
- Tensions: Human vs Beast-kin +10
- Trust in Council -5 (difficult decision)

**Evening (6:00 PM):**
- Thaddeus meets privately with merchants
- Razorclaw organizes Beast-kin response
- Citizens debate in tavern

**Night (11:00 PM):**
- Veiled Scholar performs secret ritual
- Shadowblight Awareness +5
- Corruption spreads slightly

**Result:** Town now faces integration challenge, players can influence outcome through quests and interactions.

## 🎯 Success Metrics

The system tracks:
- **Character Activations** - How often NPCs are active
- **Player Interactions** - Direct player-NPC engagement
- **Story Events Generated** - Randomized narrative moments
- **Faction Tension Changes** - Political evolution
- **Quest Completions** - Player engagement with AI storylines

View daily reports in `daily_reports/` for detailed analytics.

---

## 🚀 Ready to Launch!

Your automated character system is now ready. Characters will begin activating at scheduled times, creating a living, breathing world that evolves even when you're not actively managing it.

The story will write itself through the interactions of AI characters, random events, and player choices. Welcome to the future of dynamic MUD storytelling!