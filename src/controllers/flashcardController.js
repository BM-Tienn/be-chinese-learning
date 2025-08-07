const FlashcardSet = require('../models/FlashcardSet');
const Word = require('../models/Word');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc Get all flashcard sets for the authenticated user
 * @route GET /api/v1/flashcards
 * @access Private
 */
const getUserFlashcardSets = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    FlashcardSet.find({ user: req.user.id }), 
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();
  
  const flashcardSets = await features.query;
  
  // Đếm tổng số flashcard sets của user
  const totalCount = await FlashcardSet.countDocuments({ 
    user: req.user.id,
    ...features.getFilterQuery()
  });

  // Tạo thông tin pagination
  const pagination = ApiResponse.createPagination(req.query, totalCount);

  return ApiResponse.success(res, 200, flashcardSets, pagination, 'Lấy danh sách flashcard sets thành công');
});

/**
 * @desc Get flashcards for study
 * @route GET /api/v1/flashcards/study
 * @access Private
 */
const getFlashcardsForStudy = catchAsync(async (req, res, next) => {
  const { setId, limit = 20 } = req.query;

  if (!setId) {
    return next(new AppError('ID flashcard set là bắt buộc', 400));
  }

  // Kiểm tra flashcard set có tồn tại và thuộc về user không
  const flashcardSet = await FlashcardSet.findOne({
    _id: setId,
    user: req.user.id
  });

  if (!flashcardSet) {
    return next(new AppError('Không tìm thấy flashcard set', 404));
  }

  // Lấy words từ flashcard set
  const words = await Word.find({
    _id: { $in: flashcardSet.words },
    user: req.user.id
  }).limit(parseInt(limit));

  return ApiResponse.success(res, 200, words, null, 'Lấy flashcards để học thành công');
});

/**
 * @desc Get a single flashcard set by ID
 * @route GET /api/v1/flashcards/:setId
 * @access Private
 */
const getFlashcardSet = catchAsync(async (req, res, next) => {
  const flashcardSet = await FlashcardSet.findOne({
    _id: req.params.setId,
    user: req.user.id
  });

  if (!flashcardSet) {
    return next(new AppError('Không tìm thấy flashcard set với ID này', 404));
  }

  return ApiResponse.successSingle(res, 200, flashcardSet, 'Lấy thông tin flashcard set thành công');
});

/**
 * @desc Update progress for a flashcard
 * @route POST /api/v1/flashcards/:setId/progress
 * @access Private
 */
const updateProgress = catchAsync(async (req, res, next) => {
  const { cardId, isCorrect } = req.body;
  const { setId } = req.params;

  if (!cardId || typeof isCorrect !== 'boolean') {
    return next(new AppError('cardId và isCorrect là bắt buộc', 400));
  }

  // Kiểm tra flashcard set có tồn tại và thuộc về user không
  const flashcardSet = await FlashcardSet.findOne({
    _id: setId,
    user: req.user.id
  });

  if (!flashcardSet) {
    return next(new AppError('Không tìm thấy flashcard set', 404));
  }

  // Cập nhật tiến độ của word
  const updatedWord = await Word.findOneAndUpdate(
    {
      _id: cardId,
      user: req.user.id
    },
    {
      $inc: {
        correctCount: isCorrect ? 1 : 0,
        incorrectCount: isCorrect ? 0 : 1,
        totalAttempts: 1
      },
      $set: {
        lastStudied: new Date()
      }
    },
    { new: true }
  );

  if (!updatedWord) {
    return next(new AppError('Không tìm thấy word với ID này', 404));
  }

  return ApiResponse.successSingle(res, 200, updatedWord, 'Cập nhật tiến độ thành công');
});

module.exports = {
  getUserFlashcardSets,
  getFlashcardsForStudy,
  getFlashcardSet,
  updateProgress
}; 