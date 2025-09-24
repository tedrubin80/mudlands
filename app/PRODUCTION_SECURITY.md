# MUDlands Online - Production Security Configuration

## ✅ Security Measures Implemented

### 1. Domain Configuration
- ✅ **FQDN Enforcement**: All services use `mudlands.online` domain
- ✅ **No Localhost Exposure**: All internal services use `127.0.0.1`
- ✅ **Redirect Logic**: Client automatically redirects to production domain
- ✅ **IP Blocking**: Direct IP access returns 444 (connection closed)

### 2. Secure Passwords Generated
All default passwords have been replaced with cryptographically secure values:

```
Session Secret: ynOaAXfhhCdH27+BOg19eyk1IyCfjzpwVZs55u5TGKA=
CSRF Secret:    PPQuB+oJwHv0HgpORX3uG8c53ymOc4bsYyKY1CEJHjg=
JWT Secret:     sgwetovrMzf1SAVYoGFUgydjqOHJjpuNKHx7SlzR44A=
DB Password:    zZcGfyLUKXmKglX0YYefyL/bX2cQqi6Z
Admin Password: 9d041ff0c451896abc673728a0efc359
Admin Username: mudlands_admin
```

**⚠️ IMPORTANT**: Store these passwords securely and never commit them to version control!

### 3. Network Security

#### Internal Services (127.0.0.1 only):
- PostgreSQL: 127.0.0.1:5432
- Redis: 127.0.0.1:6379
- Redis AI: 127.0.0.1:6380
- Ollama AI: 127.0.0.1:11434
- Node.js App: 127.0.0.1:3000

#### Public Access (via Nginx):
- HTTPS only: https://mudlands.online
- WebSocket: wss://mudlands.online
- API: https://mudlands.online/api

### 4. SSL/TLS Configuration
- ✅ TLS 1.2 and 1.3 only
- ✅ Strong cipher suites
- ✅ HSTS enabled with preload
- ✅ SSL stapling enabled
- ✅ Certificate pinning via trusted_certificate

### 5. Security Headers
```nginx
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: [restrictive policy]
```

### 6. Rate Limiting
- API endpoints: 10 requests/second (burst 20)
- Auth endpoints: 5 requests/minute (burst 5)
- AI endpoints: 30 requests/minute
- WebSocket: Connection throttling

### 7. Access Control
- ✅ Sensitive files blocked (.env, .git, node_modules, src)
- ✅ Health check endpoints internal only
- ✅ Admin endpoints require authentication
- ✅ CSRF protection on all POST requests
- ✅ JWT tokens with 7-day expiry

### 8. Database Security
- ✅ Parameterized queries (no SQL injection)
- ✅ Connection pooling with limits
- ✅ Separate user for application
- ✅ No direct external access

### 9. AI Service Security
- ✅ Internal access only (127.0.0.1:11434)
- ✅ Rate limiting on generation
- ✅ Circuit breaker pattern
- ✅ No external API calls
- ✅ Content validation

### 10. Monitoring & Logging
- ✅ Separate access and error logs
- ✅ No sensitive data in logs
- ✅ Health check endpoints
- ✅ AI generation tracking

## 🚀 Deployment Checklist

### Before Going Live:

1. **Update Passwords**
   ```bash
   # Edit .env.production with your secure passwords
   nano .env.production
   ```

2. **Set Up SSL Certificates**
   ```bash
   sudo certbot certonly --nginx -d mudlands.online -d www.mudlands.online
   ```

