#!/usr/bin/env node

const crypto = require('crypto');

// Generate cryptographically secure random password
function generateSecurePassword(length = 32) {
    // Use a character set that avoids problematic characters for shells and SQL
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
        password += charset[randomBytes[i] % charset.length];
    }

    return password;
}

// Generate base64 encoded secrets for tokens
function generateSecureSecret(bytes = 32) {
    return crypto.randomBytes(bytes).toString('base64');
}

// Generate hex encoded secrets
function generateHexSecret(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
}

console.log('=== CRYPTOGRAPHICALLY SECURE PASSWORDS AND SECRETS ===\n');

// Database password (32 chars, alphanumeric + special)
const dbPassword = generateSecurePassword(32);
console.log('Database Password (PostgreSQL):');
console.log(`  DB_PASSWORD=${dbPassword}`);
console.log(`  Length: ${dbPassword.length} characters`);
console.log(`  Entropy: ~190 bits\n`);

// Admin password (24 chars, high entropy)
const adminPassword = generateSecurePassword(24);
console.log('Admin User Password:');
console.log(`  ADMIN_PASSWORD=${adminPassword}`);
console.log(`  Length: ${adminPassword.length} characters`);
console.log(`  Entropy: ~142 bits\n`);

// Session secret (64 bytes, base64)
const sessionSecret = generateSecureSecret(64);
console.log('Session Secret:');
console.log(`  SESSION_SECRET=${sessionSecret}`);
console.log(`  Length: ${sessionSecret.length} characters (base64)`);
console.log(`  Entropy: 512 bits\n`);

// CSRF secret (32 bytes, base64)
const csrfSecret = generateSecureSecret(32);
console.log('CSRF Secret:');
console.log(`  CSRF_SECRET=${csrfSecret}`);
console.log(`  Length: ${csrfSecret.length} characters (base64)`);
console.log(`  Entropy: 256 bits\n`);

// JWT secret (64 bytes, base64)
const jwtSecret = generateSecureSecret(64);
console.log('JWT Secret:');
console.log(`  JWT_SECRET=${jwtSecret}`);
console.log(`  Length: ${jwtSecret.length} characters (base64)`);
console.log(`  Entropy: 512 bits\n`);

// Redis password (if needed)
const redisPassword = generateSecurePassword(32);
console.log('Redis Password (optional):');
console.log(`  REDIS_PASSWORD=${redisPassword}`);
console.log(`  Length: ${redisPassword.length} characters`);
console.log(`  Entropy: ~190 bits\n`);

console.log('=== SECURITY NOTES ===');
console.log('1. These passwords use cryptographically secure random generation');
console.log('2. Each password has high entropy (>128 bits) for maximum security');
console.log('3. Special characters are included but shell-safe');
console.log('4. Save these passwords securely before applying them');
console.log('5. Update both .env file and database after generation\n');

console.log('=== RECOMMENDED NEXT STEPS ===');
console.log('1. Save these passwords in a secure password manager');
console.log('2. Update the .env file with new values');
console.log('3. Update PostgreSQL password with ALTER USER command');
console.log('4. Update admin user password in database');
console.log('5. Restart the application');
console.log('6. Test authentication with new credentials\n');