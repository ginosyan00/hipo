import * as authService from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

/**
 * Auth Controller
 * Обработчики для auth endpoints
 */

/**
 * POST /api/v1/auth/register
 * Регистрация новой клиники (старый endpoint - сохранен для совместимости)
 */
export async function register(req, res, next) {
  try {
    const { clinic, admin } = req.body;

    const result = await authService.registerClinic(clinic, admin);

    successResponse(res, result, 201);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/register-user
 * Регистрация нового пользователя (Patient, Doctor, Partner)
 */
export async function registerUser(req, res, next) {
  try {
    console.log('🔵 [AUTH CONTROLLER] Получен запрос на регистрацию:', { role: req.body.role, email: req.body.email });

    const result = await authService.registerUser(req.body);

    console.log('✅ [AUTH CONTROLLER] Регистрация успешна:', { userId: result.user.id, role: result.user.role });

    successResponse(res, result, 201);
  } catch (error) {
    console.log('🔴 [AUTH CONTROLLER] Ошибка регистрации:', error.message);
    next(error);
  }
}

/**
 * POST /api/v1/auth/login
 * Авторизация пользователя
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const result = await authService.loginUser(email, password);

    successResponse(res, result, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/auth/me
 * Получить данные текущего пользователя
 */
export async function getMe(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.userId);

    successResponse(res, user, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/auth/password
 * Изменить пароль текущего пользователя (для всех ролей)
 */
export async function updatePassword(req, res, next) {
  try {
    const { userId } = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Current password and new password are required', 400);
    }

    const result = await authService.updatePassword(userId, currentPassword, newPassword);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

