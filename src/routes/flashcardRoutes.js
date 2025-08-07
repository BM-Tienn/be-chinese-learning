const express = require('express');
const flashcardController = require('../controllers/flashcardController');
const { protect } = require('../middlewares/auth');
const { validateContentType } = require('../middlewares/security');

const router = express.Router();

// Tất cả routes đều yêu cầu authentication
router.use(protect);

/**
 * @swagger
 * /flashcards:
 *   get:
 *     summary: Lấy danh sách flashcard sets của người dùng
 *     tags: [Flashcards]
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
 *     responses:
 *       200:
 *         description: Danh sách flashcard sets
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
 *                             $ref: '#/components/schemas/FlashcardSet'
 *       401:
 *         description: Chưa xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', flashcardController.getUserFlashcardSets);

/**
 * @swagger
 * /flashcards/study:
 *   get:
 *     summary: Lấy flashcards để học
 *     tags: [Flashcards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: setId
 *         schema:
 *           type: string
 *         description: ID của flashcard set
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số flashcards muốn học
 *     responses:
 *       200:
 *         description: Danh sách flashcards để học
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
 *                             $ref: '#/components/schemas/Flashcard'
 *       401:
 *         description: Chưa xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/study', flashcardController.getFlashcardsForStudy);

/**
 * @swagger
 * /flashcards/{setId}:
 *   get:
 *     summary: Lấy thông tin chi tiết flashcard set
 *     tags: [Flashcards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: setId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID flashcard set
 *     responses:
 *       200:
 *         description: Thông tin chi tiết flashcard set
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
 *                           $ref: '#/components/schemas/FlashcardSet'
 *       401:
 *         description: Chưa xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Không tìm thấy flashcard set
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:setId', flashcardController.getFlashcardSet);

/**
 * @swagger
 * /flashcards/{setId}/progress:
 *   post:
 *     summary: Cập nhật tiến độ học flashcard
 *     tags: [Flashcards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: setId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID flashcard set
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cardId:
 *                 type: string
 *                 description: ID của flashcard
 *               isCorrect:
 *                 type: boolean
 *                 description: Đáp án đúng hay sai
 *             required:
 *               - cardId
 *               - isCorrect
 *     responses:
 *       200:
 *         description: Cập nhật tiến độ thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Cập nhật tiến độ thành công"
 *       401:
 *         description: Chưa xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:setId/progress', validateContentType, flashcardController.updateProgress);

module.exports = router; 