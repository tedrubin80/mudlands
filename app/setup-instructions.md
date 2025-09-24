# MUDlands Online - Setup Instructions

## DNS Status ✅
- Domain: mudlands.online
- IP: 37.27.220.18 (correctly configured)

## Server Status ✅
- Node.js server is running on port 3000
- Game engine initialized with 18 rooms

## To Complete Setup (Run as root/sudo):

### 1. Copy NGINX Configuration
```bash
sudo cp /home/southerns/mud/nginx-http-only.conf /etc/nginx/sites-available/mudlands.online
```

### 2. Enable the Site
```bash
sudo ln -sf /etc/nginx/sites-available/mudlands.online /etc/nginx/sites-enabled/
```

### 3. Test NGINX Configuration
```bash
sudo nginx -t
```

### 4. Reload NGINX
```bash
sudo systemctl reload nginx
```

### 5. Test the Site
Visit: http://mudlands.online

### 6. (Optional) Add SSL with Let's Encrypt
```bash
sudo certbot --nginx -d mudlands.online -d www.mudlands.online
```

## Current Server Status

The game server is currently running and accessible at:
- Local: http://localhost:3000
- Health check: http://localhost:3000/health

Once NGINX is configured, it will be accessible at:
- http://mudlands.online
- http://www.mudlands.online

## Managing the Game Server

### Using PM2 (Recommended for Production)
```bash
# Install PM2 globally
npm install -g pm2

# Start the server with PM2
pm2 start server.js --name mudlands

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup

# View logs
pm2 logs mudlands

# Monitor
pm2 monit
```

### Manual Start/Stop
```bash
# Start
cd /home/southerns/mud && npm start

# Stop - find the process and kill it
ps aux | grep "node server.js"
kill <PID>
```

## Troubleshooting

### Check if server is running:
```bash
curl http://localhost:3000/health
```

### Check NGINX error logs:
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/mudlands.online.error.log
```

### Check Node.js logs:
```bash
# If using PM2
pm2 logs mudlands

# If running manually, check the terminal output
```

## Game Features Currently Active
- 18 interconnected rooms
- 9 monster types
- Combat system
- Chat system (say, yell, whisper)
- Movement (north, south, east, west, up, down)
- Player stats and leveling
- Web-based terminal interface
- Real-time multiplayer via WebSockets