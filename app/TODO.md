# MUDlands Online - Development TODO List

## Phase 1: Foundation (Current)
- [x] Set up Node.js project structure with package.json
- [ ] Install core dependencies (Express, Socket.io, PostgreSQL, Redis)
- [ ] Create basic server with Express and Socket.io
- [ ] Set up database schema and connections
- [ ] Create authentication system (register/login)
- [ ] Build room navigation system
- [ ] Implement command parser
- [ ] Create web-based terminal interface
- [ ] Set up Apache virtual host for mudlands.online

## Phase 2: Core Game Mechanics
- [ ] Character creation system
  - [ ] Base stats (STR, AGI, VIT, INT, DEX, LUK)
  - [ ] Starting classes (Novice)
  - [ ] Character appearance/description
- [ ] Combat system
  - [ ] Basic attack mechanics
  - [ ] Damage calculations
  - [ ] Monster AI
  - [ ] Death/respawn mechanics
- [ ] Inventory system
  - [ ] Item management
  - [ ] Equipment slots
  - [ ] Item descriptions
- [ ] Experience and leveling
  - [ ] XP gain from combat
  - [ ] Level up mechanics
  - [ ] Stat point allocation

## Phase 3: World Building
- [ ] Create starter town
  - [ ] Town square
  - [ ] Shops
  - [ ] Training grounds
  - [ ] Inn/save point
- [ ] Design first dungeon
  - [ ] Multiple rooms
  - [ ] Monster spawns
  - [ ] Loot tables
- [ ] Create overworld areas
  - [ ] Fields
  - [ ] Forest
  - [ ] Mountain paths
- [ ] NPCs and dialogue

## Phase 4: Social Features
- [ ] Chat system
  - [ ] Global chat
  - [ ] Local/room chat
  - [ ] Whisper/private messages
  - [ ] Emotes
- [ ] Party system
  - [ ] Party formation
  - [ ] Shared XP
  - [ ] Party chat
- [ ] Friends list
- [ ] Player trading

## Phase 5: Advanced Classes
- [ ] Class advancement system
  - [ ] Swordsman → Knight/Crusader
  - [ ] Mage → Wizard/Sage
  - [ ] Archer → Hunter/Bard
  - [ ] Merchant → Blacksmith/Alchemist
  - [ ] Thief → Assassin/Rogue
  - [ ] Acolyte → Priest/Monk
- [ ] Class-specific skills
- [ ] Skill trees
- [ ] Skill points system

## Phase 6: Advanced Features
- [ ] Guild system
  - [ ] Guild creation
  - [ ] Guild chat
  - [ ] Guild storage
  - [ ] Guild events
- [ ] PvP system
  - [ ] Dueling
  - [ ] PvP zones
  - [ ] Arena battles
- [ ] Quest system
  - [ ] Main story quests
  - [ ] Side quests
  - [ ] Daily quests
  - [ ] Quest rewards
- [ ] Crafting system
  - [ ] Recipe discovery
  - [ ] Material gathering
  - [ ] Item enhancement

## Phase 7: Polish & QoL
- [ ] Command aliases and macros
- [ ] Auto-completion
- [ ] Help system
- [ ] Tutorial for new players
- [ ] ASCII art for special events
- [ ] Sound effects (optional)
- [ ] Mobile-responsive interface
- [ ] Performance optimization

## Phase 8: Admin Tools
- [ ] GM commands
- [ ] World editor
- [ ] Player management
- [ ] Event system
- [ ] Analytics dashboard
- [ ] Backup system

## IMMEDIATE FIXES NEEDED (Current Issues)

### ❌ Admin Panel Issues (HIGH PRIORITY)
- [ ] Fix admin panel button functionality (buttons currently don't work)
- [ ] Connect admin panel to actual game engine data (GameEngine integration)
- [ ] Fix admin dashboard stats display (currently shows zeros)
- [ ] Fix player management functionality (connect to real player data)
- [ ] Fix command execution in admin panel (GameEngine command integration)
- [ ] Fix broadcast messaging system (connect to actual game broadcast)

### ❌ Database & Security Issues
- [ ] Restore complex database password (currently using simple123 - security risk)
- [ ] Test all database operations with complex password
- [ ] Ensure CSRF tokens work consistently across all forms
- [ ] Fix Express rate limiting trust proxy warnings

### 👥 Multi-Level User Permission System (NEW FEATURE)
- [ ] Design role hierarchy: Players → Testers → Moderators → Admins → Super Admins
- [ ] Create user_roles table in database
- [ ] Add role_id column to players table  
- [ ] Implement role-based access control middleware
- [ ] Create different admin panel interfaces for different roles:

#### Role Definitions:
```
Player (role_id: 0) - Standard game access
├── Tester (role_id: 1) - Beta testing tools, bug reporting interface
├── Moderator (role_id: 2) - Player management, chat moderation, basic commands  
├── Admin (role_id: 3) - Full system access, server management
└── Super Admin (role_id: 4) - Role assignment, system configuration, user management
```

#### Admin Panel Features by Role:
- **Testers**: Bug report form, testing tools, limited game stats
- **Moderators**: Player list, kick/ban tools, chat logs, basic server commands
- **Admins**: Full admin panel access, game world management, AI tools
- **Super Admins**: User role management, system configuration, security settings

## Technical Debt & Maintenance
- [ ] Unit tests
- [ ] Integration tests
- [ ] Load testing
- [ ] Documentation
- [ ] CI/CD pipeline
- [ ] Monitoring and logging
- [ ] Security audit

## Content Creation (Ongoing)
- [ ] Write room descriptions (100+ rooms)
- [ ] Create monster varieties (50+ types)
- [ ] Design unique items and equipment
- [ ] Write NPC dialogue
- [ ] Create lore and backstory
- [ ] Design special events

## Bug Fixes & Balance (Ongoing)
- [ ] Combat balance
- [ ] XP curve adjustments
- [ ] Item drop rates
- [ ] Skill cooldowns
- [ ] Economy balance

## Notes
- Focus on MVP first (Phase 1-2)
- Get player feedback early and often
- Prioritize stability over features
- Keep the classic MUD feel
- Document everything for future contributors

## Current Status & Credentials

### ✅ Recently Completed
- [x] Fixed PostgreSQL database connection
- [x] Created mudlands_user with proper permissions  
- [x] Added is_admin column to players table
- [x] Created admin user (mudlands_admin)
- [x] Set admin privileges in database
- [x] Fixed CSRF token handling in character creation
- [x] Implemented database-based admin authentication
- [x] Admin panel login functionality working

### 🔐 Current Admin Credentials
- **Email**: ted@theorubin.com
- **Username**: mudlands_admin
- **Password**: kekpiv-mypxox-1pyrRo
- **Admin Panel**: https://mudlands.online/admin

### 🗄️ Database Info
- **Current Password**: simple123 ⚠️ (needs to be changed to complex)
- **User**: mudlands_user
- **Database**: mudlands
- **Host**: 127.0.0.1:5432