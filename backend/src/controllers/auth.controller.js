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

    // Результат может содержать user или patient
    if (result.patient) {
      console.log('✅ [AUTH CONTROLLER] Регистрация успешна (Patient):', { patientId: result.patient.id });
    } else if (result.user) {
      console.log('✅ [AUTH CONTROLLER] Регистрация успешна (User):', { userId: result.user.id, role: result.user.role });
    }

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
 * Получить данные текущего пользователя (User или Patient)
 */
export async function getMe(req, res, next) {
  try {
    const currentUser = await authService.getCurrentUser(
      req.user.userId,
      req.user.patientId
    );

    successResponse(res, currentUser, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/auth/password
 * Изменить пароль текущего пользователя (для всех ролей, включая Patient)
 */
export async function updatePassword(req, res, next) {
  try {
    const { userId, patientId } = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Current password and new password are required', 400);
    }

    // Если это Patient - обновляем пароль в Patient table
    if (patientId) {
      const result = await authService.updatePatientPassword(patientId, currentPassword, newPassword);
      successResponse(res, result);
    } else if (userId) {
      // Если это User - обновляем пароль в User table
      const result = await authService.updatePassword(userId, currentPassword, newPassword);
      successResponse(res, result);
    } else {
      return errorResponse(res, 'AUTH_ERROR', 'User or Patient ID not found', 401);
    }
  } catch (error) {
    next(error);
  }
}

