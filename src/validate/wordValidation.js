const { body, param, query } = require('express-validator');
const { 
  handleValidationErrors, 
  validateObjectId, 
  validatePagination,
  sanitizeBasicFields
} = require('./commonValidation');

/**
 * Validation cho tạo word mới
 */
const validateCreateWord = [
  body('chinese')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Ký tự tiếng Trung phải có độ dài từ 1-50 ký tự')
    .matches(/^[\u4e00-\u9fff]+$/)
    .withMessage('Chỉ được chứa ký tự tiếng Trung')
    .escape(),

  body('pinyin')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Pinyin phải có độ dài từ 1-100 ký tự')
    .matches(/^[a-zA-Zāáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜüńňǹḿ]+(\s+[a-zA-Zāáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜüńňǹḿ]+)*$/)
    .withMessage('Pinyin chỉ được chứa chữ cái Latin và dấu thanh')
    .escape(),

  body('definition')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Định nghĩa phải có độ dài từ 1-500 ký tự')
    .escape(),

  body('hskLevel')
    .optional()
    .isInt({ min: 1, max: 6 })
    .withMessage('Cấp độ HSK phải là số từ 1-6'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags phải là một mảng')
    .custom((value) => {
      if (value && value.length > 0) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] !== 'string' || value[i].length > 50) {
            throw new Error('Mỗi tag phải là chuỗi và không quá 50 ký tự');
          }
        }
      }
      return true;
    }),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Ghi chú không được quá 1000 ký tự')
    .escape(),

  handleValidationErrors
];

/**
 * Validation cho cập nhật word
 */
const validateUpdateWord = [
  body('chinese')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Ký tự tiếng Trung phải có độ dài từ 1-50 ký tự')
    .matches(/^[\u4e00-\u9fff]+$/)
    .withMessage('Chỉ được chứa ký tự tiếng Trung')
    .escape(),

  body('pinyin')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Pinyin phải có độ dài từ 1-100 ký tự')
    .matches(/^[a-zA-Zāáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜüńňǹḿ]+(\s+[a-zA-Zāáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜüńňǹḿ]+)*$/)
    .withMessage('Pinyin chỉ được chứa chữ cái Latin và dấu thanh')
    .escape(),

  body('definition')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Định nghĩa phải có độ dài từ 1-500 ký tự')
    .escape(),

  body('hskLevel')
    .optional()
    .isInt({ min: 1, max: 6 })
    .withMessage('Cấp độ HSK phải là số từ 1-6'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags phải là một mảng')
    .custom((value) => {
      if (value && value.length > 0) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] !== 'string' || value[i].length > 50) {
            throw new Error('Mỗi tag phải là chuỗi và không quá 50 ký tự');
          }
        }
      }
      return true;
    }),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Ghi chú không được quá 1000 ký tự')
    .escape(),

  // Không cho phép cập nhật user thông qua API này
  body('user')
    .not()
    .exists()
    .withMessage('Không được phép cập nhật user'),

  handleValidationErrors
];

/**
 * Validation cho bulk operations
 */
const validateBulkWordOperations = [
  body('wordIds')
    .isArray({ min: 1, max: 100 })
    .withMessage('wordIds phải là mảng có từ 1-100 phần tử'),

  body('wordIds.*')
    .isMongoId()
    .withMessage('Mỗi wordId phải là MongoDB ObjectId hợp lệ'),

  body('operation')
    .trim()
    .isIn(['update', 'delete', 'addTags', 'removeTags', 'changeStatus'])
    .withMessage('Operation phải là một trong: update, delete, addTags, removeTags, changeStatus'),

  body('updateData')
    .optional()
    .isObject()
    .withMessage('updateData phải là object'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('tags phải là mảng')
    .custom((value, { req }) => {
      if ((req.body.operation === 'addTags' || req.body.operation === 'removeTags') && !value) {
        throw new Error('tags là bắt buộc khi operation là addTags hoặc removeTags');
      }
      if (value && value.length > 0) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] !== 'string' || value[i].length > 50) {
            throw new Error('Mỗi tag phải là chuỗi và không quá 50 ký tự');
          }
        }
      }
      return true;
    }),

  body('status')
    .optional()
    .trim()
    .isIn(['new', 'learning', 'reviewing', 'mastered', 'archived'])
    .withMessage('status phải là một trong: new, learning, reviewing, mastered, archived')
    .custom((value, { req }) => {
      if (req.body.operation === 'changeStatus' && !value) {
        throw new Error('status là bắt buộc khi operation là changeStatus');
      }
      return true;
    }),

  handleValidationErrors
];

