import express from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { tenantMiddleware } from '../middlewares/tenant.middleware.js';

const router = express.Router();

// Применяем auth и tenant middleware ко всем routes
router.use(authenticate);
router.use(tenantMiddleware);

/**
 * GET /api/v1/analytics/summary
 * Получить общие метрики клиники
 * Доступ: ADMIN, CLINIC, DOCTOR
 * Query params: ?doctorId=xxx&dateFrom=2025-01-01&dateTo=2025-01-31&week=2025-W03&category=...
 */
router.get('/summary', analyticsController.getSummary);

/**
 * GET /api/v1/analytics/charts
 * Получить данные для графиков
 * Доступ: ADMIN, CLINIC, DOCTOR
 * Query params: ?type=daily|weekly|monthly|byDoctor|byCategory|byStatus&doctorId=xxx&dateFrom=...&dateTo=...
 */
router.get('/charts', analyticsController.getChartData);

/**
 * GET /api/v1/analytics/table
 * Получить детальные данные для таблицы
 * Доступ: ADMIN, CLINIC, DOCTOR
 * Query params: ?doctorId=xxx&dateFrom=...&dateTo=...&page=1&limit=20&sortBy=appointmentDate&sortOrder=desc
 */
router.get('/table', analyticsController.getAnalyticsTable);

export default router;

