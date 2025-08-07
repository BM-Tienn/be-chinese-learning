const User = require('../models/User'); // Import model User
const catchAsync = require('../utils/catchAsync'); // Tiện ích bắt lỗi bất đồng bộ
const AppError = require('../utils/appError'); // Lớp lỗi tùy chỉnh
const jwt = require('jsonwebtoken'); // Thư viện để tạo và xác minh JWT
const { promisify } = require('util'); // Chuyển đổi hàm callback thành Promise
const crypto = require('crypto'); // Thư viện để hash token
const ApiResponse = require('../utils/apiResponse'); // Import ApiResponse utility
const { SECURITY, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constants');

// Hàm tạo JWT token
const signToken = id => {
  return jwt.sign({ id }, SECURITY.JWT.SECRET, {
    expiresIn: SECURITY.JWT.EXPIRES_IN
  });
};

// Hàm tạo và gửi token cùng với phản hồi người dùng
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id); // Tạo token
  const cookieOptions = {
    expires: new Date(
      Date.now() + SECURITY.JWT.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 // Sử dụng JWT_COOKIE_EXPIRES_IN (đơn vị ngày)
    ),
    httpOnly: true, // Cookie chỉ có thể truy cập bằng HTTP(S) request, không phải client-side JavaScript
    secure: process.env.NODE_ENV === 'production' // Chỉ gửi qua HTTPS trong môi trường production
  };

  res.cookie('default-token-han-ngu-thong', token, cookieOptions); // Đặt cookie JWT

  // Loại bỏ mật khẩu khỏi đầu ra
  user.password = undefined;

  const responseData = {
    token,
    user
  };

  return ApiResponse.successSingle(res, statusCode, responseData, 'Xác thực thành công');
};

