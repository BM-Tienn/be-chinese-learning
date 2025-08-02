const fs = require('fs').promises;
const path = require('path');

/**
 * Logger class để quản lý việc ghi log
 */
class Logger {
  constructor() {
    this.logDir = 'logs';
    this.uploadLogFile = 'uploads.log';
    this.errorLogFile = 'errors.log';
    this.activityLogFile = 'activity.log';
    this.securityLogFile = 'security.log';
    
    // Đảm bảo thư mục logs tồn tại
    this.ensureLogDirectory();
  }

  /**
   * Đảm bảo thư mục logs tồn tại
   */
  async ensureLogDirectory() {
    try {
      await fs.access(this.logDir);
    } catch {
      await fs.mkdir(this.logDir, { recursive: true });
    }
  }

  /**
   * Tạo timestamp cho log
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Format log entry
   */
  formatLogEntry(level, message, data = {}) {
    const timestamp = this.getTimestamp();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...data
    };
    
    return JSON.stringify(logEntry, null, 2);
  }

  /**
   * Ghi log vào file
   */
  async writeToFile(filename, logEntry) {
    try {
      const filePath = path.join(this.logDir, filename);
      const logLine = logEntry + '\n';
      
      await fs.appendFile(filePath, logLine, 'utf8');
    } catch (error) {
      console.error('Lỗi ghi log:', error);
    }
  }

  /**
   * Log thông tin upload file
   */
  async logUpload(req, file, action, result = {}) {
    const logData = {
      route: req.originalUrl,
      method: req.method,
      user: req.user ? {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email
      } : null,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      file: {
        originalName: file?.originalname,
        mimetype: file?.mimetype,
        size: file?.size,
        fieldName: file?.fieldname
      },
      action,
      result,
      requestId: req.headers['x-request-id'] || this.generateRequestId()
    };

    const logEntry = this.formatLogEntry('INFO', `File upload: ${action}`, logData);
    await this.writeToFile(this.uploadLogFile, logEntry);
  }

  /**
   * Log hoạt động người dùng
   */
  async logActivity(req, action, details = {}) {
    const logData = {
      route: req.originalUrl,
      method: req.method,
      user: req.user ? {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email
      } : null,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      action,
      details,
      requestId: req.headers['x-request-id'] || this.generateRequestId()
    };

    const logEntry = this.formatLogEntry('INFO', `User activity: ${action}`, logData);
    await this.writeToFile(this.activityLogFile, logEntry);
  }

  /**
   * Log lỗi
   */
  async logError(req, error, context = {}) {
    const logData = {
      route: req.originalUrl,
      method: req.method,
      user: req.user ? {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email
      } : null,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        statusCode: error.statusCode
      },
      context,
      requestId: req.headers['x-request-id'] || this.generateRequestId()
    };

    const logEntry = this.formatLogEntry('ERROR', `Error occurred: ${error.message}`, logData);
    await this.writeToFile(this.errorLogFile, logEntry);
  }

  /**
   * Log sự kiện bảo mật
   */
  async logSecurity(req, event, details = {}) {
    const logData = {
      route: req.originalUrl,
      method: req.method,
      user: req.user ? {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email
      } : null,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      event,
      details,
      requestId: req.headers['x-request-id'] || this.generateRequestId()
    };

    const logEntry = this.formatLogEntry('WARN', `Security event: ${event}`, logData);
    await this.writeToFile(this.securityLogFile, logEntry);
  }

  /**
   * Log CC-CEDICT upload chi tiết
   */
  async logCedictUpload(req, file, results) {
    const logData = {
      route: req.originalUrl,
      method: req.method,
      user: req.user ? {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email
      } : null,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      file: {
        originalName: file?.originalname,
        mimetype: file?.mimetype,
        size: file?.size
      },
      results: {
        total: results.total,
        success: results.success,
        failed: results.failed,
        skipped: results.skipped,
        errors: results.errors?.slice(0, 5), // Chỉ log 5 lỗi đầu tiên
        successes: results.successes?.slice(0, 5) // Chỉ log 5 thành công đầu tiên
      },
      requestId: req.headers['x-request-id'] || this.generateRequestId()
    };

    const logEntry = this.formatLogEntry('INFO', 'CC-CEDICT upload completed', logData);
    await this.writeToFile(this.uploadLogFile, logEntry);
  }

  /**
   * Log performance metrics
   */
  async logPerformance(req, operation, duration, details = {}) {
    const logData = {
      route: req.originalUrl,
      method: req.method,
      user: req.user ? {
        id: req.user.id,
        username: req.user.username
      } : null,
      ip: req.ip,
      operation,
      duration: `${duration}ms`,
      details,
      requestId: req.headers['x-request-id'] || this.generateRequestId()
    };

    const logEntry = this.formatLogEntry('INFO', `Performance: ${operation}`, logData);
    await this.writeToFile(this.activityLogFile, logEntry);
  }

  /**
   * Tạo request ID duy nhất
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Đọc log file
   */
  async readLogFile(filename, lines = 100) {
    try {
      const filePath = path.join(this.logDir, filename);
      const content = await fs.readFile(filePath, 'utf8');
      const linesArray = content.split('\n').filter(line => line.trim());
      return linesArray.slice(-lines);
    } catch (error) {
      console.error(`Lỗi đọc file log ${filename}:`, error);
      return [];
    }
  }

  /**
   * Xóa log file cũ (giữ lại 30 ngày)
   */
  async cleanupOldLogs() {
    try {
      const files = await fs.readdir(this.logDir);
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < thirtyDaysAgo) {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      console.error('Lỗi cleanup logs:', error);
    }
  }
}

// Tạo instance singleton
const logger = new Logger();

module.exports = logger; 