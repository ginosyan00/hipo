import * as analyticsService from '../services/analytics.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

/**
 * Analytics Controller
 * Обработчики для аналитики клиники
 */

/**
 * GET /api/v1/analytics/summary
 * Получить общие метрики клиники
 */
export async function getSummary(req, res, next) {
  try {
    console.log('📊 [ANALYTICS CONTROLLER] GET /summary');
    console.log('📊 [ANALYTICS CONTROLLER] ClinicId:', req.user.clinicId);
    console.log('📊 [ANALYTICS CONTROLLER] Query params:', req.query);

    const { clinicId } = req.user;

    if (!clinicId) {
      return errorResponse(res, 'CLINIC_ID_REQUIRED', 'ClinicId не найден в токене пользователя', 400);
    }

    // Извлекаем фильтры из query params
    const filters = {
      doctorId: req.query.doctorId || undefined,
      dateFrom: req.query.dateFrom || undefined,
      dateTo: req.query.dateTo || undefined,
      week: req.query.week || undefined,
      category: req.query.category || undefined,
    };

    // Удаляем undefined значения
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const summary = await analyticsService.getSummary(clinicId, filters);

    console.log('✅ [ANALYTICS CONTROLLER] Summary успешно получен');

    return successResponse(res, summary, 200);
  } catch (error) {
    console.error('❌ [ANALYTICS CONTROLLER] Ошибка получения summary:', error);
    next(error);
  }
}

/**
 * GET /api/v1/analytics/charts
 * Получить данные для графиков
 */
export async function getChartData(req, res, next) {
  try {
    console.log('📊 [ANALYTICS CONTROLLER] GET /charts');
    console.log('📊 [ANALYTICS CONTROLLER] ClinicId:', req.user.clinicId);
    console.log('📊 [ANALYTICS CONTROLLER] Query params:', req.query);

    const { clinicId } = req.user;

    if (!clinicId) {
      return errorResponse(res, 'CLINIC_ID_REQUIRED', 'ClinicId не найден в токене пользователя', 400);
    }

    const { type = 'monthly' } = req.query;

    // Извлекаем фильтры из query params
    const filters = {
      doctorId: req.query.doctorId || undefined,
      dateFrom: req.query.dateFrom || undefined,
      dateTo: req.query.dateTo || undefined,
      week: req.query.week || undefined,
      category: req.query.category || undefined,
    };

    // Удаляем undefined значения
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const chartData = await analyticsService.getChartData(clinicId, filters, type);

    console.log('✅ [ANALYTICS CONTROLLER] Chart data успешно получен');

    return successResponse(res, chartData, 200);
  } catch (error) {
    console.error('❌ [ANALYTICS CONTROLLER] Ошибка получения chart data:', error);
    next(error);
  }
}

/**
 * GET /api/v1/analytics/table
 * Получить детальные данные для таблицы
 */
export async function getAnalyticsTable(req, res, next) {
  try {
    console.log('📊 [ANALYTICS CONTROLLER] GET /table');
    console.log('📊 [ANALYTICS CONTROLLER] ClinicId:', req.user.clinicId);
    console.log('📊 [ANALYTICS CONTROLLER] Query params:', req.query);

    const { clinicId } = req.user;

    if (!clinicId) {
      return errorResponse(res, 'CLINIC_ID_REQUIRED', 'ClinicId не найден в токене пользователя', 400);
    }

    // Извлекаем фильтры из query params
    const filters = {
      doctorId: req.query.doctorId || undefined,
      dateFrom: req.query.dateFrom || undefined,
      dateTo: req.query.dateTo || undefined,
      week: req.query.week || undefined,
      category: req.query.category || undefined,
    };

    // Удаляем undefined значения
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    // Опции пагинации и сортировки
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sortBy: req.query.sortBy || 'appointmentDate',
      sortOrder: req.query.sortOrder || 'desc',
    };

    const result = await analyticsService.getAnalyticsTable(clinicId, filters, options);

    console.log('✅ [ANALYTICS CONTROLLER] Analytics table успешно получен');

    return res.status(200).json({
      success: true,
      data: result.appointments,
      meta: result.meta,
    });
  } catch (error) {
    console.error('❌ [ANALYTICS CONTROLLER] Ошибка получения analytics table:', error);
    next(error);
  }
}

