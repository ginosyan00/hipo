import express from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * Notification Routes
 * Все routes требуют аутентификации
 */

// GET /api/v1/notifications - Получить список уведомлений
router.get('/', authenticate, notificationController.getAll);

// GET /api/v1/notifications/unread-count - Получить количество непрочитанных
router.get('/unread-count', authenticate, notificationController.getUnreadCount);

// GET /api/v1/notifications/:id - Получить уведомление по ID
router.get('/:id', authenticate, notificationController.getById);

// PATCH /api/v1/notifications/:id/read - Отметить как прочитанное
router.patch('/:id/read', authenticate, notificationController.markAsRead);

// PATCH /api/v1/notifications/read-all - Отметить все как прочитанные
router.patch('/read-all', authenticate, notificationController.markAllAsRead);

// DELETE /api/v1/notifications/:id - Удалить уведомление
router.delete('/:id', authenticate, notificationController.remove);

export default router;

