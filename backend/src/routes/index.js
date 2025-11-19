import express from 'express';
import authRoutes from './auth.routes.js';
import patientRoutes from './patient.routes.js';
import userRoutes from './user.routes.js';
import appointmentRoutes from './appointment.routes.js';
import notificationRoutes from './notification.routes.js';
import clinicRoutes from './clinic.routes.js';
import publicRoutes from './public.routes.js';
import analyticsRoutes from './analytics.routes.js';

const router = express.Router();

/**
 * API Routes
 * Объединение всех маршрутов
 */

// Public routes (БЕЗ авторизации!)
router.use('/public', publicRoutes);

// Auth routes
router.use('/auth', authRoutes);

// Patient routes (требуют авторизацию)
router.use('/patients', patientRoutes);

// User routes (требуют авторизацию)
router.use('/users', userRoutes);

// Appointment routes (требуют авторизацию)
router.use('/appointments', appointmentRoutes);

// Notification routes (требуют авторизацию)
router.use('/notifications', notificationRoutes);

// Clinic routes (требуют авторизацию)
router.use('/clinic', clinicRoutes);

// Analytics routes (требуют авторизацию)
router.use('/analytics', analyticsRoutes);

// Health check (для удобства, дублирует основной health endpoint)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;

