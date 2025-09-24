#!/bin/bash

echo "=== Testing Mudlands Registration System ==="

# Step 1: Start a session and get CSRF token
echo "1. Getting CSRF token with session..."
CSRF_RESPONSE=$(curl -s -c /tmp/mudlands_cookies.txt \
    -H "Accept: application/json" \
    http://localhost:3000/api/csrf-token)

CSRF_TOKEN=$(echo "$CSRF_RESPONSE" | grep -o '"csrfToken":"[^"]*' | cut -d'"' -f4)
echo "   CSRF Token: $CSRF_TOKEN"

# Check cookies
echo "2. Session cookies:"
cat /tmp/mudlands_cookies.txt | grep -v "^#"

# Step 2: Attempt registration with the same session
TIMESTAMP=$(date +%s)
USERNAME="testuser_${TIMESTAMP}"
EMAIL="test_${TIMESTAMP}@example.com"

echo "3. Attempting to register: $USERNAME"

REGISTER_RESPONSE=$(curl -s -X POST \
    -b /tmp/mudlands_cookies.txt \
    -c /tmp/mudlands_cookies.txt \
    -H "Content-Type: application/json" \
    -H "X-CSRF-Token: $CSRF_TOKEN" \
    -d "{\"username\":\"$USERNAME\",\"email\":\"$EMAIL\",\"password\":\"TestPassword123\"}" \
    http://localhost:3000/api/auth/register)

echo "4. Registration response:"
echo "$REGISTER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$REGISTER_RESPONSE"

# Clean up
rm -f /tmp/mudlands_cookies.txt

echo "=== Test Complete ==="
