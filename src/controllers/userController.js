const User = require('../models/User'); // Import model User
const catchAsync = require('../utils/catchAsync'); // Tiện ích bắt lỗi bất đồng bộ
const AppError = require('../utils/appError'); // Lớp lỗi tùy chỉnh
const APIFeatures = require('../utils/apiFeatures'); // Tiện ích cho các tính năng API (lọc, sắp xếp, phân trang)
const ApiResponse = require('../utils/apiResponse'); // Import ApiResponse utility

class UserController {
  // Hàm trợ giúp để lọc các trường không mong muốn từ một đối tượng
  static filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
      if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
  };

  /**
   * @desc Get all users
   * @route GET /api/v1/users
   * @access Private (Admin only)
   */
  getAllUsers = catchAsync(async (req, res, next) => {
    // Áp dụng các tính năng API như lọc, sắp xếp, giới hạn trường, phân trang
    const features = new APIFeatures(User.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const users = await features.query; // Thực thi truy vấn

    // Đếm tổng số documents để tính pagination
    const totalCount = await User.countDocuments(features.getFilterQuery());

    // Tạo thông tin pagination
    const pagination = ApiResponse.createPagination(req.query, totalCount);

    return ApiResponse.success(res, 200, users, pagination, 'Lấy danh sách người dùng thành công');
  });

  /**
   * @desc Get a single user by ID
   * @route GET /api/v1/users/:id
   * @access Private (Admin or self)
   */
  getUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id); // Tìm người dùng theo ID

    if (!user) {
      return next(new AppError('No user found with that ID', 404)); // Xử lý nếu không tìm thấy người dùng
    }

    return ApiResponse.successSingle(res, 200, user, 'Lấy thông tin người dùng thành công');
  });

  /**
   * @desc Update current user's own profile (non-password fields)
   * @route PATCH /api/v1/users/updateMe
   * @access Private
   */
  updateUser = catchAsync(async (req, res, next) => {
    // 1) Tạo lỗi nếu người dùng gửi dữ liệu mật khẩu
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          'This route is not for password updates. Please use /updateMyPassword.',
          400
        )
      );
    }

    // 2) Lọc bỏ các trường không mong muốn không được phép cập nhật
    const filteredBody = UserController.filterObj(req.body, 'username', 'email');

    // 3) Cập nhật tài liệu người dùng
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true, // Trả về tài liệu đã cập nhật
      runValidators: true // Chạy các validator schema
    });

    return ApiResponse.successSingle(res, 200, updatedUser, 'Cập nhật thông tin người dùng thành công');
  });

  /**
   * @desc Deactivate a user (soft delete)
   * @route DELETE /api/v1/users/:id
   * @access Private (Admin only)
   */
  deleteUser = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.params.id, { active: false }); // Cập nhật trạng thái active

    return ApiResponse.success(res, 204, [], null, 'Vô hiệu hóa người dùng thành công');
  });

  /**
   * @desc Get current authenticated user's profile
   * @route GET /api/v1/users/me
   * @access Private
   */
  getMe = (req, res, next) => {
    req.params.id = req.user.id; // Đặt ID người dùng từ token vào req.params để getUser có thể sử dụng
    next();
  };
}

module.exports = new UserController(); // Export một thể hiện của UserController
