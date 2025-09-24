#!/bin/bash

# Script to add rate limiting to nginx.conf for MUDlands

echo "Adding rate limiting to nginx configuration..."

# Backup existing nginx.conf
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# Check if rate limiting zones already exist
if grep -q "limit_req_zone.*api_limit" /etc/nginx/nginx.conf; then
    echo "Rate limiting zones already exist in nginx.conf"
else
    echo "Adding rate limiting zones to nginx.conf..."
    
    # Add rate limiting zones in the http block
    sudo sed -i '/http {/a\\n\t# Rate limiting zones for MUDlands\n\tlimit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;\n\tlimit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;\n' /etc/nginx/nginx.conf
fi

echo "Rate limiting configuration complete!"
echo "You can now use the rate limiting in your site configuration:"
echo "  limit_req zone=api_limit burst=20 nodelay;"
echo "  limit_req zone=auth_limit burst=5 nodelay;"