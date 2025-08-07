const Word = require('../models/Word');
const Lesson = require('../models/Lesson');
const UserProgress = require('../models/UserProgress');
const UserGoal = require('../models/UserGoal');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc Get dashboard information for the authenticated user
 * @route GET /api/v1/dashboard
 * @access Private
 */
const getDashboard = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  // Lấy thống kê cơ bản
  const totalWords = await Word.countDocuments({ user: userId });
  const learnedWords = await Word.countDocuments({ 
    user: userId, 
    status: 'learned' 
  });

  // Lấy bài học gần đây
  const recentLessons = await Lesson.find({ user: userId })
    .sort({ lastStudied: -1 })
    .limit(5)
    .populate('course', 'title level');

  // Lấy mục tiêu hiện tại
  const currentGoals = await UserGoal.find({ 
    user: userId, 
    status: 'active' 
  }).limit(3);

  // Lấy streak học tập
  const userProgress = await UserProgress.findOne({ user: userId });
  const studyStreak = userProgress ? userProgress.studyStreak : 0;

  const dashboardData = {
    stats: {
      totalWords,
      learnedWords,
      studyStreak,
      totalStudyTime: userProgress ? userProgress.totalStudyTime : 0
    },
    recentLessons,
    currentGoals
  };

  return ApiResponse.successSingle(res, 200, dashboardData, 'Lấy thông tin dashboard thành công');
});

/**
 * @desc Get detailed statistics for the authenticated user
 * @route GET /api/v1/dashboard/stats
 * @access Private
 */
const getStats = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  // Thống kê cơ bản
  const totalWords = await Word.countDocuments({ user: userId });
  const learnedWords = await Word.countDocuments({ 
    user: userId, 
    status: 'learned' 
  });
  const inProgressWords = await Word.countDocuments({ 
    user: userId, 
    status: 'in_progress' 
  });

  // Lấy user progress
  const userProgress = await UserProgress.findOne({ user: userId });
  const studyStreak = userProgress ? userProgress.studyStreak : 0;
  const totalStudyTime = userProgress ? userProgress.totalStudyTime : 0;

  // Tính tiến độ tuần này
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const weeklyProgress = await Word.aggregate([
    {
      $match: {
        user: userId,
        lastStudied: { $gte: oneWeekAgo }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$lastStudied"
          }
        },
        wordsLearned: { $sum: 1 },
        studyTime: { $sum: "$studyTime" }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  const stats = {
    totalWords,
    learnedWords,
    inProgressWords,
    studyStreak,
    totalStudyTime,
    weeklyProgress
  };

  return ApiResponse.successSingle(res, 200, stats, 'Lấy thống kê thành công');
});

/**
 * @desc Get recent activity for the authenticated user
 * @route GET /api/v1/dashboard/recent-activity
 * @access Private
 */
const getRecentActivity = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 10;

  // Lấy hoạt động gần đây từ nhiều nguồn
  const activities = [];

  // Lấy words được học gần đây
  const recentWords = await Word.find({ user: userId })
    .sort({ lastStudied: -1 })
    .limit(limit)
    .select('chinese pinyin definition lastStudied');

  recentWords.forEach(word => {
    if (word.lastStudied) {
      activities.push({
        type: 'word_learned',
        title: `Đã học từ: ${word.chinese}`,
        description: `${word.pinyin} - ${word.definition}`,
        timestamp: word.lastStudied,
        data: word
      });
    }
  });

  // Lấy lessons được hoàn thành gần đây
  const recentLessons = await Lesson.find({ 
    user: userId, 
    status: 'completed' 
  })
    .sort({ completedAt: -1 })
    .limit(limit)
    .populate('course', 'title');

  recentLessons.forEach(lesson => {
    if (lesson.completedAt) {
      activities.push({
        type: 'lesson_completed',
        title: `Hoàn thành bài học: ${lesson.title}`,
        description: `Khóa học: ${lesson.course.title}`,
        timestamp: lesson.completedAt,
        data: lesson
      });
    }
  });

  // Sắp xếp theo thời gian
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return ApiResponse.success(res, 200, activities.slice(0, limit), null, 'Lấy hoạt động gần đây thành công');
});

module.exports = {
  getDashboard,
  getStats,
  getRecentActivity
}; 