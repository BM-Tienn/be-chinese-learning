# Chinese Learning V2 - Backend API

A Chinese learning application with a Node.js backend API built following standard project structure.

## 🏗️ Project Structure

```
chinese-learning-v2/
├── src/                                # Main source code
│   ├── config/                         # System configuration
│   │   ├── database.js                 # MongoDB connection
│   │   └── swagger.js                  # Swagger API docs configuration
│   ├── models/                         # MongoDB/Mongoose schemas
│   │   ├── User.js                     # User model
│   │   ├── Vocabulary.js               # General vocabulary model
│   │   ├── Word.js                     # Personal vocabulary model
│   │   ├── Course.js                   # Course model
│   │   ├── Lesson.js                   # Lesson model
│   │   ├── FlashcardSet.js             # Flashcard set model
│   │   ├── UserGoal.js                 # User goals model
│   │   ├── UserProgress.js             # User progress tracking
│   │   ├── StudySession.js             # Study session model
│   │   └── Configuration.js            # System configuration model
│   ├── controllers/                    # Request/response handlers
│   │   ├── authController.js           # Authentication (login, signup)
│   │   ├── userController.js           # User management
│   │   ├── vocabularyController.js     # General vocabulary management
│   │   ├── wordController.js           # Personal vocabulary management
│   │   ├── courseController.js         # Course management
│   │   ├── flashcardController.js      # Flashcard management
│   │   ├── dashboardController.js      # Dashboard statistics
│   │   └── configurationController.js  # System configuration
│   ├── services/                       # Business logic
│   │   ├── userService.js              # User service
│   │   ├── vocabularyService.js        # Vocabulary service
│   │   ├── wordService.js              # Personal vocabulary service
│   │   ├── cedictService.js            # CC-CEDICT import service
│   │   ├── socketService.js            # Socket.IO service
│   │   └── configurationService.js     # Configuration service
│   ├── middlewares/                    # Express middlewares
│   │   ├── auth.js                     # JWT authentication
│   │   ├── errorHandler.js             # Error handling
│   │   ├── requestLogger.js            # Request logging
│   │   ├── security.js                 # Security middleware
│   │   ├── upload.js                   # File upload
│   │   └── sanitize.js                 # Data sanitization
│   ├── validate/                       # Validation schemas
│   │   ├── authValidation.js           # Auth validation
│   │   ├── userValidation.js           # User validation
│   │   ├── vocabularyValidation.js     # Vocabulary validation
│   │   ├── wordValidation.js           # Word validation
│   │   ├── configurationValidation.js  # Configuration validation
│   │   └── commonValidation.js         # Common validation utilities
│   ├── webhooks/                       # Webhook handlers
│   │   └── handlers.js                 # Socket.IO handlers
│   ├── routes/                         # API routes
│   │   ├── authRoutes.js               # Auth routes
│   │   ├── userRoutes.js               # User routes
│   │   ├── vocabularyRoutes.js         # Vocabulary routes
│   │   ├── wordRoutes.js               # Word routes
│   │   ├── courseRoutes.js             # Course routes
│   │   ├── flashcardRoutes.js          # Flashcard routes
│   │   ├── dashboardRoutes.js          # Dashboard routes
│   │   └── configurationRoutes.js      # Configuration routes
│   ├── utils/                          # Utility functions
│   │   ├── constants.js                # 🆕 Centralized configuration constants
│   │   ├── apiResponse.js              # Response format
│   │   ├── appError.js                 # Error handling
│   │   ├── catchAsync.js               # Async error wrapper
│   │   ├── logger.js                   # Logging utility
│   │   └── apiFeatures.js              # API features (pagination, filter)
│   ├── helpers/                        # Helper functions & documentation
│   ├── logs/                           # Log files
│   ├── scripts/                        # CLI scripts
│   │   ├── seedData.js                 # Database seeding
│   │   ├── view-logs.js                # Log viewer
│   │   └── data/                       # Sample data
│   ├── tests/                          # Test files (empty)
│   ├── app.js                          # Express app setup
│   └── server.js                       # Server startup
├── .env                                # Environment variables
├── .gitignore                          # Git ignore rules
├── package.json                        # Dependencies & scripts
├── nodemon.json                        # Nodemon configuration
├── LICENSE.txt                         # MIT License
└── README.md                           # Project documentation
```

