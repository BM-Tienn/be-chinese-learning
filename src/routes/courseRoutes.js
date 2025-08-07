const express = require('express');
const courseController = require('../controllers/courseController');
const { protect } = require('../middlewares/auth');
const { validateContentType } = require('../middlewares/security');

const router = express.Router();

// Tất cả routes đều yêu cầu authentication
router.use(protect);

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Lấy danh sách khóa học
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số item trên mỗi trang
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *         description: Lọc theo cấp độ HSK
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên khóa học
 *     responses:
 *       200:
 *         description: Danh sách khóa học
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
 *                         pagination:
 *                           $ref: '#/components/schemas/Pagination'
 *                         items:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Course'
 *       401:
 *         description: Chưa xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', courseController.getAllCourses);

router.post('/', courseController.createCourse);

/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết khóa học
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID khóa học
 *     responses:
 *       200:
 *         description: Thông tin chi tiết khóa học
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
 *                           $ref: '#/components/schemas/Course'
 *       401:
 *         description: Chưa xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Không tìm thấy khóa học
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', courseController.getCourse);

/**
 * @swagger
 * /courses/{courseId}/lessons:
 *   get:
 *     summary: Lấy danh sách bài học của khóa học
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID khóa học
 *     responses:
 *       200:
 *         description: Danh sách bài học
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
 *                         pagination:
 *                           $ref: '#/components/schemas/Pagination'
 *                         items:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Lesson'
 *       401:
 *         description: Chưa xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:courseId/lessons', courseController.getCourseLessons);

/**
 * @swagger
 * /courses/{courseId}/lessons/{lessonId}:
 *   get:
 *     summary: Lấy thông tin chi tiết bài học
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID khóa học
 *       - in: path
 *         name: lessonId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID bài học
 *     responses:
 *       200:
 *         description: Thông tin chi tiết bài học
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
 *                           $ref: '#/components/schemas/Lesson'
 *       401:
 *         description: Chưa xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Không tìm thấy bài học
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:courseId/lessons/:lessonId', courseController.getLesson);

module.exports = router; 