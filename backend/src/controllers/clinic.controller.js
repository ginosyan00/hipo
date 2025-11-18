import * as clinicService from '../services/clinic.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

/**
 * Clinic Controller
 * Обработчики для clinic endpoints
 */

/**
 * GET /api/v1/clinic/me
 * Получить данные текущей клиники
 */
export async function getClinic(req, res, next) {
  try {
    const { clinicId } = req.user;

    if (!clinicId) {
      return errorResponse(res, 'User is not associated with a clinic', 403);
    }

    const clinic = await clinicService.getClinicById(clinicId);
    successResponse(res, clinic);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/clinic/me
 * Обновить профиль клиники
 */
export async function updateClinic(req, res, next) {
  try {
    const { clinicId } = req.user;

    if (!clinicId) {
      return errorResponse(res, 'User is not associated with a clinic', 403);
    }

    const clinic = await clinicService.updateClinicProfile(clinicId, req.body);
    successResponse(res, clinic);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/clinic/logo
 * Загрузить логотип клиники
 */
export async function uploadLogo(req, res, next) {
  try {
    const { clinicId } = req.user;

    if (!clinicId) {
      return errorResponse(res, 'User is not associated with a clinic', 403);
    }

    const { logo } = req.body;

    if (!logo) {
      return errorResponse(res, 'Logo is required', 400);
    }

    const clinic = await clinicService.updateClinicLogo(clinicId, logo);
    successResponse(res, clinic);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/clinic/settings
 * Получить настройки клиники
 */
export async function getSettings(req, res, next) {
  try {
    const { clinicId } = req.user;

    if (!clinicId) {
      return errorResponse(res, 'User is not associated with a clinic', 403);
    }

    const settings = await clinicService.getClinicSettings(clinicId);
    successResponse(res, settings);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/clinic/settings
 * Обновить настройки клиники
 */
export async function updateSettings(req, res, next) {
  try {
    const { clinicId } = req.user;

    if (!clinicId) {
      return errorResponse(res, 'User is not associated with a clinic', 403);
    }

    const settings = await clinicService.updateClinicSettings(clinicId, req.body);
    successResponse(res, settings);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/clinic/password
 * Обновить пароль администратора клиники
 */
export async function updatePassword(req, res, next) {
  try {
    const { clinicId, userId } = req.user;

    if (!clinicId) {
      return errorResponse(res, 'User is not associated with a clinic', 403);
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Current password and new password are required', 400);
    }

    const result = await clinicService.updateClinicPassword(
      clinicId,
      userId,
      currentPassword,
      newPassword
    );
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