## 🚀 Installation & Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with database info and JWT secret
```

### 3. Run development server
```bash
npm run dev
```

### 4. Seed database (optional)
```bash
npm run seed
```

## 📚 API Documentation

- **Swagger UI**: http://localhost:5678/api-docs
- **Health Check**: http://localhost:5678/health

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Run with nodemon
npm start               # Run production
npm run prod            # Run production mode

# Database
npm run seed            # Seed sample data
npm run delete-data     # Delete all data

# Logs
npm run logs:all        # View all logs
npm run logs:cleanup    # Clean old logs
npm run logs:stats      # Log statistics

# Testing
npm test                # Run tests
npm run test:watch      # Run tests with watch mode
```

## 🏛️ Architecture

### 1. **Controllers** (Thin Layer)
- Receive requests from client
- Validate input
- Call service layer
- Return response

### 2. **Services** (Business Logic)
- Handle business logic
- Interact with database
- Independent of Express

### 3. **Models** (Data Layer)
- Define MongoDB schemas
- Validation rules
- Database operations

### 4. **Middlewares** (Cross-cutting Concerns)
- Authentication
- Error handling
- Logging
- Security
- File upload

## 🔐 Security Features

- JWT Authentication
- Rate limiting
- CORS protection
- XSS protection
- NoSQL injection protection
- Parameter pollution protection
- Security headers (Helmet)
- Input validation & sanitization
- Centralized configuration management

## 📊 Logging System

- Request logging
- Error logging
- Upload logging
- Security event logging
- Performance monitoring
- Structured JSON logs

## 🧪 Testing

```bash
# Run all tests
npm test

# Test content-type validation
node src/tests/test-content-type-validation.js

# Test CORS
node src/tests/test-cors.js

# Test file upload
node src/tests/test-curl-upload.js
```

## 📝 Environment Variables

```env
# Server
PORT=5678
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/chinese-learning-v2

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## ⚙️ Configuration Management

Tất cả cấu hình được tập trung trong file `src/utils/constants.js`:

- **FILE_UPLOAD**: File size limits, allowed types, upload directories
- **RATE_LIMITS**: Rate limiting configuration for different endpoints
- **REQUEST**: Request size limits, pagination defaults, API version
- **SECURITY**: JWT settings, password requirements, CORS configuration
- **DATABASE**: Connection settings, query limits, index options
- **LOGGING**: Log levels, file paths, performance thresholds
- **VALIDATION**: Field length limits, business rules
- **BUSINESS**: Study session settings, progress tracking, HSK levels
- **CACHE**: TTL settings, key prefixes
- **ERROR_MESSAGES**: Centralized error messages
- **SUCCESS_MESSAGES**: Centralized success messages
- **HTTP_STATUS**: HTTP status codes
- **ENVIRONMENT**: Environment detection and settings

Xem chi tiết: [Constants Configuration Guide](src/helpers/README_CONSTANTS.md)

## 📖 Documentation

### API Documentation
- [API Response Format](src/helpers/API_RESPONSE_FORMAT.md)
- [Swagger Guide](src/helpers/SWAGGER_GUIDE.md)

### Security & Validation
- [Content Type Validation](src/helpers/CONTENT_TYPE_VALIDATION.md)
- [Production Security](src/helpers/PRODUCTION_SECURITY.md)
- [Validation Guide](src/helpers/VALIDATION_GUIDE.md)

### System Features
- [Logging System](src/helpers/LOGGING_SYSTEM.md)
- [CC-CEDICT Upload Guide](src/helpers/UPLOAD_CC_CEDICT_GUIDE.md)
- [Models Documentation](src/models/README_MODELS.md)

## 🤝 Contributing

1. Fork the project
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE.txt) file for details. 