import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validation.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { registerSchema, loginSchema, registerUserSchema, updatePasswordSchema } from '../validators/auth.validator.js';

const router = express.Router();

/**
 * POST /api/v1/auth/register
 * Регистрация новой клиники
 * Public endpoint (старый - сохранен для совместимости)
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * POST /api/v1/auth/register-user
 * Регистрация нового пользователя (Patient, Doctor, Partner)
 * Public endpoint
 */
router.post('/register-user', validate(registerUserSchema), authController.registerUser);

/**
 * POST /api/v1/auth/login
 * Авторизация пользователя (единый для всех ролей)
 * Public endpoint
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * GET /api/v1/auth/me
 * Получить текущего пользователя
 * Protected endpoint
 */
router.get('/me', authenticate, authController.getMe);

/**
 * PUT /api/v1/auth/password
 * Изменить пароль текущего пользователя (для всех ролей)
 * Protected endpoint
 */
router.put('/password', authenticate, validate(updatePasswordSchema), authController.updatePassword);

export default router;

