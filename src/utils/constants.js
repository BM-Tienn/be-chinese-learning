/**
 * Constants Configuration File
 */

// ========================================
// FILE UPLOAD CONFIGURATION
// ========================================
const FILE_UPLOAD = {
  // File size limits (in bytes)
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_JSON_FILE_SIZE: 50 * 1024 * 1024, // 50MB for JSON files
  MAX_IMAGE_FILE_SIZE: 5 * 1024 * 1024, // 5MB for images
  MAX_DOCUMENT_FILE_SIZE: 20 * 1024 * 1024, // 20MB for documents
  
  // Allowed file types
  ALLOWED_JSON_TYPES: ['application/json', 'text/json'],
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  
  // Upload directories
  UPLOAD_DIR: 'uploads/',
  JSON_UPLOAD_DIR: 'uploads/json/',
  IMAGE_UPLOAD_DIR: 'uploads/images/',
  DOCUMENT_UPLOAD_DIR: 'uploads/documents/',
  
  // File naming
  FILE_NAME_MAX_LENGTH: 255,
  ALLOWED_FILE_EXTENSIONS: ['.json', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx'],
  
  // Multiple file upload limits
  MAX_FILES_COUNT: 20, // Số lượng file tối đa cho upload multiple
  MAX_JSON_FILES_COUNT: 20, // Số lượng JSON files tối đa
  MAX_IMAGE_FILES_COUNT: 10, // Số lượng image files tối đa
  MAX_DOCUMENT_FILES_COUNT: 5 // Số lượng document files tối đa
};

// ========================================
// RATE LIMITING CONFIGURATION
// ========================================
const RATE_LIMITS = {
  // Authentication rate limits
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5, // 5 attempts per 15 minutes
    MESSAGE: 'Quá nhiều lần đăng nhập, vui lòng thử lại sau 15 phút'
  },
  
  // General API rate limits
  GENERAL: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 100, // 100 requests per minute
    MESSAGE: 'Quá nhiều yêu cầu, vui lòng thử lại sau 1 phút'
  },
  
  // Upload rate limits
  UPLOAD: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 10, // 10 uploads per hour
    MESSAGE: 'Quá nhiều lần upload, vui lòng thử lại sau 1 giờ'
  },
  
  // Search rate limits
  SEARCH: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 30, // 30 searches per minute
    MESSAGE: 'Quá nhiều lần tìm kiếm, vui lòng thử lại sau 1 phút'
  }
};

// ========================================
// REQUEST CONFIGURATION
// ========================================
const REQUEST = {
  // Body size limits
  MAX_BODY_SIZE: '1000kb',
  MAX_URL_ENCODED_SIZE: '1000kb',
  
  // Request timeout
  TIMEOUT: 3000000, // 3000 seconds
  
  // Pagination defaults
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  
  // Search configuration
  MAX_SEARCH_LENGTH: 100,
  MIN_SEARCH_LENGTH: 2,
  
  // API version
  API_VERSION: 'v1',
  API_PREFIX: '/api/v1'
};

// ========================================
// SECURITY CONFIGURATION
// ========================================
const SECURITY = {
  // JWT Configuration
  JWT: {
    SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-jwt-key-here',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '90d',
    COOKIE_EXPIRES_IN: process.env.JWT_COOKIE_EXPIRES_IN || 90,
    REFRESH_TOKEN_EXPIRES_IN: '7d'
  },
  
  // Password requirements
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: false
  },
  
  // CORS Configuration
  CORS: {
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',') : 
      ['http://localhost:3000', 'http://localhost:5678', 'http://localhost:5173'],
    ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With'],
    CREDENTIALS: true
  },
  
  // Suspicious user agents to block
  SUSPICIOUS_USER_AGENTS: [
    'curl',
    'wget',
    'python-requests',
    'scraper',
    'bot',
    'spider'
  ]
};

// ========================================
// DATABASE CONFIGURATION
// ========================================
const DATABASE = {
  // Connection settings
  CONNECTION_STRING: process.env.MONGODB_URI || 'mongodb://localhost:27017/chinese-learning-v2',
  CONNECTION_TIMEOUT: 30000, // 30 seconds
  
  // Query limits
  MAX_QUERY_RESULTS: 1000,
  DEFAULT_SORT_FIELD: 'createdAt',
  DEFAULT_SORT_ORDER: -1, // Descending
  
  // Index settings
  INDEX_OPTIONS: {
    background: true,
    sparse: true
  }
};

// ========================================
// LOGGING CONFIGURATION
// ========================================
const LOGGING = {
  // Log levels
  LEVELS: {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
  },
  
  // Log files
  FILES: {
    UPLOAD: 'logs/uploads.log',
    ERROR: 'logs/errors.log',
    ACTIVITY: 'logs/activity.log',
    SECURITY: 'logs/security.log'
  },
  
  // Log retention (in days)
  RETENTION_DAYS: 30,
  
  // Performance thresholds
  SLOW_REQUEST_THRESHOLD: 1000, // 1 second
  SLOW_DB_QUERY_THRESHOLD: 500, // 500ms
  
  // Request ID format
  REQUEST_ID_PREFIX: 'req_',
  REQUEST_ID_LENGTH: 13
};

