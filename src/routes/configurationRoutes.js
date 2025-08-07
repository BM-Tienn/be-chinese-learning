const express = require('express');
const configurationController = require('../controllers/configurationController');
const authController = require('../controllers/authController');
const { 
  validateCreateConfiguration, 
  validateUpdateConfiguration, 
  validateObjectId,
  validateBulkUpdate
} = require('../validate/configurationValidation');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Configuration:
 *       type: object
 *       required:
 *         - type
 *         - key
 *         - label
 *       properties:
 *         type:
 *           type: string
 *           enum: [filter, topic, wordType, level, category]
 *           description: Loại cấu hình
 *         key:
 *           type: string
 *           description: Khóa định danh
 *         label:
 *           type: string
 *           description: Nhãn hiển thị
 *         count:
 *           type: number
 *           default: 0
 *           description: Số lượng items
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Trạng thái hoạt động
 *         order:
 *           type: number
 *           default: 0
 *           description: Thứ tự sắp xếp
 *         metadata:
 *           type: object
 *           properties:
 *             color:
 *               type: string
 *               description: Màu sắc
 *             icon:
 *               type: string
 *               description: Icon
 *             description:
 *               type: string
 *               description: Mô tả
 *             parentKey:
 *               type: string
 *               description: Khóa của cấu hình cha
 *             level:
 *               type: number
 *               description: Cấp độ HSK
 *             difficulty:
 *               type: string
 *               enum: [easy, medium, hard]
 *               description: Độ khó
 *             category:
 *               type: string
 *               description: Danh mục con
 */

/**
 * @swagger
 * /configurations:
 *   get:
 *     summary: Lấy tất cả cấu hình
 *     tags: [Configurations]
 *     responses:
 *       200:
 *         description: Danh sách tất cả cấu hình
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Configuration'
 */
router.get('/', configurationController.getAllConfigurations);

/**
 * @swagger
 * /configurations/frontend:
 *   get:
 *     summary: Lấy cấu hình cho frontend
 *     tags: [Configurations]
 *     responses:
 *       200:
 *         description: Cấu hình cho frontend
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
 *                         filters:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Configuration'
 *                         topics:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Configuration'
 *                         wordTypes:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Configuration'
 */
router.get('/frontend', configurationController.getFrontendConfigurations);

/**
 * @swagger
 * /configurations/courses/filters:
 *   get:
 *     summary: Lấy filters cho trang Courses
 *     tags: [Configurations]
 *     responses:
 *       200:
 *         description: Danh sách filters cho Courses
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Configuration'
 */
router.get('/courses/filters', configurationController.getCourseFilters);

/**
 * @swagger
 * /configurations/flashcards:
 *   get:
 *     summary: Lấy cấu hình cho trang Flashcards
 *     tags: [Configurations]
 *     responses:
 *       200:
 *         description: Cấu hình cho Flashcards
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
 *                         topics:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Configuration'
 *                         wordTypes:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Configuration'
 */
router.get('/flashcards', configurationController.getFlashcardConfigurations);

/**
 * @swagger
 * /configurations/type/{type}:
 *   get:
 *     summary: Lấy cấu hình theo type
 *     tags: [Configurations]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [filter, topic, wordType, level, category]
 *         description: Loại cấu hình
 *     responses:
 *       200:
 *         description: Danh sách cấu hình theo type
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Configuration'
 */
router.get('/type/:type', configurationController.getConfigurationsByTypePublic);

// Admin-only routes
router.use(authController.protect, authController.restrictTo('admin'));

/**
 * @swagger
 * /configurations:
 *   post:
 *     summary: Tạo cấu hình mới (Admin)
 *     tags: [Configurations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Configuration'
 *     responses:
 *       201:
 *         description: Tạo cấu hình thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Configuration'
 */
router.post('/', validateCreateConfiguration, configurationController.createConfiguration);

/**
 * @swagger
 * /configurations/{id}:
 *   put:
 *     summary: Cập nhật cấu hình (Admin)
 *     tags: [Configurations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của cấu hình
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Configuration'
 *     responses:
 *       200:
 *         description: Cập nhật cấu hình thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Configuration'
 */
router.put('/:id', validateObjectId, validateUpdateConfiguration, configurationController.updateConfiguration);

/**
 * @swagger
 * /configurations/{id}:
 *   delete:
 *     summary: Xóa cấu hình (Admin)
 *     tags: [Configurations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của cấu hình
 *     responses:
 *       200:
 *         description: Xóa cấu hình thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 */
router.delete('/:id', validateObjectId, configurationController.deleteConfiguration);

/**
 * @swagger
 * /configurations/update-counts:
 *   post:
 *     summary: Cập nhật tất cả counts (Admin)
 *     tags: [Configurations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cập nhật counts thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 */
router.post('/update-counts', configurationController.updateAllCounts);

/**
 * @swagger
 * /configurations/initialize:
 *   post:
 *     summary: Khởi tạo cấu hình mặc định (Admin)
 *     tags: [Configurations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Khởi tạo cấu hình mặc định thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 */
router.post('/initialize', configurationController.initializeDefaultConfigurations);

/**
 * @swagger
 * /configurations/bulk-update:
 *   put:
 *     summary: Cập nhật hàng loạt cấu hình (Admin)
 *     tags: [Configurations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               configurations:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Configuration'
 *     responses:
 *       200:
 *         description: Cập nhật hàng loạt thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Configuration'
 */
router.put('/bulk-update', validateBulkUpdate, configurationController.bulkUpdateConfigurations);

/**
 * @swagger
 * /configurations/export:
 *   get:
 *     summary: Export cấu hình (Admin)
 *     tags: [Configurations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Export cấu hình thành công
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
 *                         exportDate:
 *                           type: string
 *                           format: date-time
 *                         totalConfigurations:
 *                           type: number
 *                         configurations:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Configuration'
 */
router.get('/export', configurationController.exportConfigurations);

/**
 * @swagger
 * /configurations/import:
 *   post:
 *     summary: Import cấu hình (Admin)
 *     tags: [Configurations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               configurations:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Configuration'
 *     responses:
 *       200:
 *         description: Import cấu hình thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Configuration'
 */
router.post('/import', configurationController.importConfigurations);

module.exports = router; 