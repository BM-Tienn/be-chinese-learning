const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Tất cả routes đều yêu cầu authentication
router.use(protect);

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Lấy thông tin dashboard của người dùng
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin dashboard
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardSingleResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         item:
 *                           type: object
 *                           properties:
 *                             stats:
 *                               type: object
 *                               properties:
 *                                 totalWords:
 *                                   type: number
 *                                 learnedWords:
 *                                   type: number
 *                                 studyStreak:
 *                                   type: number
 *                                 totalStudyTime:
 *                                   type: number
 *                             recentLessons:
 *                               type: array
 *                               items:
 *                                 $ref: '#/components/schemas/Lesson'
 *                             currentGoals:
 *                               type: array
 *                               items:
 *                                 $ref: '#/components/schemas/UserGoal'
 *       401:
 *         description: Chưa xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', dashboardController.getDashboard);

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Lấy thống kê học tập
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê học tập
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardSingleResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         item:
 *                           type: object
 *                           properties:
 *                             totalWords:
 *                               type: number
 *                             learnedWords:
 *                               type: number
 *                             studyStreak:
 *                               type: number
 *                             totalStudyTime:
 *                               type: number
 *                             weeklyProgress:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   date:
 *                                     type: string
 *                                   wordsLearned:
 *                                     type: number
 *                                   studyTime:
 *                                     type: number
 *       401:
 *         description: Chưa xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stats', dashboardController.getStats);

/**
 * @swagger
 * /dashboard/recent-activity:
 *   get:
 *     summary: Lấy hoạt động gần đây
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số hoạt động muốn lấy
 *     responses:
 *       200:
 *         description: Danh sách hoạt động gần đây
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         items:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               type:
 *                                 type: string
 *                                 enum: [lesson_completed, word_learned, flashcard_studied]
 *                               title:
 *                                 type: string
 *                               description:
 *                                 type: string
 *                               timestamp:
 *                                 type: string
 *                               data:
 *                                 type: object
 *       401:
 *         description: Chưa xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/recent-activity', dashboardController.getRecentActivity);

module.exports = router; 