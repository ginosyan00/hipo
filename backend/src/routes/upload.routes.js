import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import * as uploadController from '../controllers/upload.controller.js';

const router = express.Router();

// Все маршруты загрузки требуют аутентификации
router.use(authenticate);

// Загрузить изображение
router.post('/image', uploadController.uploadImage);

export default router;



