const { body, param } = require('express-validator');
const { handleValidationErrors, validateObjectId, validatePagination } = require('./commonValidation');

/**
 * Validation cho cập nhật thông tin user
 */
const validateUpdateUser = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 40 })
    .withMessage('Username phải có độ dài từ 3-40 ký tự')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username chỉ được chứa chữ cái, số và dấu gạch dưới')
    .escape(),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),

  // Không cho phép cập nhật role thông qua API này
  body('role')
    .not()
    .exists()
    .withMessage('Không được phép cập nhật role'),

  // Không cho phép cập nhật password thông qua API này
  body('password')
    .not()
    .exists()
    .withMessage('Không được phép cập nhật password qua API này'),

  body('passwordConfirm')
    .not()
    .exists()
    .withMessage('Không được phép cập nhật passwordConfirm qua API này'),

  handleValidationErrors
];

/**
 * Validation cho cập nhật role (admin only)
 */
const validateUpdateUserRole = [
  body('role')
    .trim()
    .isIn(['user', 'admin'])
    .withMessage('Role phải là "user" hoặc "admin"'),

  handleValidationErrors
];

/**
 * Validation cho tạo user mới (admin only)
 */
const validateCreateUser = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 40 })
    .withMessage('Username phải có độ dài từ 3-40 ký tự')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username chỉ được chứa chữ cái, số và dấu gạch dưới')
    .escape(),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Mật khẩu phải có ít nhất 8 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt'),

  body('passwordConfirm')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Mật khẩu xác nhận không khớp');
      }
      return true;
    }),

  body('role')
    .optional()
    .trim()
    .isIn(['user', 'admin'])
    .withMessage('Role phải là "user" hoặc "admin"'),

  handleValidationErrors
];

/**
 * Validation cho bulk operations
 */
const validateBulkUserOperations = [
  body('userIds')
    .isArray({ min: 1, max: 100 })
    .withMessage('userIds phải là mảng có từ 1-100 phần tử'),

  body('userIds.*')
    .isMongoId()
    .withMessage('Mỗi userId phải là MongoDB ObjectId hợp lệ'),

  body('operation')
    .trim()
    .isIn(['activate', 'deactivate', 'delete', 'changeRole'])
    .withMessage('Operation phải là một trong: activate, deactivate, delete, changeRole'),

  body('newRole')
    .optional()
    .trim()
    .isIn(['user', 'admin'])
    .withMessage('newRole phải là "user" hoặc "admin"')
    .custom((value, { req }) => {
      if (req.body.operation === 'changeRole' && !value) {
        throw new Error('newRole là bắt buộc khi operation là changeRole');
      }
      return true;
    }),

  handleValidationErrors
];

/**
 * Validation cho search users
 */
const validateSearchUsers = [
  ...validatePagination,

  body('searchTerm')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Từ khóa tìm kiếm phải có độ dài từ 1-100 ký tự')
    .escape(),

  body('role')
    .optional()
    .trim()
    .isIn(['user', 'admin'])
    .withMessage('Role phải là "user" hoặc "admin"'),

  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active phải là boolean'),

  body('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('dateFrom phải là ngày hợp lệ'),

  body('dateTo')
    .optional()
    .isISO8601()
    .withMessage('dateTo phải là ngày hợp lệ')
    .custom((value, { req }) => {
      if (req.body.dateFrom && new Date(value) < new Date(req.body.dateFrom)) {
        throw new Error('dateTo phải sau dateFrom');
      }
      return true;
    }),

  handleValidationErrors
];

/**
 * Validation cho user statistics
 */
const validateUserStats = [
  param('userId')
    .isMongoId()
    .withMessage('userId phải là MongoDB ObjectId hợp lệ'),

  body('period')
    .optional()
    .trim()
    .isIn(['day', 'week', 'month', 'year', 'all'])
    .withMessage('Period phải là một trong: day, week, month, year, all'),

  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate phải là ngày hợp lệ'),

  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate phải là ngày hợp lệ')
    .custom((value, { req }) => {
      if (req.body.startDate && new Date(value) < new Date(req.body.startDate)) {
        throw new Error('endDate phải sau startDate');
      }
      return true;
    }),

  handleValidationErrors
];

module.exports = {
  validateUpdateUser,
  validateUpdateUserRole,
  validateCreateUser,
  validateBulkUserOperations,
  validateSearchUsers,
  validateUserStats,
  validateObjectId,
  validatePagination
}; 