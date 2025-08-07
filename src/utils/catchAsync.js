
/**
 * Middleware để bắt các lỗi không đồng bộ trong các route handler.
 * Bọc controller của bạn bằng hàm này để không cần dùng try-catch ở mọi nơi.
 * @example
 * router.get('/', asyncHandler(userController.getAllUsers));
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync; 