// ========================================
// VALIDATION CONFIGURATION
// ========================================
const VALIDATION = {
  // User validation
  USER: {
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 30,
    EMAIL_MAX_LENGTH: 254,
    NAME_MAX_LENGTH: 100
  },
  
  // Vocabulary validation
  VOCABULARY: {
    CHINESE_MAX_LENGTH: 50,
    PINYIN_MAX_LENGTH: 100,
    MEANING_MAX_LENGTH: 500,
    EXAMPLE_MAX_LENGTH: 200,
    TAG_MAX_LENGTH: 50,
    MAX_TAGS: 10
  },
  
  // Word validation
  WORD: {
    NOTES_MAX_LENGTH: 1000,
    MAX_EXAMPLES: 5
  },
  
  // Search validation
  SEARCH: {
    MIN_QUERY_LENGTH: 1,
    MAX_QUERY_LENGTH: 100
  }
};

// ========================================
// BUSINESS LOGIC CONFIGURATION
// ========================================
const BUSINESS = {
  // Study session settings
  STUDY: {
    DEFAULT_SESSION_SIZE: 20,
    MAX_SESSION_SIZE: 100,
    MIN_SESSION_SIZE: 5,
    SESSION_TIMEOUT: 30 * 60 * 1000 // 30 minutes
  },
  
  // Progress tracking
  PROGRESS: {
    MASTERY_THRESHOLD: 5, // Correct answers needed for mastery
    REVIEW_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    FORGET_THRESHOLD: 7 * 24 * 60 * 60 * 1000 // 7 days
  },
  
  // HSK levels
  HSK_LEVELS: [1, 2, 3, 4, 5, 6],
  
  // Categories
  CATEGORIES: [
    'HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6',
    'Common', 'Idiom', 'Proverb', 'Advanced', 'Other',
    'Place Name', 'Person Name', 'Technical', 'Literary', 'Informal'
  ]
};

// ========================================
// CACHE CONFIGURATION
// ========================================
const CACHE = {
  // Cache TTL (Time To Live) in seconds
  TTL: {
    VOCABULARY: 3600, // 1 hour
    USER_PROFILE: 1800, // 30 minutes
    SEARCH_RESULTS: 300, // 5 minutes
    STATISTICS: 3600, // 1 hour
    API_RESPONSE: 600 // 10 minutes
  },
  
  // Cache keys prefix
  KEY_PREFIX: {
    VOCABULARY: 'vocab:',
    USER: 'user:',
    SEARCH: 'search:',
    STATS: 'stats:'
  }
};

// ========================================
// ERROR MESSAGES
// ========================================
const ERROR_MESSAGES = {
  // Authentication errors
  AUTH: {
    INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
    TOKEN_EXPIRED: 'Token đã hết hạn, vui lòng đăng nhập lại',
    TOKEN_INVALID: 'Token không hợp lệ',
    UNAUTHORIZED: 'Bạn không có quyền truy cập',
    FORBIDDEN: 'Bạn không có quyền thực hiện hành động này'
  },
  
  // File upload errors
  UPLOAD: {
    FILE_TOO_LARGE: 'File quá lớn',
    INVALID_FILE_TYPE: 'Loại file không được hỗ trợ',
    NO_FILE_PROVIDED: 'Không có file nào được cung cấp',
    UPLOAD_FAILED: 'Upload file thất bại'
  },
  
  // Validation errors
  VALIDATION: {
    REQUIRED_FIELD: 'Trường này là bắt buộc',
    INVALID_EMAIL: 'Email không hợp lệ',
    PASSWORD_TOO_SHORT: 'Mật khẩu phải có ít nhất 8 ký tự',
    INVALID_FORMAT: 'Định dạng không hợp lệ'
  },
  
  // Database errors
  DATABASE: {
    CONNECTION_FAILED: 'Không thể kết nối database',
    QUERY_FAILED: 'Truy vấn database thất bại',
    RECORD_NOT_FOUND: 'Không tìm thấy bản ghi'
  }
};

// ========================================
// SUCCESS MESSAGES
// ========================================
const SUCCESS_MESSAGES = {
  // Authentication
  AUTH: {
    LOGIN_SUCCESS: 'Đăng nhập thành công',
    LOGOUT_SUCCESS: 'Đăng xuất thành công',
    SIGNUP_SUCCESS: 'Đăng ký thành công',
    PASSWORD_CHANGED: 'Mật khẩu đã được thay đổi'
  },
  
  // CRUD operations
  CRUD: {
    CREATED: 'Tạo mới thành công',
    UPDATED: 'Cập nhật thành công',
    DELETED: 'Xóa thành công',
    RETRIEVED: 'Lấy dữ liệu thành công'
  },
  
  // File operations
  FILE: {
    UPLOAD_SUCCESS: 'Upload file thành công',
    PROCESSING_COMPLETE: 'Xử lý file hoàn tất'
  }
};

// ========================================
// HTTP STATUS CODES
// ========================================
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// ========================================
// ENVIRONMENT CONFIGURATION
// ========================================
const ENVIRONMENT = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
  
  // Current environment
  CURRENT: process.env.NODE_ENV || 'development',
  
  // Environment-specific settings
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_TEST: process.env.NODE_ENV === 'test'
};

// ========================================
// EXPORT ALL CONSTANTS
// ========================================
module.exports = {
  FILE_UPLOAD,
  RATE_LIMITS,
  REQUEST,
  SECURITY,
  DATABASE,
  LOGGING,
  VALIDATION,
  BUSINESS,
  CACHE,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  HTTP_STATUS,
  ENVIRONMENT
};
