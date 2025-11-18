import React, { useState, useRef } from 'react';
import { Button } from '../common/Button';

interface LogoUploadProps {
  currentLogo?: string | null;
  onUpload: (logo: string) => Promise<void>;
  isLoading?: boolean;
}

/**
 * LogoUpload Component
 * Компонент для загрузки логотипа клиники
 */
export const LogoUpload: React.FC<LogoUploadProps> = ({ currentLogo, onUpload, isLoading = false }) => {
  const [preview, setPreview] = useState<string | null>(currentLogo || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      setError('Пожалуйста, выберите изображение');
      return;
    }

    // Проверка размера (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Размер файла не должен превышать 5MB');
      return;
    }

    setError(null);

    // Читаем файл как base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreview(base64String);
    };
    reader.onerror = () => {
      setError('Ошибка при чтении файла');
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview) {
      setError('Пожалуйста, выберите изображение');
      return;
    }

    try {
      await onUpload(preview);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке логотипа');
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-6">
        {/* Preview */}
        <div className="flex-shrink-0">
          <div className="w-32 h-32 border-2 border-stroke rounded-lg overflow-hidden bg-bg-primary flex items-center justify-center">
            {preview ? (
              <img src={preview} alt="Logo preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-text-10 text-sm text-center p-4">
                <svg
                  className="w-12 h-12 mx-auto mb-2 text-text-20"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-xs">Нет логотипа</p>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-3">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="logo-upload"
            />
            <label
              htmlFor="logo-upload"
              className="inline-block cursor-pointer"
            >
              <Button variant="secondary" size="md" as="span">
                Выбрать файл
              </Button>
            </label>
            <p className="text-xs text-text-10 mt-2">
              Форматы: JPG, PNG, GIF. Максимальный размер: 5MB
            </p>
          </div>

          {preview && (
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="md"
                onClick={handleUpload}
                isLoading={isLoading}
                disabled={isLoading}
              >
                Загрузить
              </Button>
              <Button variant="secondary" size="md" onClick={handleRemove} disabled={isLoading}>
                Удалить
              </Button>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

