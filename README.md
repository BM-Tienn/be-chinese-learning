# Chinese Learning V2 - Backend API

Ứng dụng học tiếng Trung với API backend được xây dựng theo chuẩn Node.js project structure.

## 🏗️ Cấu trúc Project

```
chinese-learning-v2/
├── src/                          # Source code chính
│   ├── config/                   # Cấu hình hệ thống
│   │   ├── database.js          # Kết nối MongoDB
│   │   └── swagger.js           # Cấu hình Swagger API docs
│   ├── models/                   # Schema MongoDB/Mongoose
│   │   ├── User.js              # Model người dùng
│   │   ├── Vocabulary.js        # Model từ vựng chung
│   │   └── Word.js              # Model từ vựng cá nhân
│   ├── controllers/              # Xử lý request/response
│   │   ├── authController.js    # Xác thực (login, signup)
│   │   ├── userController.js    # Quản lý người dùng
│   │   ├── vocabularyController.js # Quản lý từ vựng chung
│   │   └── wordController.js    # Quản lý từ vựng cá nhân
│   ├── services/                 # Logic nghiệp vụ
│   │   ├── userService.js       # Service người dùng
│   │   ├── vocabularyService.js # Service từ vựng
│   │   ├── wordService.js       # Service từ vựng cá nhân
│   │   ├── cedictService.js     # Service import CC-CEDICT
│   │   └── socketService.js     # Service Socket.IO
│   ├── middlewares/              # Middleware Express
│   │   ├── auth.js              # Xác thực JWT
│   │   ├── errorHandler.js      # Xử lý lỗi
│   │   ├── requestLogger.js     # Log request
│   │   ├── security.js          # Bảo mật
│   │   └── upload.js            # Upload file
│   ├── validate/                 # Validation schema
│   │   ├── authValidation.js    # Validate auth
│   │   ├── userValidation.js    # Validate user
│   │   ├── vocabularyValidation.js # Validate vocabulary
│   │   └── wordValidation.js    # Validate word
│   ├── webhooks/                 # Webhook handlers
│   │   └── handlers.js          # Socket.IO handlers
│   ├── routes/                   # API routes
│   │   ├── authRoutes.js        # Auth routes
│   │   ├── userRoutes.js        # User routes
│   │   ├── vocabularyRoutes.js  # Vocabulary routes
│   │   └── wordRoutes.js        # Word routes
│   ├── utils/                    # Utility functions
│   │   ├── apiResponse.js       # Response format
│   │   ├── appError.js          # Error handling
│   │   ├── catchAsync.js        # Async error wrapper
│   │   ├── logger.js            # Logging utility
│   │   └── apiFeatures.js       # API features (pagination, filter)
│   ├── helpers/                  # Helper functions
│   │   └── docs/                # Documentation files
│   ├── logs/                     # Log files
│   ├── scripts/                  # CLI scripts
│   │   ├── seedData.js          # Seed database
│   │   ├── view-logs.js         # View logs
│   │   └── data/                # Sample data
│   ├── tests/                    # Test files
│   ├── app.js                    # Express app setup
│   └── server.js                 # Server startup
├── .env                          # Environment variables
├── .gitignore                    # Git ignore rules
├── package.json                  # Dependencies & scripts
└── README.md                     # Project documentation
```

## 🚀 Cài đặt & Chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình environment
```bash
cp .env.example .env
# Chỉnh sửa .env với thông tin database và JWT secret
```

### 3. Chạy development server
```bash
npm run dev
```

### 4. Seed database (tùy chọn)
```bash
npm run seed
```

## 📚 API Documentation

- **Swagger UI**: http://localhost:5678/api-docs
- **Health Check**: http://localhost:5678/health

## 🔧 Scripts

```bash
# Development
npm run dev              # Chạy với nodemon
npm start               # Chạy production
npm run prod            # Chạy production mode

# Database
npm run seed            # Seed dữ liệu mẫu
npm run delete-data     # Xóa tất cả dữ liệu

# Logs
npm run logs:all        # Xem tất cả logs
npm run logs:cleanup    # Dọn logs cũ
npm run logs:stats      # Thống kê logs

# Testing
npm test                # Chạy tests
npm run test:watch      # Chạy tests với watch mode
```

## 🏛️ Kiến trúc

### 1. **Controllers** (Thin Layer)
- Nhận request từ client
- Validate input
- Gọi service layer
- Trả response

### 2. **Services** (Business Logic)
- Xử lý logic nghiệp vụ
- Tương tác với database
- Không phụ thuộc Express

### 3. **Models** (Data Layer)
- Định nghĩa schema MongoDB
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

## 📊 Logging System

- Request logging
- Error logging
- Upload logging
- Security event logging
- Performance monitoring
- Structured JSON logs

## 🧪 Testing

```bash
# Chạy tất cả tests
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

## 🤝 Contributing

1. Fork project
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết. 