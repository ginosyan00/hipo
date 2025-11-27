import React, { useState, useEffect, useRef } from 'react';
import { usePatients } from '../../hooks/usePatients';
import { Patient } from '../../types/api.types';
import { Spinner } from '../common';
import { PatientDetailsModal } from './PatientDetailsModal';
import searchIcon from '../../assets/icons/search.svg';

interface PatientSearchInputProps {
  value: string; // ID выбранного пациента
  onChange: (patientId: string) => void;
  onPatientSelect?: (patient: Patient) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
}

/**
 * PatientSearchInput Component
 * Компонент поиска пациентов с автодополнением
 */
export const PatientSearchInput: React.FC<PatientSearchInputProps> = ({
  value,
  onChange,
  onPatientSelect,
  required = false,
  disabled = false,
  placeholder = 'Поиск пациента по имени...',
  error: errorMessage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientForDetails, setPatientForDetails] = useState<Patient | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce для поиска
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300); // 300ms задержка

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Загружаем пациентов с поиском
  // Если поиск пустой, загружаем всех пациентов (для показа при открытии)
  const searchParam = debouncedSearch.trim() || undefined;
  const { data: patientsData, isLoading, error, refetch } = usePatients({
    search: searchParam,
    limit: 100, // Увеличиваем лимит для показа всех пациентов
  });

  // Backend возвращает { patients: [...], meta: {...} }, а не { data: [...], meta: {...} }
  const patients = patientsData?.patients || patientsData?.data || [];

  // При фокусе на поле, если нет данных, загружаем всех пациентов
  useEffect(() => {
    if (isOpen && !isLoading && patients.length === 0 && !searchParam) {
      console.log('🔵 [PATIENT SEARCH] Загружаем всех пациентов при открытии...');
      refetch();
    }
  }, [isOpen, isLoading, patients.length, searchParam, refetch]);

  // Логирование для отладки
  useEffect(() => {
    console.log('🔵 [PATIENT SEARCH] Состояние поиска:', {
      searchQuery,
      debouncedSearch,
      searchParam: searchParam || '(все пациенты)',
      isLoading,
      error: error ? (error as any).message : null,
      totalPatients: patients.length,
      patients: patients.slice(0, 5).map((p: Patient) => ({ id: p.id, name: p.name, phone: p.phone })),
      isOpen,
    });
  }, [searchQuery, debouncedSearch, searchParam, isLoading, error, patients, isOpen]);

  // Синхронизация с внешним значением value
  useEffect(() => {
    if (value) {
      // Если есть value, ищем пациента в текущем списке
      const patient = patients.find((p: Patient) => p.id === value);
      if (patient && selectedPatient?.id !== patient.id) {
        setSelectedPatient(patient);
        setSearchQuery(patient.name);
      }
    } else {
      // Если value пустой, сбрасываем выбор
      if (selectedPatient) {
        setSelectedPatient(null);
        setSearchQuery('');
      }
    }
  }, [value, patients]);

  // Обработка клика вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Если пациент не выбран, очищаем поле поиска
        if (!selectedPatient) {
          setSearchQuery('');
        } else {
          setSearchQuery(selectedPatient.name);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedPatient]);

  // Обработка клика на пациента - показываем детали для подтверждения
  const handlePatientClick = (patient: Patient) => {
    setPatientForDetails(patient);
    setIsDetailsModalOpen(true);
    setIsOpen(false);
  };

  // Подтверждение выбора пациента после просмотра деталей
  const handleConfirmPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchQuery(patient.name);
    onChange(patient.id);
    if (onPatientSelect) {
      onPatientSelect(patient);
    }
    setPatientForDetails(null);
  };

  // Отмена выбора
  const handleCancelSelection = () => {
    setPatientForDetails(null);
    // Открываем список снова, если был поиск
    if (searchQuery.trim()) {
      setIsOpen(true);
    }
  };

  // Обработка изменения текста поиска
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Если поле очищено, сбрасываем выбор
    if (!query.trim()) {
      setSelectedPatient(null);
      onChange('');
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  };

  // Обработка фокуса
  const handleFocus = () => {
    // Открываем список при фокусе
    setIsOpen(true);
    // Если поле пустое и нет загруженных пациентов, сбрасываем debounced search
    // чтобы загрузить всех пациентов
    if (!searchQuery.trim() && patients.length === 0) {
      setDebouncedSearch(''); // Сбрасываем для загрузки всех
    }
  };

  // Обработка клавиатуры
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const inputStyles = errorMessage
    ? 'border-red-500 focus:border-red-500'
    : 'border-stroke focus:border-main-100';

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <img 
          src={searchIcon} 
          alt="Search" 
          className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            block w-full pl-11 pr-4 py-2.5
            border rounded-sm 
            bg-bg-white
            text-sm font-normal
            placeholder-text-10
            focus:outline-none 
            transition-smooth
            disabled:bg-bg-primary disabled:cursor-not-allowed
            ${inputStyles}
          `}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Spinner size="sm" />
          </div>
        )}
      </div>

      {/* Выпадающий список результатов */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-bg-white border border-stroke rounded-sm shadow-lg max-h-60 overflow-y-auto">
          {isLoading && patients.length === 0 ? (
            <div className="flex items-center justify-center py-4">
              <Spinner size="sm" />
              <span className="ml-2 text-xs text-text-10">Загрузка пациентов...</span>
            </div>
          ) : patients.length === 0 ? (
            <div className="px-4 py-3 text-sm text-text-10 text-center">
              {debouncedSearch ? (
                <>
                  <div>Пациенты не найдены</div>
                  <div className="text-xs mt-1">Попробуйте другой запрос</div>
                </>
              ) : (
                <>
                  <div>Начните вводить имя пациента...</div>
                  <div className="text-xs mt-1">Или кликните для просмотра всех пациентов</div>
                </>
              )}
            </div>
          ) : (
            <div className="py-1">
              {patients.map((patient: Patient) => {
                // Формируем URL для avatar
                const getAvatarUrl = (avatarPath: string | undefined) => {
                  if (!avatarPath) return null;
                  if (avatarPath.startsWith('http')) return avatarPath;
                  
                  // Получаем base URL для API
                  const getApiBaseURL = () => {
                    if (import.meta.env.VITE_API_URL) {
                      return import.meta.env.VITE_API_URL.replace('/api/v1', '');
                    }
                    const host = window.location.hostname;
                    const protocol = window.location.protocol;
                    if (host === 'localhost' || host === '127.0.0.1') {
                      return 'http://localhost:5000';
                    }
                    return `http://${host}:5000`;
                  };
                  
                  const baseURL = getApiBaseURL();
                  return `${baseURL}/uploads/${avatarPath}`;
                };
                
                const avatarUrl = getAvatarUrl(patient.avatar);
                
                // Получаем инициалы для fallback
                const getInitials = (name: string) => {
                  const parts = name.trim().split(' ');
                  if (parts.length >= 2) {
                    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
                  }
                  return name.substring(0, 2).toUpperCase();
                };

                return (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => handlePatientClick(patient)}
                    className={`
                      w-full text-left px-4 py-3 text-sm
                      hover:bg-bg-primary transition-smooth
                      flex items-center gap-3
                      ${selectedPatient?.id === patient.id ? 'bg-main-10 text-main-100' : 'text-text-50'}
                    `}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={patient.name}
                          className="w-10 h-10 rounded-full object-cover border border-stroke"
                          onError={(e) => {
                            // Fallback на инициалы если изображение не загрузилось
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-10 h-10 rounded-full bg-main-100 text-white flex items-center justify-center text-xs font-medium border border-stroke">
                                  ${getInitials(patient.name)}
                                </div>
                              `;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-main-100 text-white flex items-center justify-center text-xs font-medium border border-stroke">
                          {getInitials(patient.name)}
                        </div>
                      )}
                    </div>

                    {/* Patient Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-text-100 truncate">{patient.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {patient.phone && (
                          <div className="text-xs text-text-10 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="truncate">{patient.phone}</span>
                          </div>
                        )}
                        {patient.email && (
                          <div className="text-xs text-text-10 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="truncate">{patient.email}</span>
                          </div>
                        )}
                      </div>
                      {patient.status && (
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                            patient.status === 'registered' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {patient.status === 'registered' ? 'Зарегистрирован' : 'Гость'}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {errorMessage && <p className="mt-1.5 text-xs text-red-600">{errorMessage}</p>}

      {/* Patient Details Modal */}
      <PatientDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setPatientForDetails(null);
          handleCancelSelection();
        }}
        patient={patientForDetails}
        onConfirm={handleConfirmPatient}
        onCancel={handleCancelSelection}
      />
    </div>
  );
};

