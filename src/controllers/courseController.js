const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc Get all courses
 * @route GET /api/v1/courses
 * @access Private
 */
const getAllCourses = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Course.find(), req.query)
    .filter()
    .search()
    .sort()
    .limitFields()
    .paginate();
  
  const courses = await features.query;
  
  // Đếm tổng số documents để tính pagination
  const totalCount = await Course.countDocuments(features.getFilterQuery());

  // Tạo thông tin pagination
  const pagination = ApiResponse.createPagination(req.query, totalCount);

  return ApiResponse.success(res, 200, courses, pagination, 'Lấy danh sách khóa học thành công');
});

/**
 * @desc Get a single course by ID
 * @route GET /api/v1/courses/:id
 * @access Private
 */
const getCourse = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(new AppError('Không tìm thấy khóa học với ID này', 404));
  }

  return ApiResponse.successSingle(res, 200, course, 'Lấy thông tin khóa học thành công');
});

/**
 * @desc Get lessons for a specific course
 * @route GET /api/v1/courses/:courseId/lessons
 * @access Private
 */
const getCourseLessons = catchAsync(async (req, res, next) => {
  // Kiểm tra course có tồn tại không
  const course = await Course.findById(req.params.courseId);
  if (!course) {
    return next(new AppError('Không tìm thấy khóa học với ID này', 404));
  }

  const features = new APIFeatures(
    Lesson.find({ course: req.params.courseId }), 
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();
  
  const lessons = await features.query;
  
  // Đếm tổng số lessons của course này
  const totalCount = await Lesson.countDocuments({ 
    course: req.params.courseId,
    ...features.getFilterQuery()
  });

  // Tạo thông tin pagination
  const pagination = ApiResponse.createPagination(req.query, totalCount);

  return ApiResponse.success(res, 200, lessons, pagination, 'Lấy danh sách bài học thành công');
});

/**
 * @desc Get a single lesson by ID
 * @route GET /api/v1/courses/:courseId/lessons/:lessonId
 * @access Private
 */
const getLesson = catchAsync(async (req, res, next) => {
  const lesson = await Lesson.findOne({
    _id: req.params.lessonId,
    course: req.params.courseId
  });

  if (!lesson) {
    return next(new AppError('Không tìm thấy bài học với ID này', 404));
  }

  return ApiResponse.successSingle(res, 200, lesson, 'Lấy thông tin bài học thành công');
});

const createCourse = catchAsync(async (req, res, next) => {
  const course = await Course.create(req.body);

  return ApiResponse.successSingle(res, 201, course, 'Tạo khóa học thành công');
});



module.exports = {
  getAllCourses,
  getCourse,
  getCourseLessons,
  getLesson,
  createCourse
}; 