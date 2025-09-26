# MUDlands AI Character System Documentation

## 📋 Overview
The MUDlands AI Character System is a sophisticated automated NPC management system that brings the game world to life through AI-driven character behaviors, scheduled activities, and dynamic story evolution.

## 🤖 System Architecture

### Core Components

1. **Character Scheduler** (`mudlands_ai_analysis/auto_character_scheduler.js`)
   - Manages automated NPC activities based on time of day
   - Controls story event generation and world evolution
   - Handles concurrent character limits and session duration

2. **Character Profiles** (`character_profiles/`)
   - Individual JSON files for each AI character
   - Contains personality, backstory, goals, and behavioral patterns
   - Separate directories for testing and active characters

3. **Story State Management** (`world_data/story_state.json`)
   - Tracks ongoing narratives and faction relationships
   - Records major events and their impacts
   - Maintains world continuity between sessions

4. **Implementation Logs** (`implementation_logs/`)
   - Tracks deployment status and character activation
   - Monitors system health and error logging
   - Records character interaction history

## 📅 Scheduling System

### Time-Based Activity Windows
```javascript
Schedules:
- Morning (06:00-10:00): Moderate intensity - Daily routines, work activities
- Midday (11:00-14:00): Low intensity - Quiet periods, personal tasks
- Evening (18:00-22:00): High intensity - Social interactions, major events
- Night (23:00-02:00): Mysterious intensity - Secret activities, dark plots
```

### Session Configuration
- **Max Concurrent Characters**: 5 (prevents server overload)
- **Session Duration**: 15-45 minutes per character
- **Cooldown Period**: 2 hours between same character activations

## 👥 Character Roster

### Main Cast (5 Core Characters)

#### 1. **Elder Thaddeus** - The Haunted Leader
- **Role**: Town Elder struggling with past decisions
- **Location**: Town Hall / Galinndan Square
- **Schedule**:
  - Morning: Council meetings, town inspections
  - Evening: Private meetings, memorial visits
  - Night: Insomnia walks, secret correspondence
- **Story Arc**: Redemption vs. tradition conflict

#### 2. **Sister Morwyn** - The Mystical Healer
- **Role**: Religious leader with prophetic visions
- **Location**: Shrine of the Forgotten
- **Schedule**:
  - Morning: Prayer services, healing sessions
  - Evening: Meditation, vision seeking
  - Night: Divine communion, prophecy study
- **Story Arc**: Understanding the Shadowblight's spiritual nature

#### 3. **Razorclaw** - The Beast-kin Outcast
- **Role**: Wolf-kin protecting marginalized Beast-kin
- **Location**: Forest areas, town outskirts
- **Schedule**:
  - Morning: Hunting, territory patrol
  - Evening: Beast-kin meetings, community protection
  - Night: Pack activities, wilderness patrol
- **Story Arc**: Fighting for Beast-kin acceptance

#### 4. **The Veiled Scholar** - The Secret Cultist
- **Role**: Researcher with hidden dark agenda
- **Location**: Abandoned Observatory / Hidden locations
- **Schedule**:
  - Morning: Artifact study, public research
  - Evening: Secret rituals, corruption experiments
  - Night: Shadowblight rituals, cult recruitment
- **Story Arc**: Secretly spreading the Shadowblight

#### 5. **Grizelda Ironfoot** - The Dwarf Explorer
- **Role**: Mine overseer seeking lost dwarven technology
- **Location**: Mountain Mines / Town Tavern
- **Schedule**:
  - Morning: Mine inspections, worker management
  - Evening: Tavern socializing, trade negotiations
  - Night: Deep exploration, ancient text study
- **Story Arc**: Restoring pre-Sundering technology

## 🎭 Story Event System

### Dynamic Event Categories

1. **Political Events**
   - Public debates about restoration vs. adaptation
   - Town decrees affecting different factions
   - Civil unrest and protests

2. **Religious Events**
   - Prophetic visions and divine interventions
   - Pilgrimages and religious festivals
   - Miraculous healings and spiritual crises

3. **Shadowblight Events**
   - Corruption outbreaks and spreading
   - Artifact discoveries with dark properties
   - NPC infections and transformations

4. **Beast-kin Events**
   - Secret gatherings and faction organizing
   - Confrontations with townspeople
   - Trade attempts and economic integration

