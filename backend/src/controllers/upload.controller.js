import { successResponse } from '../utils/response.util.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Upload Controller
 * Обработка загрузки файлов (изображений для чата)
 */

/**
 * POST /api/v1/upload/image
 * Загрузить изображение (base64)
 */
export async function uploadImage(req, res, next) {
  try {
    const { image } = req.body; // base64 строка

    if (!image) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Изображение не предоставлено',
        },
      });
    }

    // Проверяем формат base64
    const base64Regex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;
    if (!base64Regex.test(image)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Некорректный формат изображения. Ожидается base64 строка с префиксом data:image/...',
        },
      });
    }

    // Извлекаем тип и данные
    const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Некорректный формат base64',
        },
      });
    }

    const imageType = matches[1];
    const base64Data = matches[2];

    // Проверяем размер (максимум 5MB)
    const imageSize = Buffer.from(base64Data, 'base64').length;
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageSize > maxSize) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Размер изображения превышает 5MB',
        },
      });
    }

    // Создаем директорию для загрузок, если её нет
    const uploadsDir = path.join(__dirname, '../../uploads/chat');
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    // Генерируем уникальное имя файла
    const fileName = `${uuidv4()}.${imageType}`;
    const filePath = path.join(uploadsDir, fileName);

    // Сохраняем файл
    await fs.writeFile(filePath, base64Data, 'base64');

    // Возвращаем URL (в production это должен быть полный URL)
    const imageUrl = `/uploads/chat/${fileName}`;

    successResponse(
      res,
      {
        imageUrl,
        fileName,
        size: imageSize,
      },
      201
    );
  } catch (error) {
    console.error('🔴 [UPLOAD] Ошибка загрузки изображения:', error);
    next(error);
  }
}



