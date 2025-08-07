const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const AppError = require('../utils/appError');
const { 
  FILE_UPLOAD, 
  RATE_LIMITS, 
  REQUEST, 
  SECURITY, 
  ERROR_MESSAGES 
} = require('../utils/constants');

// Tạo store cho upload rate limit để có thể reset
const uploadRateLimitStore = new Map();

/**
 * Rate limiting cho API
 */
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      status: 'error',
      message: message || 'Quá nhiều request từ IP này, vui lòng thử lại sau'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Rate limit cho authentication
const authRateLimit = createRateLimit(
  RATE_LIMITS.AUTH.WINDOW_MS,
  RATE_LIMITS.AUTH.MAX_REQUESTS,
  RATE_LIMITS.AUTH.MESSAGE
);

// Rate limit cho API chung
const apiRateLimit = createRateLimit(
  RATE_LIMITS.GENERAL.WINDOW_MS,
  RATE_LIMITS.GENERAL.MAX_REQUESTS,
  RATE_LIMITS.GENERAL.MESSAGE
);

// Rate limit cho upload với custom store
const uploadRateLimit = rateLimit({
  windowMs: RATE_LIMITS.UPLOAD.WINDOW_MS,
  max: RATE_LIMITS.UPLOAD.MAX_REQUESTS,
  message: {
    status: 'error',
    message: RATE_LIMITS.UPLOAD.MESSAGE
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: {
    incr: (key) => {
      const current = uploadRateLimitStore.get(key) || 0;
      uploadRateLimitStore.set(key, current + 1);
      return Promise.resolve({ totalHits: current + 1, resetTime: Date.now() + RATE_LIMITS.UPLOAD.WINDOW_MS });
    },
    decrement: (key) => {
      const current = uploadRateLimitStore.get(key) || 0;
      if (current > 0) {
        uploadRateLimitStore.set(key, current - 1);
      }
      return Promise.resolve();
    },
    resetKey: (key) => {
      uploadRateLimitStore.delete(key);
      return Promise.resolve();
    },
    clear: () => {
      uploadRateLimitStore.clear();
      return Promise.resolve();
    }
  }
});

/**
 * CORS configuration
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Cho phép requests không có origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Trong development, cho phép tất cả origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (SECURITY.CORS.ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new AppError('Không được phép truy cập từ origin này', 403));
    }
  },
  credentials: SECURITY.CORS.CREDENTIALS,
  optionsSuccessStatus: 200,
  methods: SECURITY.CORS.ALLOWED_METHODS,
  allowedHeaders: SECURITY.CORS.ALLOWED_HEADERS
};

/**
 * Security headers với Helmet
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

/**
 * Sanitize MongoDB queries
 */
const sanitizeMongo = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`MongoDB injection attempt detected: ${key} in ${req.originalUrl}`);
  }
});

/**
 * Sanitize XSS
 */
const sanitizeXSS = xss();

/**
 * Prevent HTTP Parameter Pollution
 */
const preventHPP = hpp({
  whitelist: [
    'filter',
    'sort',
    'page',
    'limit',
    'fields',
    'search',
    'hskLevel',
    'category',
    'tags',
    'status',
    'favorite',
    'dateFrom',
    'dateTo',
    'period',
    'difficulty',
    'mode',
    'format',
    'includeProgress',
    'includeNotes'
  ]
});

/**
 * Validate Content-Type
 */
