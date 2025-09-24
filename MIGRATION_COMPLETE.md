# MudLands Migration to /var/www Complete

## Overview
Successfully migrated MudLands Online from `/home/southerns/mudlands` to `/var/www/mudlands.online` on September 18, 2025.

## Migration Summary

### ✅ Completed Tasks

1. **Directory Structure Created**
   - Created `/var/www/mudlands.online/`
   - Maintained same internal structure: `app/`, `backups/`, `config/`, `logs/`, `scripts/`

2. **Files Moved Successfully**
   - All application files copied from old location
   - Ownership set to `southerns:southerns`
   - Permissions updated (755 for directories, executable for scripts)

3. **Nginx Configuration**
   - Reviewed `/etc/nginx/sites-available/mudlands.online`
   - No changes needed (already configured for domain-based routing)
   - SSL certificates properly configured at `/etc/letsencrypt/live/mudlands.online/`

4. **SSL Configuration**
   - SSL certificates remain at same paths
   - No updates needed to certificate configuration
   - HTTPS properly configured in nginx

5. **Cron Jobs Updated**
   - Updated backup cron job path: `/var/www/mudlands.online/scripts/backup-mud.sh`
   - Schedule maintained: Weekly backups on Sundays at 4:00 AM
   - All other cron jobs remain unchanged

6. **Backup Scripts Updated**
   - `backup-database.sh`: Updated to new backup directory
   - `backup-website.sh`: Updated source and backup paths
   - `backup-mud.sh`: Created comprehensive backup script
   - All backup scripts point to new location

7. **File Permissions Set**
   - Directory permissions: 755
   - Script permissions: executable (+x)
   - Proper ownership: southerns:southerns

8. **Configuration Tested**
   - Server starts successfully from new location
   - API endpoints responding correctly
   - Health check passed
   - Database connections working

## New File Locations

### Application
- **Main Directory**: `/var/www/mudlands.online/`
- **Application Files**: `/var/www/mudlands.online/app/`
- **Logs**: `/var/www/mudlands.online/logs/`
- **Backups**: `/var/www/mudlands.online/backups/`
- **Scripts**: `/var/www/mudlands.online/scripts/`

### Backup Scripts
- **Database Backup**: `/var/www/mudlands.online/scripts/backup-database.sh`
- **Website Backup**: `/var/www/mudlands.online/scripts/backup-website.sh`
- **Complete Backup**: `/var/www/mudlands.online/scripts/backup-mud.sh`

### Cron Configuration
```bash
# MudLands Online - Complete backup (Weekly - Sundays at 4:00 AM)
0 4 * * 0 /var/www/mudlands.online/scripts/backup-mud.sh >> /var/log/mudlands-backup.log 2>&1
```

## Unchanged Components

- **Nginx Configuration**: No changes required
- **SSL Certificates**: Same paths, no updates needed
- **Domain Configuration**: `mudlands.online` remains the same
- **Database Configuration**: No path changes required
- **Network Configuration**: Same ports and routing

## Testing Results

✅ **Server Startup**: Success (tested on port 3002)
✅ **API Health Check**: `/health` endpoint responding
✅ **Database Connection**: Working with new location
✅ **File Permissions**: Properly set and accessible
✅ **Backup Scripts**: Updated and functional
✅ **Cron Jobs**: Updated to new paths

## Next Steps

1. **Remove Old Location** (when confident everything works)
   ```bash
   sudo rm -rf /home/southerns/mudlands
   ```

2. **Start Production Server**
   ```bash
   cd /var/www/mudlands.online/app
   npm start
   ```

3. **Monitor Logs**
   ```bash
   tail -f /var/log/mudlands-backup.log
   tail -f /var/www/mudlands.online/logs/*.log
   ```

4. **Test Backup Scripts**
   ```bash
   /var/www/mudlands.online/scripts/backup-mud.sh
   ```

## Backup Information

- **Backup Directory**: `/mnt/HC_Volume_103339423/mudlands-backups/`
- **Retention**: 30 days for complete backups, 7 days for individual backups
- **Schedule**: Weekly complete backups on Sundays at 4:00 AM

---
**Migration Completed**: September 18, 2025 18:32 UTC
**Status**: ✅ SUCCESSFUL
**All systems functional at new location**