5. **Exploration Events**
   - Discovery of pre-Sundering ruins
   - Warnings from deep mine explorations
   - Ancient technology breakthroughs

6. **Social Events**
   - Town festivals and celebrations
   - Mysterious stranger arrivals
   - Merchant rivalries and economic conflicts

## 🔧 Technical Implementation

### Activation Process
1. Cron job triggers scheduler every hour
2. Scheduler checks current time against activity windows
3. Selects eligible characters based on cooldown and story state
4. Launches character with appropriate behavior pattern
5. Character interacts for session duration (15-45 min)
6. Updates story state and logs interaction

### File Structure
```
mudlands_ai_analysis/
├── auto_character_scheduler.js     # Main scheduler script
├── character_profiles/
│   ├── auto_players/
│   │   ├── active/                # Currently deployed characters
│   │   └── activation_config.json  # Deployment configuration
│   └── manual_test_queue/          # Characters awaiting testing
├── world_data/
│   └── story_state.json           # Current world narrative state
├── implementation_logs/
│   ├── current_status.json        # System status
│   ├── auto_character.log         # Runtime logs
│   └── character_deployment.log   # Deployment history
└── daily_reports/                  # Analytics and suggestions
```

### Cron Schedule
```bash
# Auto-character scheduler - runs every hour
0 * * * * /usr/bin/node /var/www/mudlands.online/app/mudlands_ai_analysis/auto_character_scheduler.js

# Monitoring script - runs every 15 minutes
*/15 * * * * /var/www/mudlands.online/app/mudlands_ai_analysis/monitor_ai_characters.sh
```

## 📊 Story State Tracking

### Current Faction Relationships
- **Town Council**: Traditional leadership, resisting change
- **Church of the Forgotten**: Seeking spiritual understanding
- **Beast-kin Community**: Fighting for acceptance
- **Shadow Cult**: Hidden faction spreading corruption
- **Dwarven Miners**: Pursuing technological restoration

### Major Story Threads
1. **The Shadowblight Crisis**: Mysterious corruption spreading
2. **Beast-kin Integration**: Social conflict over non-human citizens
3. **Lost Technology**: Quest to restore pre-Sundering knowledge
4. **Political Reform**: Debate over town's future direction
5. **Religious Prophecy**: Visions of coming catastrophe

## 🚀 Deployment Instructions

### Initial Setup
1. Install Node.js dependencies
2. Configure database connections
3. Set up cron jobs for scheduling
4. Deploy character profiles to active directory
5. Initialize story state

### Adding New Characters
1. Create character profile JSON in `manual_test_queue/`
2. Test character behaviors manually
3. Move to `auto_players/active/` when ready
4. Update activation_config.json
5. Add to scheduler behavior patterns

### Monitoring & Maintenance
- Check `auto_character.log` for runtime errors
- Review `current_status.json` for system health
- Monitor story_state.json for narrative coherence
- Analyze daily reports for player engagement

## 🎯 Design Philosophy

### Core Principles
1. **Living World**: NPCs continue their lives regardless of player presence
2. **Emergent Storytelling**: Events create unpredictable narrative combinations
3. **Faction Dynamics**: Character actions affect group relationships
4. **Time Realism**: Activities match logical daily schedules
5. **Player Agency**: AI events create opportunities, not railroads

### Balancing Considerations
- Limit concurrent characters to prevent spam
- Vary intensity by time of day for pacing
- Maintain character consistency across sessions
- Balance mystery revelation with player discovery
- Ensure no single faction dominates narrative

## 📝 Future Enhancements

### Planned Features
- Dynamic character relationship tracking
- Weather-based behavior modifications
- Player reputation influence on NPC actions
- Cross-character plot coordination
- Seasonal event cycles

### Technical Improvements
- Machine learning for behavior optimization
- Natural language generation improvements
- Real-time story coherence checking
- Player preference learning
- Automated character personality evolution

## ⚠️ Important Notes

### System Requirements
- Node.js 18+ for scheduler execution
- PostgreSQL for character state persistence
- Redis for real-time character coordination
- Ollama API for AI text generation
- 2GB+ RAM for concurrent character operation

### Security Considerations
- Character profiles contain no sensitive data
- API keys stored in environment variables only
- Rate limiting prevents AI abuse
- Character actions logged for audit trail
- No player data exposed to AI system

---

*Last Updated: September 2025*
*Version: 1.0.0*
*Total Characters: 5 Core + Expandable*