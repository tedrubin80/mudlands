const io = require('socket.io-client');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI5ZjQ3YzZjLWNhN2EtNGY2Ny1iM2ZhLTQ2NzVkZDdkMTI1MCIsInVzZXJuYW1lIjoidGVzdGNoYXIiLCJqdGkiOiIzNzZkYWZmMi1kNTYwLTRiMTgtYTEwZS0xNTZlYjIxNzAxZmUiLCJpYXQiOjE3NTg0ODAwNzUsImV4cCI6MTc1OTA4NDg3NX0.GKiTxyoaqVe5bsquhWZXiq2s4hEEilUaR8K0P0t4oA4';

const socket = io('http://127.0.0.1:3002', {
    auth: {
        token: token
    }
});

socket.on('connect', () => {
    console.log('Connected to Socket.IO');

    // Test command
    socket.emit('command', { command: 'look' });
});

socket.on('authenticated', () => {
    console.log('Authentication successful');
});

socket.on('authError', (data) => {
    console.log('Authentication error:', data);
});

socket.on('commandResponse', (data) => {
    console.log('Command response:', data);
    process.exit(0);
});

socket.on('error', (err) => {
    console.log('Socket error:', err);
    process.exit(1);
});

socket.on('disconnect', () => {
    console.log('Disconnected');
    process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
    console.log('Test timeout');
    process.exit(1);
}, 10000);