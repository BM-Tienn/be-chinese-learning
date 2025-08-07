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

  /**
   * @desc Change user password
   * @route POST /api/v1/users/changePassword
   * @access Private
   */
  changePassword = catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return next(new AppError('Tất cả các trường mật khẩu là bắt buộc', 400));
    }

    if (newPassword !== confirmPassword) {
      return next(new AppError('Mật khẩu xác nhận không khớp', 400));
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.correctPassword(currentPassword, user.password))) {
      return next(new AppError('Mật khẩu hiện tại không đúng', 401));
    }

    // Update password
    user.password = newPassword;
    user.passwordConfirm = confirmPassword;
    await user.save();

    return ApiResponse.success(res, 200, [], null, 'Mật khẩu đã được thay đổi thành công');
  });

  /**
   * @desc Update user preferences
   * @route PATCH /api/v1/users/preferences
   * @access Private
   */
  updatePreferences = catchAsync(async (req, res, next) => {
    const { language, theme, notifications, studyReminders } = req.body;

    const updateData = {};
    if (language !== undefined) updateData['preferences.language'] = language;
    if (theme !== undefined) updateData['preferences.theme'] = theme;
    if (notifications !== undefined) updateData['preferences.notifications'] = notifications;
    if (studyReminders !== undefined) updateData['preferences.studyReminders'] = studyReminders;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return ApiResponse.successSingle(res, 200, updatedUser, 'Cập nhật cài đặt thành công');
  });

  /**
   * @desc Upload user avatar
   * @route POST /api/v1/users/avatar
   * @access Private
   */
  uploadAvatar = catchAsync(async (req, res, next) => {
    if (!req.file) {
      return next(new AppError('Không có file được upload', 400));
    }

    // Update user with avatar URL
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    );

    return ApiResponse.successSingle(res, 200, { avatar: avatarUrl }, 'Upload avatar thành công');
  });

  /**
   * @desc Delete user avatar
   * @route DELETE /api/v1/users/avatar
   * @access Private
   */
  deleteAvatar = catchAsync(async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: undefined },
      { new: true }
    );

    return ApiResponse.success(res, 200, [], null, 'Xóa avatar thành công');
  });

  /**
   * @desc Get user statistics
   * @route GET /api/v1/users/stats
   * @access Private
   */
  getUserStats = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    const stats = {
      totalStudyTime: user.learningProfile?.totalStudyTime || 0,
      totalWordsLearned: user.learningProfile?.totalWordsLearned || 0,
      totalLessonsCompleted: user.learningProfile?.totalLessonsCompleted || 0,
      currentStreak: user.learningProfile?.streak || 0,
      longestStreak: user.learningProfile?.bestStreak || 0,
      weeklyProgress: [] // TODO: Implement weekly progress calculation
    };

    return ApiResponse.successSingle(res, 200, stats, 'Lấy thống kê thành công');
  });

  /**
   * @desc Get user activity history
   * @route GET /api/v1/users/activity-history
   * @access Private
   */
  getActivityHistory = catchAsync(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // TODO: Implement activity history from StudySession model
    const activities = [];
    const total = 0;

    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    };

    return ApiResponse.success(res, 200, activities, pagination, 'Lấy lịch sử hoạt động thành công');
  });

  /**
   * @desc Delete user account
   * @route POST /api/v1/users/delete-account
   * @access Private
   */
  deleteAccount = catchAsync(async (req, res, next) => {
    const { password } = req.body;

    if (!password) {
      return next(new AppError('Mật khẩu là bắt buộc để xóa tài khoản', 400));
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check password
    if (!(await user.correctPassword(password, user.password))) {
      return next(new AppError('Mật khẩu không đúng', 401));
    }

    // Soft delete user
    await User.findByIdAndUpdate(req.user.id, { active: false });

    return ApiResponse.success(res, 200, [], null, 'Tài khoản đã được xóa thành công');
  });
}

module.exports = new UserController(); // Export một thể hiện của UserController
