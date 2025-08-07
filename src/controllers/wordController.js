const Word = require('../models/Word'); // Import model Word
const catchAsync = require('../utils/catchAsync'); // Tiện ích bắt lỗi bất đồng bộ
const AppError = require('../utils/appError'); // Lớp lỗi tùy chỉnh
const APIFeatures = require('../utils/apiFeatures'); // Tiện ích cho các tính năng API
const ApiResponse = require('../utils/apiResponse'); // Import ApiResponse utility

class WordController {
  /**
   * @desc Get all words for the authenticated user
   * @route GET /api/v1/words
   * @access Private
   */
  getAllWords = catchAsync(async (req, res, next) => {
    // Lọc từ vựng theo ID người dùng từ token đã xác thực
    const filter = { user: req.user.id };

    // Áp dụng các tính năng API như lọc, sắp xếp, giới hạn trường, phân trang
    const features = new APIFeatures(Word.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const words = await features.query; // Thực thi truy vấn

    // Đếm tổng số documents để tính pagination
    const totalCount = await Word.countDocuments({ ...filter, ...features.getFilterQuery() });

    // Tạo thông tin pagination
    const pagination = ApiResponse.createPagination(req.query, totalCount);

    return ApiResponse.success(res, 200, words, pagination, 'Lấy danh sách từ vựng cá nhân thành công');
  });

  /**
   * @desc Get a single word by ID for the authenticated user
   * @route GET /api/v1/words/:id
   * @access Private
   */
  getWord = catchAsync(async (req, res, next) => {
    // Tìm từ vựng theo ID và đảm bảo nó thuộc về người dùng hiện tại
    const word = await Word.findOne({ _id: req.params.id, user: req.user.id });

    if (!word) {
      return next(new AppError('No word found with that ID for this user', 404)); // Xử lý nếu không tìm thấy từ hoặc không thuộc về người dùng
    }

    return ApiResponse.successSingle(res, 200, word, 'Lấy thông tin từ vựng thành công');
  });

  /**
   * @desc Create a new word for the authenticated user
   * @route POST /api/v1/words
   * @access Private
   */
  createWord = catchAsync(async (req, res, next) => {
    // Gán ID người dùng từ token đã xác thực vào trường 'user' của từ vựng
    req.body.user = req.user.id;
    
    // Handle legacy 'definition' field and convert to 'meaning.primary'
    if (req.body.definition && !req.body.meaning) {
      req.body.meaning = {
        primary: req.body.definition
      };
      delete req.body.definition;
    }
    
    const newWord = await Word.create(req.body); // Tạo từ vựng mới

    return ApiResponse.successSingle(res, 201, newWord, 'Tạo từ vựng mới thành công');
  });

  /**
   * @desc Update a word for the authenticated user
   * @route PATCH /api/v1/words/:id
   * @access Private
   */
  updateWord = catchAsync(async (req, res, next) => {
    // Filter out the user field to prevent unauthorized changes
    const filteredBody = { ...req.body };
    delete filteredBody.user;

    // Handle legacy 'definition' field and convert to 'meaning.primary'
    if (filteredBody.definition && !filteredBody.meaning) {
      filteredBody.meaning = {
        primary: filteredBody.definition
      };
      delete filteredBody.definition;
    }

    const updatedWord = await Word.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      filteredBody,
      {
        new: true, // Trả về tài liệu đã cập nhật
        runValidators: true // Chạy các validator schema
      }
    );

    if (!updatedWord) {
      return next(new AppError('No word found with that ID for this user', 404)); // Xử lý nếu không tìm thấy từ hoặc không thuộc về người dùng
    }

    return ApiResponse.successSingle(res, 200, updatedWord, 'Cập nhật từ vựng thành công');
  });

  /**
   * @desc Delete a word for the authenticated user
   * @route DELETE /api/v1/words/:id
   * @access Private
   */
  deleteWord = catchAsync(async (req, res, next) => {
    const deletedWord = await Word.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!deletedWord) {
      return next(new AppError('No word found with that ID for this user', 404)); // Xử lý nếu không tìm thấy từ hoặc không thuộc về người dùng
    }

    return ApiResponse.success(res, 204, [], null, 'Xóa từ vựng thành công');
  });
}

module.exports = new WordController();
