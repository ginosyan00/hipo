import * as medicationService from '../services/medication.service.js';
import { successResponse } from '../utils/response.util.js';

/**
 * Medication Controller
 * Обработчики для medication endpoints
 */

/**
 * GET /api/v1/medications
 * Получить список медикаментов
 */
export async function getAll(req, res, next) {
  try {
    console.log('🔵 [MEDICATION CONTROLLER] getAll request:', { 
      user: req.user, 
      query: req.query 
    });

    const { search, page, limit } = req.query;
    const clinicId = req.user.clinicId;

    if (!clinicId) {
      console.log('🔴 [MEDICATION CONTROLLER] No clinicId');
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Clinic ID is required',
        },
      });
    }

    const result = await medicationService.findAll(clinicId, {
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 100,
    });

    console.log('✅ [MEDICATION CONTROLLER] Sending response:', { 
      medicationsCount: result.data.length,
      total: result.meta.total 
    });

    successResponse(res, result, 200);
  } catch (error) {
    console.error('❌ [MEDICATION CONTROLLER] Error:', error);
    next(error);
  }
}

/**
 * GET /api/v1/medications/stats
 * Получить статистику медикаментов
 */
export async function getStats(req, res, next) {
  try {
    const clinicId = req.user.clinicId;

    if (!clinicId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Clinic ID is required',
        },
      });
    }

    const stats = await medicationService.getStats(clinicId);

    successResponse(res, stats, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/medications/:id
 * Получить медикамент по ID
 */
export async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const clinicId = req.user.clinicId;

    if (!clinicId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Clinic ID is required',
        },
      });
    }

    const medication = await medicationService.findById(clinicId, id);

    successResponse(res, medication, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/medications
 * Создать медикамент
 */
export async function create(req, res, next) {
  try {
    console.log('🔵 [MEDICATION CONTROLLER] Create request:', { 
      user: req.user, 
      body: req.body 
    });

    const clinicId = req.user.clinicId;

    if (!clinicId) {
      console.log('🔴 [MEDICATION CONTROLLER] No clinicId');
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Clinic ID is required',
        },
      });
    }

    const medication = await medicationService.create(clinicId, req.body);

    console.log('✅ [MEDICATION CONTROLLER] Medication created, sending response');
    successResponse(res, medication, 201);
  } catch (error) {
    console.error('❌ [MEDICATION CONTROLLER] Error:', error);
    next(error);
  }
}

/**
 * PUT /api/v1/medications/:id
 * Обновить медикамент
 */
export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const clinicId = req.user.clinicId;

    if (!clinicId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Clinic ID is required',
        },
      });
    }

    const medication = await medicationService.update(clinicId, id, req.body);

    successResponse(res, medication, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/medications/:id
 * Удалить медикамент
 */
export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const clinicId = req.user.clinicId;

    if (!clinicId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Clinic ID is required',
        },
      });
    }

    await medicationService.remove(clinicId, id);

    successResponse(res, { message: 'Medication deleted successfully' }, 200);
  } catch (error) {
    next(error);
  }
}

