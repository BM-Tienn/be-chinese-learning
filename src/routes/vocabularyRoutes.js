const express = require('express');
const vocabularyController = require('../controllers/vocabularyController'); // Import vocabularyController instance
const authController = require('../controllers/authController'); // Import authController for middleware
const { uploadJsonFile, uploadMultipleJsonFiles } = require('../middlewares/upload'); // Import upload middleware
const { FILE_UPLOAD } = require('../utils/constants'); // Import constants
const { uploadLogger } = require('../middlewares/requestLogger'); // Import upload logger middleware
const { uploadRateLimitStore } = require('../middlewares/security'); // Import upload rate limit store
const { 
  validateCreateVocabulary, 
  validateUpdateVocabulary, 
  validateObjectId, 
  validatePagination,
  validateFileUpload
} = require('../validate/vocabularyValidation');

const router = express.Router();

/**
 * @swagger
 * /vocabularies:
 *   get:
 *     summary: Lấy danh sách từ vựng chung
 *     tags: [Vocabularies]
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
 *         name: category
 *         schema:
 *           type: string
 *           enum: [HSK1, HSK2, HSK3, HSK4, HSK5, HSK6, Common, Idiom, Proverb, Advanced, Other, Place Name, Person Name, Technical, Literary, Informal]
 *         description: Lọc theo danh mục
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo từ khóa
 *     responses:
 *       200:
 *         description: Danh sách từ vựng chung
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
 *                             $ref: '#/components/schemas/Vocabulary'
 */
router
  .route('/')
  .get(validatePagination, vocabularyController.getAllVocabularies); // Publicly accessible

// Admin-only routes for managing the curated vocabulary
router.use(authController.protect, authController.restrictTo('admin'));

