#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Chinese Learning Backend - Development Setup Check\n');

// Check for .env file
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  Warning: .env file not found');
  console.log('   Create .env file from .env.example and configure your settings\n');
}

// Check uploads directory
const uploadsPath = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsPath)) {
  console.log('📁 Creating uploads directory...');
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log('✅ Uploads directory created\n');
}

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1));
if (majorVersion < 16) {
  console.log('⚠️  Warning: Node.js version should be 16 or higher');
  console.log(`   Current version: ${nodeVersion}\n`);
}

console.log('✅ Development environment check complete');
console.log('🔧 Starting development server...\n');

// Start the development server
require('../server.js'); 