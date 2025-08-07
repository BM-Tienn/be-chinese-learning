const { body, param, query, validationResult } = require('express-validator');
const AppError = require('../utils/appError');

/**
 * Middleware để xử lý kết quả validation
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return next(new AppError(`Validation failed: ${errorMessages.join(', ')}`, 400));
  }
  next();
};

/**
 * Sanitize và validate các trường cơ bản
 */
const sanitizeBasicFields = [
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

  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Mật khẩu phải có ít nhất 8 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt'),

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

  body('vietnameseReading')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Cách đọc Hán Việt không được quá 200 ký tự')
    .matches(/^[a-zA-Zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]+$/)
    .withMessage('Cách đọc Hán Việt chỉ được chứa chữ cái và dấu tiếng Việt')
    .escape(),

  body('meaning.primary')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Nghĩa chính phải có độ dài từ 1-500 ký tự')
    .escape(),

  body('meaning.secondary')
    .optional()
    .isArray()
    .withMessage('Nghĩa phụ phải là một mảng')
    .custom((value) => {
      if (value && value.length > 0) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] !== 'string' || value[i].length > 200) {
            throw new Error('Mỗi nghĩa phụ phải là chuỗi và không quá 200 ký tự');
          }
        }
      }
      return true;
    }),

  body('meaning.partOfSpeech')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Từ loại không được quá 50 ký tự')
    .escape(),

  body('grammar.level')
    .optional()
    .trim()
    .isIn(['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Literary', 'Technical', 'Informal'])
    .withMessage('Cấp độ ngữ pháp không hợp lệ'),

  body('grammar.frequency')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Tần suất sử dụng phải là số nguyên từ 0-100'),

  body('grammar.formality')
    .optional()
    .trim()
    .isIn(['neutral', 'formal', 'informal', 'literary'])
    .withMessage('Mức độ trang trọng không hợp lệ'),

  body('hskLevel')
    .optional()
    .isInt({ min: 1, max: 6 })
    .withMessage('Cấp độ HSK phải là số từ 1-6'),

  body('category')
    .optional()
    .trim()
    .isIn(['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6', 'Common', 'Idiom', 'Proverb', 'Advanced', 'Other', 'Place Name', 'Person Name', 'Technical', 'Literary', 'Informal'])
    .withMessage('Danh mục không hợp lệ'),

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
    .escape()
];

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('ID không hợp lệ'),
  handleValidationErrors
];

/**
 * Validate pagination parameters
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Số trang phải là số nguyên dương'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Giới hạn phải là số từ 1-100'),

  query('sort')
    .optional()
    .trim()
    .matches(/^[a-zA-Z_]+(-[a-zA-Z_]+)*$/)
    .withMessage('Tham số sắp xếp không hợp lệ'),

  query('fields')
    .optional()
    .trim()
    .matches(/^[a-zA-Z_,]+$/)
    .withMessage('Tham số fields không hợp lệ'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Từ khóa tìm kiếm phải có độ dài từ 1-100 ký tự')
    .escape(),

  handleValidationErrors
];

/**
 * Validate file upload
 */
const validateFileUpload = [
  body('filePath')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Đường dẫn file phải có độ dài từ 1-500 ký tự')
    .matches(/^[a-zA-Z0-9\/\.\-_]+$/)
    .withMessage('Đường dẫn file không hợp lệ')
    .escape(),
  handleValidationErrors
];

/**
 * Sanitize và validate examples array
 */
const validateExamples = [
  body('examples')
    .optional()
    .isArray()
    .withMessage('Examples phải là một mảng')
    .custom((value) => {
      if (value && value.length > 0) {
        for (let i = 0; i < value.length; i++) {
          const example = value[i];
          if (typeof example !== 'object') {
            throw new Error('Mỗi example phải là một object');
          }
          
          if (example.chinese && (typeof example.chinese !== 'string' || example.chinese.length > 200)) {
            throw new Error('Chinese trong example phải là chuỗi và không quá 200 ký tự');
          }
          
          if (example.pinyin && (typeof example.pinyin !== 'string' || example.pinyin.length > 200)) {
            throw new Error('Pinyin trong example phải là chuỗi và không quá 200 ký tự');
          }
          
          if (example.vietnamese && (typeof example.vietnamese !== 'string' || example.vietnamese.length > 500)) {
            throw new Error('Vietnamese trong example phải là chuỗi và không quá 500 ký tự');
          }
        }
      }
      return true;
    }),
  handleValidationErrors
];

/**
 * Sanitize và validate related words
 */
const validateRelated = [
  body('related.synonyms')
    .optional()
    .isArray()
    .withMessage('Synonyms phải là một mảng')
    .custom((value) => {
      if (value && value.length > 0) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] !== 'string' || value[i].length > 100) {
            throw new Error('Mỗi synonym phải là chuỗi và không quá 100 ký tự');
          }
        }
      }
      return true;
    }),

  body('related.antonyms')
    .optional()
    .isArray()
    .withMessage('Antonyms phải là một mảng')
    .custom((value) => {
      if (value && value.length > 0) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] !== 'string' || value[i].length > 100) {
            throw new Error('Mỗi antonym phải là chuỗi và không quá 100 ký tự');
          }
        }
      }
      return true;
    }),

  body('related.compounds')
    .optional()
    .isArray()
    .withMessage('Compounds phải là một mảng')
    .custom((value) => {
      if (value && value.length > 0) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] !== 'string' || value[i].length > 100) {
            throw new Error('Mỗi compound phải là chuỗi và không quá 100 ký tự');
          }
        }
      }
      return true;
    }),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  sanitizeBasicFields,
  validateObjectId,
  validatePagination,
  validateFileUpload,
  validateExamples,
  validateRelated
}; 