/**
 * @swagger
 * /vocabularies:
 *   post:
 *     summary: Tạo từ vựng mới (Admin)
 *     tags: [Vocabularies]
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
 *               vietnameseReading:
 *                 type: string
 *                 description: Cách đọc tiếng Việt
 *                 example: "nỉ hảo"
 *               meaning:
 *                 type: object
 *                 properties:
 *                   primary:
 *                     type: string
 *                     description: Định nghĩa chính
 *                     example: "Xin chào"
 *                   secondary:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Định nghĩa phụ
 *                     example: ["Chào hỏi", "Lời chào"]
 *                   partOfSpeech:
 *                     type: string
 *                     description: Từ loại
 *                     example: "interjection"
 *                 required:
 *                   - primary
 *               grammar:
 *                 type: object
 *                 properties:
 *                   level:
 *                     type: string
 *                     description: Cấp độ ngữ pháp
 *                     example: "HSK1"
 *                   frequency:
 *                     type: number
 *                     description: Tần suất sử dụng
 *                     example: 100
 *                   formality:
 *                     type: string
 *                     description: Mức độ trang trọng
 *                     example: "neutral"
 *               examples:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     chinese:
 *                       type: string
 *                       example: "你好，我是小明"
 *                     pinyin:
 *                       type: string
 *                       example: "nǐ hǎo, wǒ shì xiǎo míng"
 *                     vietnamese:
 *                       type: string
 *                       example: "Xin chào, tôi là Tiểu Minh"
 *                 description: Ví dụ câu
 *               related:
 *                 type: object
 *                 properties:
 *                   synonyms:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Từ đồng nghĩa
 *                   antonyms:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Từ trái nghĩa
 *                   compounds:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Từ ghép liên quan
 *               category:
 *                 type: string
 *                 enum: [HSK1, HSK2, HSK3, HSK4, HSK5, HSK6, Common, Idiom, Proverb, Advanced, Other, Place Name, Person Name, Technical, Literary, Informal]
 *                 default: Common
 *                 description: Danh mục từ vựng
 *             required:
 *               - chinese
 *               - pinyin
 *               - meaning
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
 *                           $ref: '#/components/schemas/Vocabulary'
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
 *       403:
 *         description: Không có quyền truy cập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router
  .route('/')
  .post(validateCreateVocabulary, vocabularyController.createVocabulary);

/**
 * @swagger
 * /vocabularies/upload:
 *   post:
 *     summary: Upload file JSON từ CC-CEDICT vào vocabulary database (Admin)
 *     tags: [Vocabularies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File JSON cần upload (chỉ chấp nhận file .json)
 *                 example: "cedict_data.json"
 *             required:
 *               - file
 *     responses:
 *       200:
 *         description: Upload thành công
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
 *                         summary:
 *                           type: string
 *                           description: Tóm tắt kết quả upload
 *                           example: "Upload hoàn tất: 100 thành công, 5 thất bại, 0 bỏ qua"
 *                         details:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: number
 *                               description: Tổng số từ vựng trong file
 *                             success:
 *                               type: number
 *                               description: Số từ vựng được xử lý thành công
 *                             failed:
 *                               type: number
 *                               description: Số từ vựng xử lý thất bại
 *                             skipped:
 *                               type: number
 *                               description: Số từ vựng bị bỏ qua
 *                             errors:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   index:
 *                                     type: number
 *                                     description: Vị trí từ vựng trong file
 *                                   word:
 *                                     type: string
 *                                     description: Từ vựng gặp lỗi
 *                                   error:
 *                                     type: string
 *                                     description: Mô tả lỗi
 *                             successes:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   index:
 *                                     type: number
 *                                     description: Vị trí từ vựng trong file
 *                                   word:
 *                                     type: string
 *                                     description: Từ vựng được xử lý
 *                                   action:
 *                                     type: string
 *                                     enum: [created, updated]
 *                                     description: Hành động thực hiện
 *                                   id:
 *                                     type: string
 *                                     description: ID của từ vựng trong database
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ hoặc file JSON không đúng định dạng
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
 *       403:
 *         description: Không có quyền truy cập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Lỗi server khi xử lý file JSON
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router
  .route('/upload')
  .post(
    uploadJsonFile('file'),
    vocabularyController.uploadCedictJson
  );

/**
 * @swagger
 * /vocabularies/upload-multiple:
 *   post:
 *     summary: Upload nhiều file CC-CEDICT JSON cùng lúc (Admin)
 *     tags: [Vocabularies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Danh sách các file JSON CC-CEDICT (tối đa 20 files)
 *     responses:
 *       200:
 *         description: Upload thành công
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
 *                   example: "Upload 3 files hoàn tất: 1500 thành công, 50 thất bại, 25 bỏ qua"
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: string
 *                       description: Tóm tắt kết quả
 *                     totalFiles:
 *                       type: number
 *                       description: Tổng số file đã upload
 *                     totalItems:
 *                       type: number
 *                       description: Tổng số từ vựng đã xử lý
 *                     totalSuccess:
 *                       type: number
 *                       description: Số từ vựng thành công
 *                     totalFailed:
 *                       type: number
 *                       description: Số từ vựng thất bại
 *                     totalSkipped:
 *                       type: number
 *                       description: Số từ vựng bỏ qua
 *                     filesResults:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           fileName:
 *                             type: string
 *                           fileSize:
 *                             type: number
 *                           status:
 *                             type: string
 *                             enum: [success, error]
 *                           results:
 *                             type: object
 *                           error:
 *                             type: string
 *       400:
 *         description: Lỗi validation hoặc không có file
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Chưa xác thực hoặc token không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Không có quyền truy cập (cần quyền admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Lỗi server khi xử lý files
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router
  .route('/upload-multiple')
  .post(
    uploadMultipleJsonFiles('files', FILE_UPLOAD.MAX_JSON_FILES_COUNT),
    vocabularyController.uploadMultipleCedictJson
  );

/**
 * @swagger
 * /vocabularies/{id}:
 *   get:
 *     summary: Lấy thông tin từ vựng theo ID
 *     tags: [Vocabularies]
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
 *                           $ref: '#/components/schemas/Vocabulary'
 *       404:
 *         description: Không tìm thấy từ vựng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   patch:
 *     summary: Cập nhật từ vựng (Admin)
 *     tags: [Vocabularies]
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
 *               vietnameseReading:
 *                 type: string
 *                 description: Cách đọc tiếng Việt
 *                 example: "nỉ hảo"
 *               meaning:
 *                 type: object
 *                 properties:
 *                   primary:
 *                     type: string
 *                     description: Định nghĩa chính
 *                     example: "Xin chào"
 *                   secondary:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Định nghĩa phụ
 *                     example: ["Chào hỏi", "Lời chào"]
 *                   partOfSpeech:
 *                     type: string
 *                     description: Từ loại
 *                     example: "interjection"
 *               grammar:
 *                 type: object
 *                 properties:
 *                   level:
 *                     type: string
 *                     description: Cấp độ ngữ pháp
 *                     example: "HSK1"
 *                   frequency:
 *                     type: number
 *                     description: Tần suất sử dụng
 *                     example: 100
 *                   formality:
 *                     type: string
 *                     description: Mức độ trang trọng
 *                     example: "neutral"
 *               examples:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     chinese:
 *                       type: string
 *                       example: "你好，我是小明"
 *                     pinyin:
 *                       type: string
 *                       example: "nǐ hǎo, wǒ shì xiǎo míng"
 *                     vietnamese:
 *                       type: string
 *                       example: "Xin chào, tôi là Tiểu Minh"
 *                 description: Ví dụ câu
 *               related:
 *                 type: object
 *                 properties:
 *                   synonyms:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Từ đồng nghĩa
 *                   antonyms:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Từ trái nghĩa
 *                   compounds:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Từ ghép liên quan
 *               category:
 *                 type: string
 *                 enum: [HSK1, HSK2, HSK3, HSK4, HSK5, HSK6, Common, Idiom, Proverb, Advanced, Other, Place Name, Person Name, Technical, Literary, Informal]
 *                 description: Danh mục từ vựng
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
 *                           $ref: '#/components/schemas/Vocabulary'
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
 *       403:
 *         description: Không có quyền truy cập
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
 *     summary: Xóa từ vựng (Admin)
 *     tags: [Vocabularies]
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
 *       403:
 *         description: Không có quyền truy cập
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
  .get(validateObjectId, vocabularyController.getVocabulary) // Can be public or restricted based on requirement
  .patch(validateObjectId, validateUpdateVocabulary, vocabularyController.updateVocabulary)
  .delete(validateObjectId, vocabularyController.deleteVocabulary);

module.exports = router;
