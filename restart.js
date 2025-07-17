#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🔄 Restarting Chinese Learning Backend Server...\n');

// Kill any existing process on port 5001
console.log('🛑 Checking for existing processes on port 5001...');

const killProcess = spawn('npx', ['kill-port', '5001'], {
  stdio: 'inherit',
  shell: true
});

killProcess.on('close', (code) => {
  console.log('✅ Port 5001 cleared\n');
  
  // Wait a moment then start the server
  setTimeout(() => {
    console.log('🚀 Starting server with updated CORS configuration...\n');
    
    const server = spawn('node', ['server.js'], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, FORCE_COLOR: true }
    });
    
    server.on('error', (error) => {
      console.error('❌ Failed to start server:', error);
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping server...');
      server.kill('SIGINT');
      process.exit(0);
    });
    
  }, 1000);
}); 