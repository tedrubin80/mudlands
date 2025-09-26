# MUDlands Online

A modern text-based Multi-User Dungeon (MUD) game built with Node.js, featuring AI-powered NPCs and dynamic storytelling.

![Status](https://img.shields.io/badge/Status-Archived-yellow)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 🎮 About

MUDlands Online is a complete MUD implementation that brings classic text-based gaming to the modern web. Set in the fantasy realm of Aethermoor, players explore a world recovering from a magical catastrophe known as the Great Sundering.

### Key Features
- **Real-time Multiplayer**: WebSocket-based gameplay via Socket.IO
- **AI-Powered NPCs**: Dynamic characters with personalities and schedules
- **Rich Combat System**: Turn-based combat with skills and equipment
- **Living World**: NPCs continue their activities when players are offline
- **Comprehensive Admin Tools**: 25+ game master commands
- **Modern Security**: CSRF protection, rate limiting, secure sessions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- 2GB RAM minimum

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/tedrubin80/mudlands.git
cd mudlands
```

2. **Install dependencies**
```bash
cd app
npm install
```

3. **Set up the database**
```bash
npm run db:init
```

4. **Configure environment**
Create `.env` file:
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_NAME=mudlands
DB_USER=mudlands_user
DB_PASSWORD=your_password
SESSION_SECRET=generate_random_secret
CSRF_SECRET=generate_random_secret
JWT_SECRET=generate_random_secret
```

5. **Start the server**
```bash
npm start
```

6. **Access the game**
Open browser to: `http://localhost:3000`

## 📁 Project Structure

```
mudlands/
├── app/                    # Main application
│   ├── src/               # Source code
│   │   ├── services/      # Game engine & logic
│   │   ├── routes/        # API endpoints
│   │   ├── models/        # Data models
│   │   └── middleware/    # Express middleware
│   ├── public/            # Web client
│   ├── scripts/           # Utility scripts
│   └── docs/              # Game documentation
├── backups/               # Database & config backups
└── documentation/         # Project documentation
```

## 🎯 Game Features

### World Content
- 13+ explorable rooms
- 8+ monster types
- 19+ items and equipment
- 5 AI-driven NPCs
- 4 functional shops

### Player Systems
- Character creation with classes
- Inventory management
- Equipment and stats
- Quest system
- Real-time chat

### Combat Mechanics
- Turn-based combat
- Critical hits and dodges
- Level-based scaling
- Loot drops
- Experience progression

## 🤖 AI Character System

The game features 5 fully-developed AI NPCs that operate on schedules:

1. **Elder Thaddeus** - Haunted town leader
2. **Sister Morwyn** - Mystical healer
3. **Razorclaw** - Beast-kin protector
4. **The Veiled Scholar** - Secret cultist
5. **Grizelda Ironfoot** - Dwarf explorer

NPCs have:
- Time-based activity patterns
- Dynamic story event generation
- Faction relationships
- Personality-driven behaviors

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Real-time**: Socket.IO
- **Database**: PostgreSQL, Redis
- **AI**: Ollama (LLaMA 3.1)
- **Security**: Helmet, bcrypt, CSRF tokens
- **Process**: PM2, SystemD

## 📚 Documentation

- [Technical Breakdown](./PROJECT_TECHNICAL_BREAKDOWN.md) - Complete architecture overview
- [AI Character System](./AI_CHARACTER_DOCUMENTATION.md) - NPC system details
- [Sunset Documentation](./SUNSET_DOCUMENTATION.md) - Project closure notes
- [World Lore](./app/docs/WORLD_LORE.md) - Game world background
- [Storytelling Toolkit](./app/docs/STORYTELLING_TOOLKIT.md) - Content creation guide

## 🔧 Development

### Running in Development
```bash
npm run dev  # Uses nodemon for auto-restart
```

### Database Management
```bash
# Initialize database
npm run db:init

# Backup database
sudo -u postgres pg_dump mudlands > backup.sql

# Restore database
sudo -u postgres psql mudlands < backup.sql
```

### Creating Admin User
```bash
node scripts/create-admin.js
```

## 🚢 Production Deployment

### Using SystemD
```bash
# Copy service file
sudo cp mudlands.service /etc/systemd/system/

# Enable and start
sudo systemctl enable mudlands
sudo systemctl start mudlands
```

### With Nginx
```nginx
server {
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

## 📊 Performance

- **Concurrent Users**: Tested with 50+ players
- **Response Time**: <100ms average
- **Memory Usage**: ~150MB base
- **Database**: Optimized with indexes

## 🔐 Security

- Input validation and sanitization
- XSS and CSRF protection
- Rate limiting on APIs
- Secure session management
- Password hashing with bcrypt

## 🤝 Contributing

This project is currently archived but contributions are welcome for those interested in reviving it:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Classic MUDs for inspiration (CircleMUD, ROM, etc.)
- The Node.js and Socket.IO communities
- Ollama for AI capabilities

## 📧 Contact

**Repository**: https://github.com/tedrubin80/mudlands
**Issues**: Use GitHub Issues for bug reports

---

*Project Status: Archived (September 2025)*
*The realm of Aethermoor awaits new heroes...*