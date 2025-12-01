import { extractTokenFromHeader, verifyToken } from '../utils/jwt.util.js';
import { unauthorizedResponse } from '../utils/response.util.js';

/**
 * Authentication Middleware
 * Проверка JWT токена и извлечение пользователя
 */
export function authenticate(req, res, next) {
  try {
    console.log('🔵 [AUTH MIDDLEWARE] Проверка токена...');

    // Извлекаем токен из header
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      console.log('🔴 [AUTH MIDDLEWARE] Токен не предоставлен');
      return unauthorizedResponse(res, 'No token provided');
    }

    // Верифицируем токен
    const decoded = verifyToken(token);

    console.log('✅ [AUTH MIDDLEWARE] Токен валиден:', { userId: decoded.userId, role: decoded.role, status: decoded.status });

    // Добавляем данные пользователя в request (теперь с status)
    // Может быть userId (для User) или patientId (для Patient)
    req.user = {
      userId: decoded.userId || null,
      patientId: decoded.patientId || null,
      clinicId: decoded.clinicId,
      role: decoded.role,
      status: decoded.status,
    };

    next();
  } catch (error) {
    console.log('🔴 [AUTH MIDDLEWARE] Ошибка верификации токена:', error.message);
    return unauthorizedResponse(res, error.message);
  }
}

/**
 * Authorization Middleware
 * Проверка роли пользователя
 * @param {string[]} allowedRoles - Разрешенные роли
 * @returns {Function} Express middleware
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    console.log('🔵 [AUTHORIZE MIDDLEWARE] Проверка роли:', { userRole: req.user?.role, allowedRoles });

    if (!req.user) {
      console.log('🔴 [AUTHORIZE MIDDLEWARE] Пользователь не аутентифицирован');
      return unauthorizedResponse(res, 'User not authenticated');
    }

    // Нормализуем роли для сравнения (case-insensitive)
    const userRole = req.user.role?.toUpperCase();
    const normalizedAllowedRoles = allowedRoles.map(role => role.toUpperCase());

    if (!normalizedAllowedRoles.includes(userRole)) {
      console.log('🔴 [AUTHORIZE MIDDLEWARE] Доступ запрещен:', { 
        userRole: req.user.role, 
        normalizedUserRole: userRole,
        allowedRoles,
        normalizedAllowedRoles 
      });
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource',
        },
      });
    }

    console.log('✅ [AUTHORIZE MIDDLEWARE] Доступ разрешен для роли:', userRole);
    next();
  };
}

