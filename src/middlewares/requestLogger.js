const logger = require('../utils/logger');

/**
 * Middleware để log tất cả requests
 */
const requestLogger = (req, res, next) => {
  // Tạo request ID
  req.requestId = logger.generateRequestId();
  req.headers['x-request-id'] = req.requestId;
  
  // Ghi lại thời gian bắt đầu
  req.startTime = Date.now();
  
  // Log request bắt đầu
  logger.logActivity(req, 'REQUEST_START', {
    requestId: req.requestId,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined
  });

  // Override res.end để log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - req.startTime;
    
    // Log response
    logger.logActivity(req, 'REQUEST_END', {
      requestId: req.requestId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || 0
    });

    // Log performance nếu request chậm (> 1 giây)
    if (duration > 1000) {
      logger.logPerformance(req, 'SLOW_REQUEST', duration, {
        threshold: '1000ms'
      });
    }

    // Gọi original end
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Middleware để log upload files
 */
const uploadLogger = (req, res, next) => {
  if (req.file || req.files) {
    const files = req.files ? Object.values(req.files).flat() : [req.file];
    
    files.forEach(file => {
      logger.logUpload(req, file, 'FILE_UPLOADED', {
        uploadType: req.files ? 'multiple' : 'single'
      });
    });
  }
  
  next();
};

/**
 * Middleware để log errors
 */
const errorLogger = (err, req, res, next) => {
  logger.logError(req, err, {
    requestId: req.requestId,
    duration: req.startTime ? Date.now() - req.startTime : undefined
  });
  
  next(err);
};

module.exports = {
  requestLogger,
  uploadLogger,
  errorLogger
}; 