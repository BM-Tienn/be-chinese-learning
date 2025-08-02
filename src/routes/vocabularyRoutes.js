const express = require('express');
const vocabularyController = require('../controllers/vocabularyController'); // Import vocabularyController instance
const authController = require('../controllers/authController'); // Import authController for middleware
const { uploadJsonFile } = require('../middlewares/upload'); // Import upload middleware
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
 * /vocabularies/upload-cedict:
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
 *                 description: File JSON cần upload
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
 *       404:
 *         description: Không tìm thấy file JSON
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
// Middleware để log request upload-cedict
const uploadCedictLogger = (req, res, next) => {
  console.log('=== UPLOAD CEDICT ROUTE TRIGGERED ===');
  console.log('Thời gian:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Headers:', req.headers);
  console.log('Body keys:', Object.keys(req.body || {}));
  console.log('File:', req.file ? {
    fieldname: req.file.fieldname,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  } : 'Không có file');
  console.log('=====================================');
  next();
};

// Route test để kiểm tra upload-cedict có hoạt động không
router.get('/upload-cedict/test', (req, res) => {
  console.log('=== UPLOAD CEDICT TEST ROUTE ===');
  console.log('Thời gian:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Headers:', req.headers);
  console.log('================================');
  
  res.status(200).json({
    success: true,
    message: 'Route upload-cedict hoạt động bình thường',
    timestamp: new Date().toISOString()
  });
});

router
  .route('/upload-cedict')
  .post(uploadJsonFile('file'), uploadLogger, uploadCedictLogger, vocabularyController.uploadCedictJson);

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

// Development endpoint để reset rate limit (chỉ trong môi trường development)
if (process.env.NODE_ENV === 'development') {
  /**
   * @swagger
   * /vocabularies/reset-rate-limit:
   *   post:
   *     summary: Reset rate limit cho upload (Development only)
   *     tags: [Vocabularies]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Rate limit đã được reset
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
   *                   example: "Rate limit đã được reset"
   *       401:
   *         description: Chưa xác thực
   *       403:
   *         description: Không có quyền truy cập
   */
  router.post('/reset-rate-limit', (req, res) => {
    // Reset rate limit bằng cách clear store
    uploadRateLimitStore.clear();
    
    return res.status(200).json({
      status: 'success',
      message: 'Rate limit đã được reset'
    });
  });
}

module.exports = router;