class AuthController {
  /**
   * @desc Register a new user
   * @route POST /api/v1/auth/signup
   * @access Public
   */
  signup = catchAsync(async (req, res, next) => {
    // Kiểm tra lại email đã tồn tại chưa (double-check)
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return next(new AppError('Email đã được sử dụng', 400));
    }

    const newUser = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      // role: req.body.role // Không cho phép người dùng tự đặt vai trò khi đăng ký
    });

    createSendToken(newUser, 201, res); // Tạo và gửi token
  });

  /**
   * @desc Log in a user
   * @route POST /api/v1/auth/login
   * @access Public
   */
  login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1) Kiểm tra xem email và mật khẩu có tồn tại không
    if (!email || !password) {
      return next(new AppError(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS, 400));
    }

    // 2) Kiểm tra xem người dùng có tồn tại && mật khẩu có đúng không
    const user = await User.findOne({ email }).select('+password'); // Chọn trường password để so sánh

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS, 401));
    }

    // 3) Nếu mọi thứ đều ổn, gửi token cho client
    createSendToken(user, 200, res);
  });

  /**
   * @desc Log out a user
   * @route GET /api/v1/auth/logout
   * @access Public (but typically used by authenticated users)
   */
  logout = (req, res) => {
    res.cookie('default-token-han-ngu-thong', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000), // Cookie hết hạn sau 10 giây
      httpOnly: true
    });
    return ApiResponse.success(res, 200, [], null, SUCCESS_MESSAGES.AUTH.LOGOUT_SUCCESS);
  };

  /**
   * @desc Refresh access token
   * @route POST /api/v1/auth/refresh-token
   * @access Public
   */
  refreshToken = catchAsync(async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError('Refresh token không được cung cấp', 400));
    }

    try {
      // Verify refresh token
      const decoded = await promisify(jwt.verify)(refreshToken, SECURITY.JWT.REFRESH_SECRET);
      
      // Check if user still exists
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new AppError('Người dùng không tồn tại', 401));
      }

      // Create new access token
      const newAccessToken = signToken(user._id);
      
      const responseData = {
        token: newAccessToken,
        user
      };

      return ApiResponse.successSingle(res, 200, responseData, 'Token đã được làm mới');
    } catch (error) {
      return next(new AppError('Refresh token không hợp lệ', 401));
    }
  });

  /**
   * @desc Forgot password
   * @route POST /api/v1/auth/forgot-password
   * @access Public
   */
  forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Email không được cung cấp', 400));
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError('Không tìm thấy người dùng với email này', 404));
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // TODO: Send email with reset token
    // For now, just return success message
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;

    return ApiResponse.success(res, 200, { resetURL }, null, 'Email khôi phục mật khẩu đã được gửi');
  });

  /**
   * @desc Reset password
   * @route POST /api/v1/auth/reset-password
   * @access Public
   */
  resetPassword = catchAsync(async (req, res, next) => {
    const { token, password, passwordConfirm } = req.body;

    if (!token || !password || !passwordConfirm) {
      return next(new AppError('Token, mật khẩu mới và xác nhận mật khẩu là bắt buộc', 400));
    }

    if (password !== passwordConfirm) {
      return next(new AppError('Mật khẩu xác nhận không khớp', 400));
    }

    // Hash the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user by reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return next(new AppError('Token không hợp lệ hoặc đã hết hạn', 400));
    }

    // Set new password
    user.password = password;
    user.passwordConfirm = passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Log in user
    createSendToken(user, 200, res);
  });

  /**
   * @desc Protect routes (middleware function)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @access Private
   */
  protect = catchAsync(async (req, res, next) => {
    // 1) Get token and check if it's there
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]; // Lấy token từ header Authorization
    } else if (req.cookies['default-token-han-ngu-thong']) {
      token = req.cookies['default-token-han-ngu-thong']; // Lấy token từ cookie
    }

    if (!token) {
      return next(new AppError(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401)); // Trả lỗi 401 nếu không có token
    }

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, SECURITY.JWT.SECRET); // Giải mã token

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id); // Tìm người dùng theo ID từ token
    if (!currentUser) {
      return next(new AppError(ERROR_MESSAGES.AUTH.TOKEN_INVALID, 401)); // Trả lỗi nếu người dùng không tồn tại
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(new AppError(ERROR_MESSAGES.AUTH.TOKEN_EXPIRED, 401)); // Trả lỗi nếu mật khẩu đã thay đổi
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser; // Gán người dùng vào req.user
    res.locals.user = currentUser; // Gán người dùng vào res.locals (cho các template engine nếu có)
    next(); // Chuyển sang middleware/controller tiếp theo
  });

  /**
   * @desc Restrict access to specific roles (middleware function)
   * @param {...string} roles - Allowed roles (e.g., 'admin', 'user')
   * @returns {Function} Express middleware function
   * @access Private
   */
  restrictTo = (...roles) => {
    return (req, res, next) => {
      // 'roles' is an array like ['admin', 'lead-guide']
      if (!roles.includes(req.user.role)) {
        return next(new AppError(ERROR_MESSAGES.AUTH.FORBIDDEN, 403)); // Trả lỗi 403 Forbidden nếu không có quyền
      }
      next(); // Chuyển sang middleware/controller tiếp theo
    };
  };

  /**
   * @desc Check if user is logged in (middleware function, optional protection)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @access Public (does not block access, just sets req.user if logged in)
   */
  isLoggedIn = async (req, res, next) => {
    if (req.cookies['default-token-han-ngu-thong']) {
      try {
        // 1) Verify token
        const decoded = await promisify(jwt.verify)(req.cookies['default-token-han-ngu-thong'], SECURITY.JWT.SECRET);

        // 2) Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
          return next();
        }

        // 3) Check if user changed password after the token was issued
        if (currentUser.changedPasswordAfter(decoded.iat)) {
          return next();
        }

        // THERE IS A LOGGED IN USER
        req.user = currentUser;
        res.locals.user = currentUser;
        return next();
      } catch (err) {
        return next();
      }
    }
    next();
  };
}

module.exports = new AuthController(); // Export một thể hiện của AuthController