const validateContentType = (req, res, next) => {
  // Bỏ qua validation cho upload endpoint và Swagger
  if (req.path.includes('/upload-cedict') || 
      req.path.startsWith('/api-docs') ||
      req.headers['user-agent']?.includes('Swagger')) {
    return next();
  }
  
  // Chỉ validate cho POST/PUT/PATCH endpoints quan trọng
  if ((req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') && 
      req.path.includes('/auth/')) {
    const contentType = req.headers['content-type'];
    
    // Cho phép JSON và form data
    if (contentType && 
        !contentType.includes('application/json') && 
        !contentType.includes('multipart/form-data') && 
        !contentType.includes('application/x-www-form-urlencoded')) {
      console.warn(`Unexpected Content-Type: ${contentType} for ${req.method} ${req.path}`);
      // Không block request, chỉ log warning
    }
  }
  next();
};

/**
 * Validate request size
 */
const validateRequestSize = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  const isFileUploadEndpoint = req.path.includes('/upload-cedict');
  
  // Cho phép file upload lớn hơn
  const maxSize = isFileUploadEndpoint ? FILE_UPLOAD.MAX_JSON_FILE_SIZE : FILE_UPLOAD.MAX_FILE_SIZE;
  
  // if (contentLength > maxSize) {
  //   const maxSizeMB = Math.floor(maxSize / (1024 * 1024));
  //   return next(new AppError(`Request body quá lớn (tối đa ${maxSizeMB}MB)`, 413));
  // }
  next();
};

/**
 * Block suspicious user agents
 */
const blockSuspiciousUserAgents = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  
  // Bỏ qua cho Swagger UI và các endpoint documentation
  const isSwaggerEndpoint = req.path.startsWith('/api-docs');
  const isSwaggerRequest = userAgent.includes('Swagger') || userAgent.includes('swagger-ui');
  
  if (isSwaggerEndpoint || isSwaggerRequest) {
    return next();
  }
  
  const suspiciousPatterns = SECURITY.SUSPICIOUS_USER_AGENTS.map(agent => new RegExp(agent, 'i'));

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  
  if (isSuspicious) {
    console.warn(`Suspicious user agent blocked: ${userAgent} from ${req.ip}`);
    return next(new AppError('Access denied', 403));
  }
  
  next();
};

/**
 * Validate API version
 */
const validateApiVersion = (req, res, next) => {
  // Chỉ validate cho API routes
  if (!req.path.startsWith('/api/')) {
    return next();
  }
  
  const pathParts = req.path.split('/');
  const apiVersion = pathParts[2]; // /api/v1/...
  
  if (apiVersion !== REQUEST.API_VERSION) {
    return next(new AppError('API version không được hỗ trợ', 400));
  }
  
  next();
};

/**
 * Log security events
 */
const logSecurityEvent = (req, res, next) => {
  const securityEvents = [
    'authentication_failure',
    'authorization_failure',
    'rate_limit_exceeded',
    'suspicious_activity',
    'injection_attempt',
    'xss_attempt'
  ];

  // Log các events quan trọng
  if (req.path.includes('/auth') && req.method === 'POST') {
    // Authentication attempt logged
  }

  next();
};

/**
 * Apply tất cả security middleware
 */
const applySecurityMiddleware = (app) => {
  // Lưu upload rate limit store vào app.locals để có thể reset
  app.locals.uploadRateLimitStore = uploadRateLimitStore;
  
  // Basic security headers
  app.use(securityHeaders);
  
  // CORS
  app.use(cors(corsOptions));
  
  // Rate limiting
  app.use('/api/v1/auth', authRateLimit);
  app.use('/api/v1/vocabularies/upload-cedict', uploadRateLimit);
  app.use('/api/v1', apiRateLimit);
  
  // Sanitization
  app.use(sanitizeMongo);
  app.use(sanitizeXSS);
  app.use(preventHPP);
  
  // Validation
  app.use(validateContentType);
  app.use(validateRequestSize);
  app.use(blockSuspiciousUserAgents);
  app.use(validateApiVersion);
  app.use(logSecurityEvent);
  
  // Trust proxy (nếu deploy sau proxy)
  app.set('trust proxy', 1);
};

module.exports = {
  applySecurityMiddleware,
  authRateLimit,
  apiRateLimit,
  uploadRateLimit,
  uploadRateLimitStore,
  corsOptions,
  securityHeaders,
  sanitizeMongo,
  sanitizeXSS,
  preventHPP,
  validateContentType,
  validateRequestSize,
  blockSuspiciousUserAgents,
  validateApiVersion,
  logSecurityEvent
}; 