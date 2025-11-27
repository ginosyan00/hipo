import React from 'react';
import { Modal } from '../common';
import { Patient } from '../../types/api.types';
import { format } from 'date-fns';

interface PatientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onConfirm: (patient: Patient) => void;
  onCancel?: () => void;
}

/**
 * PatientDetailsModal Component
 * Модальное окно для просмотра детальной информации о пациенте
 * Используется для подтверждения выбора пациента перед регистрацией
 */
export const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({
  isOpen,
  onClose,
  patient,
  onConfirm,
  onCancel,
}) => {
  if (!patient) return null;

  // Формируем URL для avatar
  const getAvatarUrl = (avatarPath: string | undefined) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    
    const getApiBaseURL = () => {
      if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL.replace('/api/v1', '');
      }
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://localhost:5000';
      }
      return `http://${host}:5000`;
    };
    
    const baseURL = getApiBaseURL();
    return `${baseURL}/uploads/${avatarPath}`;
  };

  const avatarUrl = getAvatarUrl(patient.avatar);
  
  // State for handling image load errors
  const [imageError, setImageError] = React.useState(false);
  
  // Reset image error when patient changes
  React.useEffect(() => {
    setImageError(false);
  }, [patient.id]);

  // Получаем инициалы для fallback
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Форматируем дату рождения
  const formatDateOfBirth = (date: Date | string | undefined) => {
    if (!date) return 'Не указано';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'dd.MM.yyyy');
    } catch {
      return 'Не указано';
    }
  };

  // Вычисляем возраст
  const calculateAge = (dateOfBirth: Date | string | undefined) => {
    if (!dateOfBirth) return null;
    try {
      const birthDate = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch {
      return null;
    }
  };

  const age = calculateAge(patient.dateOfBirth);
  const genderLabels: Record<string, string> = {
    male: 'Мужской',
    female: 'Женский',
    other: 'Другой',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Информация о пациенте" size="md">
      <div className="space-y-6">
        {/* Avatar and Name - Prominently displayed for identity confirmation */}
        <div className="flex flex-col items-center pb-6 border-b border-stroke bg-bg-primary/30 -mx-5 px-5 pt-6 mb-6">
          <div className="mb-4 relative">
            {avatarUrl && !imageError ? (
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt={`${patient.name} - фото профиля`}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  onError={() => {
                    setImageError(true);
                  }}
                  onLoad={() => {
                    setImageError(false);
                  }}
                />
                {/* Badge indicating photo is available and loaded */}
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5 border-2 border-white shadow-md">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-main-100 text-white flex items-center justify-center text-3xl font-medium border-4 border-white shadow-lg">
                  {getInitials(patient.name)}
                </div>
                {/* Badge indicating no photo available */}
                <div className="absolute -bottom-1 -right-1 bg-gray-400 rounded-full p-1.5 border-2 border-white shadow-md">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
          <h3 className="text-2xl font-semibold text-text-100 mb-2">{patient.name}</h3>
          {patient.status && (
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
              patient.status === 'registered' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {patient.status === 'registered' ? 'Зарегистрированный пациент' : 'Гость'}
            </span>
          )}
          {avatarUrl && (
            <p className="text-xs text-text-10 mt-3 text-center">
              <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Фото профиля доступно для подтверждения
            </p>
          )}
        </div>

        {/* Patient Details */}
        <div className="space-y-4">
          {/* Phone */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-main-10 flex items-center justify-center">
              <svg className="w-4 h-4 text-main-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-xs text-text-10 mb-0.5">Телефон</div>
              <div className="text-sm font-medium text-text-100">{patient.phone || 'Не указано'}</div>
            </div>
          </div>

          {/* Email */}
          {patient.email && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-main-10 flex items-center justify-center">
                <svg className="w-4 h-4 text-main-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-xs text-text-10 mb-0.5">Email</div>
                <div className="text-sm font-medium text-text-100">{patient.email}</div>
              </div>
            </div>
          )}

          {/* Date of Birth */}
          {patient.dateOfBirth && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-main-10 flex items-center justify-center">
                <svg className="w-4 h-4 text-main-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-xs text-text-10 mb-0.5">Дата рождения</div>
                <div className="text-sm font-medium text-text-100">
                  {formatDateOfBirth(patient.dateOfBirth)}
                  {age !== null && ` (${age} ${age === 1 ? 'год' : age < 5 ? 'года' : 'лет'})`}
                </div>
              </div>
            </div>
          )}

          {/* Gender */}
          {patient.gender && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-main-10 flex items-center justify-center">
                <svg className="w-4 h-4 text-main-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-xs text-text-10 mb-0.5">Пол</div>
                <div className="text-sm font-medium text-text-100">
                  {genderLabels[patient.gender] || patient.gender}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {patient.notes && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-main-10 flex items-center justify-center">
                <svg className="w-4 h-4 text-main-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-xs text-text-10 mb-0.5">Заметки</div>
                <div className="text-sm text-text-50">{patient.notes}</div>
              </div>
            </div>
          )}

          {/* Registration Date */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-main-10 flex items-center justify-center">
              <svg className="w-4 h-4 text-main-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-xs text-text-10 mb-0.5">Дата регистрации</div>
              <div className="text-sm font-medium text-text-100">
                {format(new Date(patient.createdAt), 'dd.MM.yyyy HH:mm')}
              </div>
            </div>
          </div>
        </div>

        {/* Warning Message */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-sm p-3">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-xs text-yellow-800">
              <strong>Проверьте данные:</strong> Убедитесь, что это правильный пациент перед подтверждением выбора.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-stroke">
          <button
            type="button"
            onClick={() => {
              if (onCancel) {
                onCancel();
              }
              onClose();
            }}
            className="px-4 py-2 text-sm font-normal text-text-50 bg-bg-white border border-stroke rounded-sm hover:bg-bg-primary transition-smooth"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(patient);
              onClose();
            }}
            className="px-4 py-2 text-sm font-normal text-white bg-main-100 rounded-sm hover:bg-main-100/90 transition-smooth"
          >
            Подтвердить выбор
          </button>
        </div>
      </div>
    </Modal>
  );
};

