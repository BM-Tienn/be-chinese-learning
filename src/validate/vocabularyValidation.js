const { body, param, query } = require('express-validator');
const { 
  handleValidationErrors, 
  validateObjectId, 
  validatePagination,
  sanitizeBasicFields,
  validateExamples,
  validateRelated,
  validateFileUpload
} = require('./commonValidation');

/**
 * Validation cho tạo vocabulary mới
 */
const validateCreateVocabulary = [
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

  body('vietnameseReading')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Cách đọc Hán Việt không được quá 200 ký tự')
    .matches(/^[a-zA-Zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]+$/)
    .withMessage('Cách đọc Hán Việt chỉ được chứa chữ cái và dấu tiếng Việt')
    .escape(),

  body('meaning.primary')
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

  ...validateExamples,
  ...validateRelated,
  handleValidationErrors
];

/**
 * Validation cho cập nhật vocabulary
 */
const validateUpdateVocabulary = [
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

  ...sanitizeBasicFields,
  ...validateExamples,
  ...validateRelated,
  handleValidationErrors
];

/**
 * Validation cho bulk operations
 */
const validateBulkVocabularyOperations = [
  body('vocabularyIds')
    .isArray({ min: 1, max: 100 })
    .withMessage('vocabularyIds phải là mảng có từ 1-100 phần tử'),

  body('vocabularyIds.*')
    .isMongoId()
    .withMessage('Mỗi vocabularyId phải là MongoDB ObjectId hợp lệ'),

  body('operation')
    .trim()
    .isIn(['update', 'delete', 'changeCategory', 'changeLevel'])
    .withMessage('Operation phải là một trong: update, delete, changeCategory, changeLevel'),

  body('updateData')
    .optional()
    .isObject()
    .withMessage('updateData phải là object'),

  body('newCategory')
    .optional()
    .trim()
    .isIn(['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6', 'Common', 'Idiom', 'Proverb', 'Advanced', 'Other', 'Place Name', 'Person Name', 'Technical', 'Literary', 'Informal'])
    .withMessage('newCategory không hợp lệ')
    .custom((value, { req }) => {
      if (req.body.operation === 'changeCategory' && !value) {
        throw new Error('newCategory là bắt buộc khi operation là changeCategory');
      }
      return true;
    }),

  body('newLevel')
    .optional()
    .isInt({ min: 1, max: 6 })
    .withMessage('newLevel phải là số từ 1-6')
    .custom((value, { req }) => {
      if (req.body.operation === 'changeLevel' && !value) {
        throw new Error('newLevel là bắt buộc khi operation là changeLevel');
      }
      return true;
    }),

  handleValidationErrors
];

/**
 * Validation cho search vocabularies
 */
const validateSearchVocabularies = [
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

  query('category')
    .optional()
    .trim()
    .isIn(['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6', 'Common', 'Idiom', 'Proverb', 'Advanced', 'Other', 'Place Name', 'Person Name', 'Technical', 'Literary', 'Informal'])
    .withMessage('category không hợp lệ'),

  query('grammarLevel')
    .optional()
    .trim()
    .isIn(['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Literary', 'Technical', 'Informal'])
    .withMessage('grammarLevel không hợp lệ'),

  query('formality')
    .optional()
    .trim()
    .isIn(['neutral', 'formal', 'informal', 'literary'])
    .withMessage('formality không hợp lệ'),

  query('minFrequency')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('minFrequency phải là số từ 0-100'),

  query('maxFrequency')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('maxFrequency phải là số từ 0-100')
    .custom((value, { req }) => {
      if (req.query.minFrequency && parseInt(value) < parseInt(req.query.minFrequency)) {
        throw new Error('maxFrequency phải lớn hơn hoặc bằng minFrequency');
      }
      return true;
    }),

  handleValidationErrors
];

/**
 * Validation cho vocabulary statistics
 */
const validateVocabularyStats = [
  query('period')
    .optional()
    .trim()
    .isIn(['day', 'week', 'month', 'year', 'all'])
    .withMessage('Period phải là một trong: day, week, month, year, all'),

  query('category')
    .optional()
    .trim()
    .isIn(['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6', 'Common', 'Idiom', 'Proverb', 'Advanced', 'Other', 'Place Name', 'Person Name', 'Technical', 'Literary', 'Informal'])
    .withMessage('category không hợp lệ'),

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
 * Validation cho random vocabularies
 */
const validateRandomVocabularies = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('limit phải là số từ 1-50'),

  query('level')
    .optional()
    .isInt({ min: 1, max: 6 })
    .withMessage('level phải là số từ 1-6'),

  query('category')
    .optional()
    .trim()
    .isIn(['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6', 'Common', 'Idiom', 'Proverb', 'Advanced', 'Other', 'Place Name', 'Person Name', 'Technical', 'Literary', 'Informal'])
    .withMessage('category không hợp lệ'),

  query('excludeIds')
    .optional()
    .isArray()
    .withMessage('excludeIds phải là mảng'),

  query('excludeIds.*')
    .optional()
    .isMongoId()
    .withMessage('Mỗi excludeId phải là MongoDB ObjectId hợp lệ'),

  handleValidationErrors
];

module.exports = {
  validateCreateVocabulary,
  validateUpdateVocabulary,
  validateBulkVocabularyOperations,
  validateSearchVocabularies,
  validateVocabularyStats,
  validateRandomVocabularies,
  validateObjectId,
  validatePagination,
  validateFileUpload
}; 