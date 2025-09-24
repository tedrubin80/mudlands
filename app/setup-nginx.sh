#!/bin/bash

# MUDlands Online NGINX Setup Script
# This script sets up NGINX with SSL for mudlands.online

echo "MUDlands Online NGINX Setup Script"
echo "=================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run this script with sudo"
    exit 1
fi

# Update package list
echo "Updating package list..."
apt-get update

# Install NGINX if not already installed
if ! command -v nginx &> /dev/null; then
    echo "Installing NGINX..."
    apt-get install -y nginx
else
    echo "NGINX is already installed"
fi

# Install Certbot for Let's Encrypt SSL
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot for SSL certificates..."
    apt-get install -y certbot python3-certbot-nginx
else
    echo "Certbot is already installed"
fi

# Copy NGINX configuration
echo "Setting up NGINX configuration..."
cp /home/southerns/mud/nginx-site-config /etc/nginx/sites-available/mudlands.online

# Create symbolic link to enable the site
ln -sf /etc/nginx/sites-available/mudlands.online /etc/nginx/sites-enabled/

# Remove default NGINX site if it exists
if [ -L /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
    echo "Removed default NGINX site"
fi

# Test NGINX configuration
echo "Testing NGINX configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "NGINX configuration is valid"
else
    echo "NGINX configuration has errors. Please check the configuration."
    exit 1
fi

# Create temporary SSL certificate for initial setup (will be replaced by Let's Encrypt)
echo "Creating temporary SSL certificate directory..."
mkdir -p /etc/letsencrypt/live/mudlands.online/

# Generate temporary self-signed certificate
if [ ! -f /etc/letsencrypt/live/mudlands.online/fullchain.pem ]; then
    echo "Generating temporary self-signed certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/letsencrypt/live/mudlands.online/privkey.pem \
        -out /etc/letsencrypt/live/mudlands.online/fullchain.pem \
        -subj "/C=US/ST=State/L=City/O=MUDlands/CN=mudlands.online"
fi

# Reload NGINX
echo "Reloading NGINX..."
systemctl reload nginx

echo ""
echo "=================================="
echo "NGINX Setup Complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Make sure your domain (mudlands.online) points to this server's IP"
echo "2. Once DNS is configured, run the following command to get a real SSL certificate:"
echo "   sudo certbot --nginx -d mudlands.online -d www.mudlands.online"
echo "3. Start your Node.js application:"
echo "   cd /home/southerns/mud && npm start"
echo ""
echo "For development with PM2:"
echo "   npm install -g pm2"
echo "   pm2 start server.js --name mudlands"
echo "   pm2 save"
echo "   pm2 startup"
echo ""