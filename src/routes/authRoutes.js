const express = require('express');
const authController = require('../controllers/authController'); // Import authController
const { validateSignup, validateLogin } = require('../validate/authValidation');

const router = express.Router();

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Tên đăng nhập
 *                 example: "user123"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 description: Mật khẩu
 *                 example: "password123"
 *               passwordConfirm:
 *                 type: string
 *                 description: Xác nhận mật khẩu
 *                 example: "password123"
 *             required:
 *               - username
 *               - email
 *               - password
 *               - passwordConfirm
 *     responses:
 *       201:
 *         description: Đăng ký thành công
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
 *                             token:
 *                               type: string
 *                               description: JWT token
 *                             user:
 *                               $ref: '#/components/schemas/User'
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/signup', validateSignup, authController.signup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 description: Mật khẩu
 *                 example: "password123"
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
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
 *                             token:
 *                               type: string
 *                               description: JWT token
 *                             user:
 *                               $ref: '#/components/schemas/User'
 *       401:
 *         description: Thông tin đăng nhập không chính xác
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', validateLogin, authController.login);

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     summary: Đăng xuất
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
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
 *                   example: "Đăng xuất thành công"
 */
router.get('/logout', authController.logout);

module.exports = router;
