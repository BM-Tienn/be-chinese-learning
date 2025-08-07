const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { handleValidationErrors } = require('./commonValidation');

// Validation cho tạo cấu hình mới
const validateCreateConfiguration = [
  body('type')
    .isIn(['filter', 'topic', 'wordType', 'level', 'category'])
    .withMessage('Type phải là một trong các giá trị: filter, topic, wordType, level, category'),
  
  body('key')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Key phải có độ dài từ 1 đến 50 ký tự')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Key chỉ được chứa chữ cái, số, dấu gạch dưới và dấu gạch ngang'),
  
  body('label')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Label phải có độ dài từ 1 đến 100 ký tự'),
  
  body('count')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Count phải là số nguyên không âm'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive phải là boolean'),
  
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order phải là số nguyên không âm'),
  
  body('metadata.color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color phải là mã màu hex hợp lệ (ví dụ: #FF0000)'),
  
  body('metadata.icon')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Icon không được quá 50 ký tự'),
  
  body('metadata.description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description không được quá 500 ký tự'),
  
  body('metadata.parentKey')
    .optional()
    .isLength({ max: 50 })
    .withMessage('ParentKey không được quá 50 ký tự'),
  
  body('metadata.level')
    .optional()
    .isInt({ min: 1, max: 6 })
    .withMessage('Level phải là số nguyên từ 1 đến 6'),
  
  body('metadata.difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty phải là một trong các giá trị: easy, medium, hard'),
  
  body('metadata.category')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Category không được quá 50 ký tự'),
  
  handleValidationErrors
];

// Validation cho cập nhật cấu hình
const validateUpdateConfiguration = [
  body('type')
    .optional()
    .isIn(['filter', 'topic', 'wordType', 'level', 'category'])
    .withMessage('Type phải là một trong các giá trị: filter, topic, wordType, level, category'),
  
  body('key')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Key phải có độ dài từ 1 đến 50 ký tự')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Key chỉ được chứa chữ cái, số, dấu gạch dưới và dấu gạch ngang'),
  
  body('label')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Label phải có độ dài từ 1 đến 100 ký tự'),
  
  body('count')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Count phải là số nguyên không âm'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive phải là boolean'),
  
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order phải là số nguyên không âm'),
  
  body('metadata.color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color phải là mã màu hex hợp lệ (ví dụ: #FF0000)'),
  
  body('metadata.icon')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Icon không được quá 50 ký tự'),
  
  body('metadata.description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description không được quá 500 ký tự'),
  
  body('metadata.parentKey')
    .optional()
    .isLength({ max: 50 })
    .withMessage('ParentKey không được quá 50 ký tự'),
  
  body('metadata.level')
    .optional()
    .isInt({ min: 1, max: 6 })
    .withMessage('Level phải là số nguyên từ 1 đến 6'),
  
  body('metadata.difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty phải là một trong các giá trị: easy, medium, hard'),
  
  body('metadata.category')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Category không được quá 50 ký tự'),
  
  handleValidationErrors
];

// Validation cho ObjectId
const validateObjectId = [
  param('id')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('ID không hợp lệ');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Validation cho bulk update
const validateBulkUpdate = [
  body('configurations')
    .isArray({ min: 1 })
    .withMessage('Configurations phải là một mảng và không được rỗng'),
  
  body('configurations.*.type')
    .optional()
    .isIn(['filter', 'topic', 'wordType', 'level', 'category'])
    .withMessage('Type phải là một trong các giá trị: filter, topic, wordType, level, category'),
  
  body('configurations.*.key')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Key phải có độ dài từ 1 đến 50 ký tự')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Key chỉ được chứa chữ cái, số, dấu gạch dưới và dấu gạch ngang'),
  
  body('configurations.*.label')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Label phải có độ dài từ 1 đến 100 ký tự'),
  
  body('configurations.*.count')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Count phải là số nguyên không âm'),
  
  body('configurations.*.isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive phải là boolean'),
  
  body('configurations.*.order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order phải là số nguyên không âm'),
  
  handleValidationErrors
];

// Validation cho type parameter
const validateTypeParameter = [
  param('type')
    .isIn(['filter', 'topic', 'wordType', 'level', 'category'])
    .withMessage('Type phải là một trong các giá trị: filter, topic, wordType, level, category'),
  
  handleValidationErrors
];

module.exports = {
  validateCreateConfiguration,
  validateUpdateConfiguration,
  validateObjectId,
  validateBulkUpdate,
  validateTypeParameter
}; 