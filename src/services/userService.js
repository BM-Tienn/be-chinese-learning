const User = require('../models/User');
const AppError = require('../utils/appError');
const ApiFeatures = require('../utils/apiFeatures');

class UserService {
  // Create a new user
  async createUser(userData) {
    const { username, email, password } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      throw new AppError('Email hoặc tên người dùng đã tồn tại', 400);
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password
    });

    // Remove password from response
    user.password = undefined;

    return user;
  }

  // Login user
  async loginUser(email, password) {
    // Check if email and password exist
    if (!email || !password) {
      throw new AppError('Vui lòng cung cấp email và mật khẩu', 400);
    }

    // Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Tài khoản đã bị khóa', 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = user.generateAuthToken();

    // Remove password from response
    user.password = undefined;

    return { user, token };
  }

  // Update user
  async updateUser(userId, updateData) {
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }

    return user;
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }

    // Check current password
    if (!(await user.correctPassword(currentPassword, user.password))) {
      throw new AppError('Mật khẩu hiện tại không đúng', 401);
    }

    // Update password
    user.password = newPassword;
    user.passwordChangedAt = Date.now() - 1000;
    await user.save();

    return true;
  }

  // Get all users with filtering, sorting, and pagination
  async getAllUsers(queryString) {
    const features = new ApiFeatures(User.find(), queryString)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const users = await features.query.select('-password');
    const total = await User.countDocuments(features.filterQuery);

    return {
      data: users,
      pagination: {
        page: features.page,
        limit: features.limit,
        total,
        pages: Math.ceil(total / features.limit)
      }
    };
  }

  // Get user by ID
  async getUserById(userId) {
    const user = await User.findById(userId).select('-password');

    if (!user) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }

    return user;
  }

  // Delete user
  async deleteUser(userId) {
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }

    return true;
  }

  // Create password reset token
  async createPasswordResetToken(email) {
    const user = await User.findOne({ email });

    if (!user) {
      throw new AppError('Không tìm thấy người dùng với email này', 404);
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    return resetToken;
  }

  // Reset password
  async resetPassword(token, newPassword) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new AppError('Token không hợp lệ hoặc đã hết hạn', 400);
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = Date.now() - 1000;

    await user.save();

    return true;
  }

  // Create email verification token
  async createEmailVerificationToken(email) {
    const user = await User.findOne({ email });

    if (!user) {
      throw new AppError('Không tìm thấy người dùng với email này', 404);
    }

    if (user.emailVerified) {
      throw new AppError('Email đã được xác thực', 400);
    }

    const verificationToken = user.createEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    return verificationToken;
  }

  // Verify email
  async verifyEmail(token) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new AppError('Token không hợp lệ hoặc đã hết hạn', 400);
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    return true;
  }

  // Update user statistics
  async updateUserStats(userId, statsData) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }

    // Update statistics
    Object.assign(user.statistics, statsData);
    await user.save();

    return user.statistics;
  }

  // Get user statistics
  async getUserStats(userId) {
    const user = await User.findById(userId).select('statistics');

    if (!user) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }

    return user.statistics;
  }

  // Update user preferences
  async updateUserPreferences(userId, preferences) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }

    // Update preferences
    Object.assign(user.preferences, preferences);
    await user.save();

    return user.preferences;
  }

  // Get user preferences
  async getUserPreferences(userId) {
    const user = await User.findById(userId).select('preferences');

    if (!user) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }

    return user.preferences;
  }

  // Deactivate user
  async deactivateUser(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }

    return user;
  }

  // Reactivate user
  async reactivateUser(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true }
    );

    if (!user) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }

    return user;
  }
}

module.exports = new UserService(); 