/**
 * Validation cho search words
 */
const validateSearchWords = [
  ...validatePagination,

  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Từ khóa tìm kiếm phải có độ dài từ 1-100 ký tự')
    .escape(),

  query('hskLevel')
    .optional()
    .isInt({ min: 1, max: 6 })
    .withMessage('hskLevel phải là số từ 1-6'),

  query('tags')
    .optional()
    .isArray()
    .withMessage('tags phải là mảng'),

  query('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Mỗi tag phải có độ dài từ 1-50 ký tự')
    .escape(),

  query('status')
    .optional()
    .trim()
    .isIn(['new', 'learning', 'reviewing', 'mastered', 'archived'])
    .withMessage('status phải là một trong: new, learning, reviewing, mastered, archived'),

  query('favorite')
    .optional()
    .isBoolean()
    .withMessage('favorite phải là boolean'),

  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('dateFrom phải là ngày hợp lệ'),

  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('dateTo phải là ngày hợp lệ')
    .custom((value, { req }) => {
      if (req.query.dateFrom && new Date(value) < new Date(req.query.dateFrom)) {
        throw new Error('dateTo phải sau dateFrom');
      }
      return true;
    }),

  handleValidationErrors
];

/**
 * Validation cho word progress
 */
const validateWordProgress = [
  body('isCorrect')
    .isBoolean()
    .withMessage('isCorrect phải là boolean'),

  body('difficulty')
    .optional()
    .trim()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('difficulty phải là một trong: easy, medium, hard'),

  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('timeSpent phải là số nguyên không âm'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('notes không được quá 500 ký tự')
    .escape(),

  handleValidationErrors
];

/**
 * Validation cho practice session
 */
const validatePracticeSession = [
  body('wordIds')
    .isArray({ min: 1, max: 50 })
    .withMessage('wordIds phải là mảng có từ 1-50 phần tử'),

  body('wordIds.*')
    .isMongoId()
    .withMessage('Mỗi wordId phải là MongoDB ObjectId hợp lệ'),

  body('mode')
    .optional()
    .trim()
    .isIn(['chinese-to-pinyin', 'pinyin-to-chinese', 'chinese-to-meaning', 'mixed'])
    .withMessage('mode phải là một trong: chinese-to-pinyin, pinyin-to-chinese, chinese-to-meaning, mixed'),

  body('difficulty')
    .optional()
    .trim()
    .isIn(['easy', 'medium', 'hard', 'mixed'])
    .withMessage('difficulty phải là một trong: easy, medium, hard, mixed'),

  body('timeLimit')
    .optional()
    .isInt({ min: 10, max: 300 })
    .withMessage('timeLimit phải là số từ 10-300 giây'),

  handleValidationErrors
];

/**
 * Validation cho word statistics
 */
const validateWordStats = [
  query('period')
    .optional()
    .trim()
    .isIn(['day', 'week', 'month', 'year', 'all'])
    .withMessage('Period phải là một trong: day, week, month, year, all'),

  query('hskLevel')
    .optional()
    .isInt({ min: 1, max: 6 })
    .withMessage('hskLevel phải là số từ 1-6'),

  query('status')
    .optional()
    .trim()
    .isIn(['new', 'learning', 'reviewing', 'mastered', 'archived'])
    .withMessage('status phải là một trong: new, learning, reviewing, mastered, archived'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate phải là ngày hợp lệ'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate phải là ngày hợp lệ')
    .custom((value, { req }) => {
      if (req.query.startDate && new Date(value) < new Date(req.query.startDate)) {
        throw new Error('endDate phải sau startDate');
      }
      return true;
    }),

  handleValidationErrors
];

/**
 * Validation cho export words
 */
const validateExportWords = [
  query('format')
    .optional()
    .trim()
    .isIn(['json', 'csv', 'txt'])
    .withMessage('format phải là một trong: json, csv, txt'),

  query('includeProgress')
    .optional()
    .isBoolean()
    .withMessage('includeProgress phải là boolean'),

  query('includeNotes')
    .optional()
    .isBoolean()
    .withMessage('includeNotes phải là boolean'),

  handleValidationErrors
];

module.exports = {
  validateCreateWord,
  validateUpdateWord,
  validateBulkWordOperations,
  validateSearchWords,
  validateWordProgress,
  validatePracticeSession,
  validateWordStats,
  validateExportWords,
  validateObjectId,
  validatePagination
}; 