const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

/**
 * Script để xem và quản lý logs
 */
async function viewLogs() {
  const args = process.argv.slice(2);
  const command = args[0];
  const filename = args[1];
  const lines = parseInt(args[2]) || 50;

  console.log('📋 Log Viewer - Chinese Learning API');
  console.log('=====================================\n');

  switch (command) {
    case 'uploads':
      await showUploadLogs(lines);
      break;
    case 'errors':
      await showErrorLogs(lines);
      break;
    case 'activity':
      await showActivityLogs(lines);
      break;
    case 'security':
      await showSecurityLogs(lines);
      break;
    case 'all':
      await showAllLogs(lines);
      break;
    case 'cleanup':
      await cleanupOldLogs();
      break;
    case 'stats':
      await showLogStats();
      break;
    default:
      showHelp();
  }
}

/**
 * Hiển thị upload logs
 */
async function showUploadLogs(lines) {
  console.log('📤 UPLOAD LOGS:');
  console.log('================\n');
  
  try {
    const logs = await logger.readLogFile('uploads.log', lines);
    logs.forEach(log => {
      try {
        const data = JSON.parse(log);
        console.log(`[${data.timestamp}] ${data.level}: ${data.message}`);
        console.log(`   Route: ${data.route}`);
        console.log(`   User: ${data.user?.username || 'Anonymous'}`);
        console.log(`   File: ${data.file?.originalName || 'N/A'}`);
        console.log(`   Size: ${data.file?.size || 'N/A'} bytes`);
        console.log(`   Action: ${data.action}`);
        console.log('');
      } catch (e) {
        console.log(log);
      }
    });
  } catch (error) {
    console.log('❌ Không thể đọc upload logs:', error.message);
  }
}

/**
 * Hiển thị error logs
 */
async function showErrorLogs(lines) {
  console.log('❌ ERROR LOGS:');
  console.log('===============\n');
  
  try {
    const logs = await logger.readLogFile('errors.log', lines);
    logs.forEach(log => {
      try {
        const data = JSON.parse(log);
        console.log(`[${data.timestamp}] ${data.level}: ${data.message}`);
        console.log(`   Route: ${data.route}`);
        console.log(`   User: ${data.user?.username || 'Anonymous'}`);
        console.log(`   Error: ${data.error?.name}: ${data.error?.message}`);
        console.log(`   Status: ${data.error?.statusCode || 'N/A'}`);
        console.log('');
      } catch (e) {
        console.log(log);
      }
    });
  } catch (error) {
    console.log('❌ Không thể đọc error logs:', error.message);
  }
}

/**
 * Hiển thị activity logs
 */
async function showActivityLogs(lines) {
  console.log('📊 ACTIVITY LOGS:');
  console.log('==================\n');
  
  try {
    const logs = await logger.readLogFile('activity.log', lines);
    logs.forEach(log => {
      try {
        const data = JSON.parse(log);
        console.log(`[${data.timestamp}] ${data.level}: ${data.message}`);
        console.log(`   Route: ${data.route}`);
        console.log(`   User: ${data.user?.username || 'Anonymous'}`);
        console.log(`   Action: ${data.action}`);
        if (data.duration) {
          console.log(`   Duration: ${data.duration}`);
        }
        console.log('');
      } catch (e) {
        console.log(log);
      }
    });
  } catch (error) {
    console.log('❌ Không thể đọc activity logs:', error.message);
  }
}

/**
 * Hiển thị security logs
 */
async function showSecurityLogs(lines) {
  console.log('🔒 SECURITY LOGS:');
  console.log('==================\n');
  
  try {
    const logs = await logger.readLogFile('security.log', lines);
    logs.forEach(log => {
      try {
        const data = JSON.parse(log);
        console.log(`[${data.timestamp}] ${data.level}: ${data.message}`);
        console.log(`   Route: ${data.route}`);
        console.log(`   User: ${data.user?.username || 'Anonymous'}`);
        console.log(`   IP: ${data.ip}`);
        console.log(`   Event: ${data.event}`);
        console.log('');
      } catch (e) {
        console.log(log);
      }
    });
  } catch (error) {
    console.log('❌ Không thể đọc security logs:', error.message);
  }
}

/**
 * Hiển thị tất cả logs
 */
async function showAllLogs(lines) {
  console.log('📋 ALL LOGS (Last 10 entries each):');
  console.log('====================================\n');
  
  await showUploadLogs(10);
  await showErrorLogs(10);
  await showActivityLogs(10);
  await showSecurityLogs(10);
}

/**
 * Cleanup old logs
 */
async function cleanupOldLogs() {
  console.log('🧹 Cleaning up old logs...');
  await logger.cleanupOldLogs();
  console.log('✅ Cleanup completed!');
}

/**
 * Hiển thị thống kê logs
 */
async function showLogStats() {
  console.log('📊 LOG STATISTICS:');
  console.log('==================\n');
  
  try {
    const logFiles = ['uploads.log', 'errors.log', 'activity.log', 'security.log'];
    
    for (const file of logFiles) {
      try {
        const logs = await logger.readLogFile(file, 1000);
        console.log(`${file}:`);
        console.log(`   Total entries: ${logs.length}`);
        
        if (logs.length > 0) {
          const firstLog = JSON.parse(logs[0]);
          const lastLog = JSON.parse(logs[logs.length - 1]);
          console.log(`   First entry: ${firstLog.timestamp}`);
          console.log(`   Last entry: ${lastLog.timestamp}`);
        }
        console.log('');
      } catch (error) {
        console.log(`${file}: Không có dữ liệu`);
      }
    }
  } catch (error) {
    console.log('❌ Không thể đọc log statistics:', error.message);
  }
}

/**
 * Hiển thị help
 */
function showHelp() {
  console.log('📖 USAGE:');
  console.log('==========\n');
  console.log('node scripts/view-logs.js <command> [filename] [lines]\n');
  console.log('Commands:');
  console.log('  uploads [lines]     - Xem upload logs (default: 50 lines)');
  console.log('  errors [lines]      - Xem error logs (default: 50 lines)');
  console.log('  activity [lines]    - Xem activity logs (default: 50 lines)');
  console.log('  security [lines]    - Xem security logs (default: 50 lines)');
  console.log('  all                 - Xem tất cả logs (10 lines mỗi loại)');
  console.log('  cleanup             - Xóa logs cũ (> 30 ngày)');
  console.log('  stats               - Hiển thị thống kê logs');
  console.log('  help                - Hiển thị help này\n');
  console.log('Examples:');
  console.log('  node scripts/view-logs.js uploads 100');
  console.log('  node scripts/view-logs.js errors 20');
  console.log('  node scripts/view-logs.js all');
  console.log('  node scripts/view-logs.js cleanup');
}

// Chạy script
viewLogs().catch(console.error); 