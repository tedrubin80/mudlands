#!/usr/bin/env node

async function testRegistration() {
    const baseURL = 'http://localhost:3000';

    try {
        // Step 1: Get CSRF token
        console.log('Getting CSRF token...');
        const csrfResponse = await fetch(`${baseURL}/api/csrf-token`, {
            credentials: 'include'
        });

        const csrfData = await csrfResponse.json();
        const csrfToken = csrfData.csrfToken;
        const cookies = csrfResponse.headers.get('set-cookie');
        console.log('Got CSRF token:', csrfToken);

        // Step 2: Register new user
        const timestamp = Date.now();
        const userData = {
            username: `testuser_${timestamp}`,
            email: `test_${timestamp}@example.com`,
            password: 'TestPassword123'
        };

        console.log('Attempting registration for:', userData.username);

        const registerResponse = await fetch(`${baseURL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken,
                'Cookie': cookies || ''
            },
            credentials: 'include',
            body: JSON.stringify(userData)
        });

        const result = await registerResponse.json();

        if (registerResponse.ok && result.success) {
            console.log('Registration successful!');
            console.log('Response:', result);
        } else {
            console.log('Registration failed:');
            console.log('Status:', registerResponse.status);
            console.log('Response:', result);
        }

    } catch (error) {
        console.error('Error during registration:');
        console.error(error.message);
    }
}

// Run the test
testRegistration();