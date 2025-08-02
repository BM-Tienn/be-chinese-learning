const Vocabulary = require('../models/Vocabulary'); // Import model Vocabulary
const catchAsync = require('../utils/catchAsync'); // Tiện ích bắt lỗi bất đồng bộ
const AppError = require('../utils/appError'); // Lớp lỗi tùy chỉnh
const APIFeatures = require('../utils/apiFeatures'); // Tiện ích cho các tính năng API
const ApiResponse = require('../utils/apiResponse'); // Import ApiResponse utility
const cedictService = require('../services/cedictService'); // Import CedictService
const logger = require('../utils/logger'); // Import Logger utility
const { uploadRateLimitStore } = require('../middlewares/security'); // Import uploadRateLimitStore

class VocabularyController {
  /**
   * @desc Get all curated vocabulary words (application's dictionary)
   * @route GET /api/v1/vocabularies
   * @access Public
   */
  getAllVocabularies = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Vocabulary.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    
    const vocabularies = await features.query; // Thực thi truy vấn
    
    // Đếm tổng số documents để tính pagination
    const totalCount = await Vocabulary.countDocuments(features.getFilterQuery());

    // Tạo thông tin pagination
    const pagination = ApiResponse.createPagination(req.query, totalCount);

    return ApiResponse.success(res, 200, vocabularies, pagination, 'Lấy danh sách từ vựng thành công');
  });

  /**
   * @desc Get a single curated vocabulary word by ID
   * @route GET /api/v1/vocabularies/:id
   * @access Public
   */
  getVocabulary = catchAsync(async (req, res, next) => {
    const vocabulary = await Vocabulary.findById(req.params.id);

    if (!vocabulary) {
      return next(new AppError('No vocabulary word found with that ID', 404)); // Xử lý nếu không tìm thấy từ
    }

    return ApiResponse.successSingle(res, 200, vocabulary, 'Lấy thông tin từ vựng thành công');
  });

  /**
   * @desc Admin-only: Create a new curated vocabulary word
   * @route POST /api/v1/vocabularies
   * @access Private (Admin only)
   */
  createVocabulary = catchAsync(async (req, res, next) => {
    const newVocabulary = await Vocabulary.create(req.body); // Tạo từ vựng mới

    return ApiResponse.successSingle(res, 201, newVocabulary, 'Tạo từ vựng mới thành công');
  });

  /**
   * @desc Admin-only: Update a curated vocabulary word
   * @route PATCH /api/v1/vocabularies/:id
   * @access Private (Admin only)
   */
  updateVocabulary = catchAsync(async (req, res, next) => {
    const updatedVocabulary = await Vocabulary.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updatedVocabulary) {
      return next(new AppError('No vocabulary word found with that ID', 404));
    }

    return ApiResponse.successSingle(res, 200, updatedVocabulary, 'Cập nhật từ vựng thành công');
  });

  /**
   * @desc Admin-only: Delete a curated vocabulary word
   * @route DELETE /api/v1/vocabularies/:id
   * @access Private (Admin only)
   */
  deleteVocabulary = catchAsync(async (req, res, next) => {
    const deletedVocabulary = await Vocabulary.findByIdAndDelete(req.params.id);

    if (!deletedVocabulary) {
      return next(new AppError('No vocabulary word found with that ID', 404));
    }

    return ApiResponse.success(res, 204, [], null, 'Xóa từ vựng thành công');
  });

  /**
   * @desc Admin-only: Upload CC-CEDICT JSON file to vocabulary database
   * @route POST /api/v1/vocabularies/upload-cedict
   * @access Private (Admin only)
   */
  uploadCedictJson = catchAsync(async (req, res, next) => {
    console.log('=== UPLOAD CEDICT CONTROLLER STARTED ===');
    console.log('Thời gian bắt đầu:', new Date().toISOString());
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('Request headers:', req.headers);
    
    const startTime = Date.now();
    uploadRateLimitStore.clear();
    
    // Kiểm tra file upload
    if (!req.file) {
      await logger.logError(req, new Error('File JSON không được cung cấp'), {
        action: 'UPLOAD_CC_CEDICT',
        error: 'NO_FILE_PROVIDED'
      });
      return next(new AppError('File JSON không được cung cấp', 400));
    }

    try {
      // Log bắt đầu upload
      await logger.logActivity(req, 'CC_CEDICT_UPLOAD_START', {
        file: {
          name: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      });

      // Sử dụng service để xử lý upload từ file object
      const results = await cedictService.uploadCedictFileFromUpload(req.file);

      const duration = Date.now() - startTime;
      
      // Log kết quả upload chi tiết
      await logger.logCedictUpload(req, req.file, results);

      // Log performance
      await logger.logPerformance(req, 'CC_CEDICT_UPLOAD', duration, {
        totalItems: results.total,
        successRate: `${((results.success / results.total) * 100).toFixed(2)}%`
      });

      // Tạo thông báo tổng kết
      const summary = `Upload hoàn tất: ${results.success} thành công, ${results.failed} thất bại, ${results.skipped} bỏ qua`;

      console.log('=== UPLOAD CEDICT CONTROLLER SUCCESS ===');
      console.log('Thời gian hoàn thành:', new Date().toISOString());
      console.log('Kết quả:', results);
      console.log('Thời gian xử lý:', `${duration}ms`);
      console.log('=========================================');
      
      return ApiResponse.success(res, 200, {
        summary,
        details: results
      }, null, summary);

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log lỗi upload
      await logger.logError(req, error, {
        action: 'CC_CEDICT_UPLOAD',
        duration: `${duration}ms`,
        file: {
          name: req.file?.originalname,
          size: req.file?.size
        }
      });
      
      console.log('=== UPLOAD CEDICT CONTROLLER ERROR ===');
      console.log('Thời gian lỗi:', new Date().toISOString());
      console.log('Lỗi:', error.message);
      console.log('Stack trace:', error.stack);
      console.log('Thời gian xử lý:', `${duration}ms`);
      console.log('=======================================');
      
      return next(new AppError(error.message, 500));
    }
  });
}

module.exports = new VocabularyController(); // Export một thể hiện của VocabularyController
