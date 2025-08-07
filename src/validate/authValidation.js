const { body } = require('express-validator');
const { handleValidationErrors } = require('./commonValidation');

/**
 * Validation cho đăng ký
 */
const validateSignup = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 40 })
    .withMessage('Họ tên phải có độ dài từ 3-40 ký tự')
    .matches(/^[a-zA-ZÀ-ỹ\s0-9_]+$/)
    .withMessage('Họ tên chỉ được chứa chữ cái, số, dấu cách và dấu gạch dưới')
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

  handleValidationErrors
];

/**
 * Validation cho đăng nhập
 */
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Mật khẩu không được để trống'),

  handleValidationErrors
];

/**
 * Validation cho đổi mật khẩu
 */
const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Mật khẩu hiện tại không được để trống'),

  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Mật khẩu mới phải có ít nhất 8 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt'),

  body('newPasswordConfirm')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Mật khẩu xác nhận không khớp');
      }
      return true;
    }),

  handleValidationErrors
];

/**
 * Validation cho quên mật khẩu
 */
const validateForgotPassword = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),

  handleValidationErrors
];

/**
 * Validation cho reset mật khẩu
 */
const validateResetPassword = [
  body('token')
    .notEmpty()
    .withMessage('Token không được để trống')
    .isLength({ min: 10, max: 500 })
    .withMessage('Token không hợp lệ'),

  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Mật khẩu mới phải có ít nhất 8 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt'),

  body('newPasswordConfirm')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Mật khẩu xác nhận không khớp');
      }
      return true;
    }),

  handleValidationErrors
];

module.exports = {
  validateSignup,
  validateLogin,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword
}; 