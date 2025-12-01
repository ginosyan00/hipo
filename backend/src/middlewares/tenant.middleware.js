/**
 * Tenant Middleware
 * Multi-tenancy isolation - автоматическая фильтрация по clinicId
 */
export function tenantMiddleware(req, res, next) {
  // Проверяем что пользователь авторизован
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      },
    });
  }

  // Для PATIENT clinicId может быть null (новый пользователь еще не связан с клиникой)
  // Для других ролей (DOCTOR, ADMIN, CLINIC) clinicId обязателен
  if (req.user.role !== 'PATIENT' && !req.user.clinicId) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Clinic ID is required for this role',
      },
    });
  }

  // Добавляем tenant фильтр в request (если clinicId есть)
  // Этот фильтр будет использоваться в services для автоматической фильтрации
  if (req.user.clinicId) {
    req.tenantFilter = {
      clinicId: req.user.clinicId,
    };
  }

  // Логирование для отладки (в development)
  if (process.env.NODE_ENV === 'development') {
    console.log('[TENANT]', {
      userId: req.user.userId,
      patientId: req.user.patientId,
      clinicId: req.user.clinicId,
      role: req.user.role,
      path: req.path,
      method: req.method,
    });
  }

  next();
}