3. **Configure Nginx**
   ```bash
   sudo cp nginx-mudlands.conf /etc/nginx/sites-available/mudlands
   sudo ln -s /etc/nginx/sites-available/mudlands /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Set Up PostgreSQL**
   ```bash
   sudo -u postgres psql
   CREATE USER mudlands WITH PASSWORD 'zZcGfyLUKXmKglX0YYefyL/bX2cQqi6Z';
   CREATE DATABASE mudlands OWNER mudlands;
   GRANT ALL PRIVILEGES ON DATABASE mudlands TO mudlands;
   \q
   ```

5. **Start Services**
   ```bash
   # Start AI services
   cd docker && sudo docker compose -f docker-compose.ai.yml up -d
   
   # Start Redis
   sudo systemctl start redis-server
   
   # Start PostgreSQL
   sudo systemctl start postgresql
   
   # Start MUDlands
   ./start-production.sh
   ```

6. **Verify Security**
   ```bash
   # Test SSL
   curl -I https://mudlands.online
   
   # Test redirect
   curl -I http://mudlands.online
   
   # Verify no localhost access
   curl http://YOUR_SERVER_IP:3000  # Should fail
   
   # Check AI is internal only
   curl http://YOUR_SERVER_IP:11434  # Should fail
   ```

## 🔒 Security Best Practices

### Regular Maintenance:

1. **Update Dependencies**
   ```bash
   npm audit
   npm audit fix
   ```

2. **Rotate Secrets** (Monthly)
   - Generate new session secrets
   - Update JWT secrets
   - Rotate admin password

3. **Monitor Logs** (Daily)
   ```bash
   tail -f /var/log/nginx/mudlands-error.log
   pm2 logs mudlands
   ```

4. **Check SSL Certificate** (Before expiry)
   ```bash
   sudo certbot renew --dry-run
   ```

5. **Database Backups** (Daily)
   ```bash
   pg_dump mudlands > backup_$(date +%Y%m%d).sql
   ```

## 🚨 Incident Response

### If Compromised:

1. **Immediate Actions**
   ```bash
   # Stop services
   pm2 stop mudlands
   sudo docker compose -f docker/docker-compose.ai.yml down
   
   # Block traffic
   sudo iptables -I INPUT -j DROP
   
   # Preserve logs
   cp -r /var/log/nginx /backup/logs/
   pm2 logs > /backup/mudlands.log
   ```

2. **Investigation**
   - Check access logs for suspicious IPs
   - Review authentication logs
   - Check for unauthorized database changes
   - Scan for malware

3. **Recovery**
   - Rotate ALL passwords and secrets
   - Restore from clean backup
   - Update and patch all services
   - Implement additional monitoring

## 📊 Security Testing

### Run Security Tests:

```bash
# Test for SSL vulnerabilities
nmap --script ssl-enum-ciphers -p 443 mudlands.online

# Check headers
curl -I https://mudlands.online

# Test rate limiting
for i in {1..20}; do curl https://mudlands.online/api/health; done

# Verify no debug info exposed
curl https://mudlands.online/api/nonexistent
```

## 🔐 Configuration Files

### Production Files:
- `.env.production` - Production environment variables (DO NOT COMMIT)
- `nginx-mudlands.conf` - Nginx configuration
- `start-production.sh` - Production startup script
- `public/js/config.js` - Client configuration

### Security Features:
- All internal services use 127.0.0.1
- External access only through mudlands.online
- HTTPS enforced with HSTS
- Rate limiting on all endpoints
- CSRF protection enabled
- Secure session cookies
- No debug information exposed

## ✅ Final Verification

Run this command to verify security:

```bash
# Create verification script
cat > verify-security.sh << 'EOF'
#!/bin/bash
echo "🔒 MUDlands Security Verification"
echo "================================"

# Check domain responds
echo -n "✓ HTTPS responds: "
curl -s -o /dev/null -w "%{http_code}" https://mudlands.online

echo -n "✓ HTTP redirects: "
curl -s -o /dev/null -w "%{http_code}" -L http://mudlands.online

# Check internal services not exposed
echo -n "✓ PostgreSQL not exposed: "
nc -zv YOUR_PUBLIC_IP 5432 2>&1 | grep -q "refused" && echo "SECURE" || echo "EXPOSED!"

echo -n "✓ Redis not exposed: "
nc -zv YOUR_PUBLIC_IP 6379 2>&1 | grep -q "refused" && echo "SECURE" || echo "EXPOSED!"

echo -n "✓ Ollama not exposed: "
nc -zv YOUR_PUBLIC_IP 11434 2>&1 | grep -q "refused" && echo "SECURE" || echo "EXPOSED!"

echo -n "✓ Node.js not exposed: "
nc -zv YOUR_PUBLIC_IP 3000 2>&1 | grep -q "refused" && echo "SECURE" || echo "EXPOSED!"

echo "================================"
echo "Security verification complete!"
EOF

chmod +x verify-security.sh
./verify-security.sh
```

---

Your MUDlands Online server is now configured for secure production deployment with:
- ✅ FQDN enforcement (mudlands.online)
- ✅ No localhost exposure
- ✅ Secure passwords
- ✅ Internal service isolation
- ✅ Complete SSL/TLS security
- ✅ Comprehensive rate limiting
- ✅ Security headers
- ✅ Access control

All services communicate internally via 127.0.0.1, with public access only through the secured mudlands.online domain!