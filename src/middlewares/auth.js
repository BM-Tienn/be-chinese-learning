const authController = require('../controllers/authController'); // Import authController

// Middleware bảo vệ route (yêu cầu người dùng đăng nhập)
exports.protect = authController.protect;

// Middleware giới hạn quyền truy cập theo vai trò
exports.restrictTo = authController.restrictTo;

// Middleware kiểm tra xem người dùng đã đăng nhập chưa (không bắt buộc phải đăng nhập)
exports.isLoggedIn = authController.isLoggedIn;
