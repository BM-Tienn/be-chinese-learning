const AppError = require('../utils/appError'); // Lớp lỗi tùy chỉnh

// Xử lý lỗi CastError của Mongoose (ví dụ: ID không hợp lệ)
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400); // Trả về lỗi 400 Bad Request
};

// Xử lý lỗi trùng lặp trường trong MongoDB (mã lỗi 11000)
const handleDuplicateFieldsDB = err => {
  const value = err.keyValue ? Object.values(err.keyValue)[0] : 'duplicate value';
  const message = `Duplicate field value: "${value}". Please use another value!`;
  return new AppError(message, 400); // Trả về lỗi 400 Bad Request
};

// Xử lý lỗi xác thực của Mongoose (Validation Error)
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message); // Lấy tất cả các thông báo lỗi xác thực
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400); // Trả về lỗi 400 Bad Request
};

// Xử lý lỗi JWT không hợp lệ
const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401); // Trả về lỗi 401 Unauthorized

// Xử lý lỗi JWT hết hạn
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401); // Trả về lỗi 401 Unauthorized

// Gửi chi tiết lỗi trong môi trường phát triển
const sendErrorDev = (err, req, res) => {
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).json({
    status: err.status,
    error: {
      statusCode: err.statusCode,
      status: err.status,
      isOperational: err.isOperational
    },
    message: err.message,
    stack: err.stack // Bao gồm stack trace trong môi trường dev
  });
};

// Gửi thông báo lỗi thân thiện trong môi trường sản xuất
const sendErrorProd = (err, req, res) => {
  // Lỗi hoạt động (operational error): gửi thông báo cho client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }
  // Lỗi lập trình hoặc lỗi không xác định: không tiết lộ chi tiết lỗi
  console.error('ERROR 💥', err); // Ghi log lỗi đầy đủ
  return res.status(500).json({
    status: 'error',
    message: 'Something went very wrong!' // Thông báo lỗi chung
  });
};

// Middleware xử lý lỗi toàn cục
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500; // Đặt mã trạng thái mặc định là 500
  err.status = err.status || 'error'; // Đặt trạng thái lỗi mặc định

  // Đảm bảo không bao giờ trả về stack trace trong production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  if (isDevelopment) {
    sendErrorDev(err, req, res); // Gửi lỗi chi tiết trong dev
  } else if (isProduction) {
    let error = { ...err }; // Tạo bản sao của đối tượng lỗi
    error.message = err.message; // Đảm bảo thông báo lỗi được sao chép

    // Xử lý các loại lỗi cụ thể của Mongoose và JWT
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res); // Gửi lỗi thân thiện trong production
  } else {
    // Fallback cho các môi trường khác - xử lý như production
    let error = { ...err };
    error.message = err.message;
    sendErrorProd(error, req, res);
  }
};
