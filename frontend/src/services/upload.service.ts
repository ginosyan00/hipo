import api from './api';
import { ApiResponse } from '../types/api.types';

/**
 * Upload Service
 * Загрузка файлов (изображений) для чата
 */

export interface UploadImageResponse {
  imageUrl: string;
  fileName: string;
  size: number;
}

export const uploadService = {
  /**
   * Загрузить изображение (base64)
   */
  async uploadImage(imageBase64: string): Promise<UploadImageResponse> {
    const { data } = await api.post<ApiResponse<UploadImageResponse>>('/upload/image', {
      image: imageBase64,
    });
    return data.data;
  },

  /**
   * Конвертировать File в base64
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  },
};



