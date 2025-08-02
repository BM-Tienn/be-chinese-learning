const express = require('express');
const wordController = require('../controllers/wordController'); // Import wordController instance
const authController = require('../controllers/authController'); // Import authController for middleware
const { validateContentType } = require('../middlewares/security'); // Import security middleware

const router = express.Router();

// Tất cả các route từ vựng cá nhân đều yêu cầu xác thực
router.use(authController.protect);

/**
 * @swagger
 * /words:
 *   get:
 *     summary: Lấy danh sách từ vựng cá nhân
 *     tags: [Words]
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
 *         name: hskLevel
 *         schema:
 *           type: integer
 *         description: Lọc theo cấp độ HSK
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Lọc theo tags (phân cách bằng dấu phẩy)
 *     responses:
 *       200:
 *         description: Danh sách từ vựng cá nhân
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
 *                             $ref: '#/components/schemas/Word'
 *       401:
 *         description: Chưa xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Tạo từ vựng mới
 *     tags: [Words]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chinese:
 *                 type: string
 *                 description: Ký tự tiếng Trung
 *                 example: "你好"
 *               pinyin:
 *                 type: string
 *                 description: Pinyin
 *                 example: "nǐ hǎo"
 *               definition:
 *                 type: string
 *                 description: Định nghĩa
 *                 example: "Xin chào"
 *               hskLevel:
 *                 type: number
 *                 description: Cấp độ HSK (tùy chọn)
 *                 example: 1
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Tags (tùy chọn)
 *                 example: ["chào hỏi", "cơ bản"]
 *             required:
 *               - chinese
 *               - pinyin
 *               - definition
 *     responses:
 *       201:
 *         description: Tạo từ vựng thành công
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
 *                           $ref: '#/components/schemas/Word'
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Chưa xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router
  .route('/')
  .get(wordController.getAllWords)
  .post(validateContentType, wordController.createWord);

/**
 * @swagger
 * /words/{id}:
 *   get:
 *     summary: Lấy thông tin từ vựng theo ID
 *     tags: [Words]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID từ vựng
 *     responses:
 *       200:
 *         description: Thông tin từ vựng
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
 *                           $ref: '#/components/schemas/Word'
 *       401:
 *         description: Chưa xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Không tìm thấy từ vựng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   patch:
 *     summary: Cập nhật từ vựng
 *     tags: [Words]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID từ vựng cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chinese:
 *                 type: string
 *                 description: Ký tự tiếng Trung
 *                 example: "你好"
 *               pinyin:
 *                 type: string
 *                 description: Pinyin
 *                 example: "nǐ hǎo"
 *               definition:
 *                 type: string
 *                 description: Định nghĩa
 *                 example: "Xin chào"
 *               hskLevel:
 *                 type: number
 *                 description: Cấp độ HSK (tùy chọn)
 *                 example: 1
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Tags (tùy chọn)
 *                 example: ["chào hỏi", "cơ bản"]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
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
 *                           $ref: '#/components/schemas/Word'
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Chưa xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Không tìm thấy từ vựng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Xóa từ vựng
 *     tags: [Words]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID từ vựng cần xóa
 *     responses:
 *       204:
 *         description: Xóa thành công
 *       401:
 *         description: Chưa xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Không tìm thấy từ vựng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router
  .route('/:id')
  .get(wordController.getWord)
  .patch(validateContentType, wordController.updateWord)
  .delete(wordController.deleteWord);

module.exports = router;
