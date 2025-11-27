import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useDoctors } from '../../hooks/useUsers';
import { useAuthStore } from '../../store/useAuthStore';
import searchIcon from '../../assets/icons/search.svg';

/**
 * SearchFilterModal Component
 * Модальное окно с фильтрами поиска для приёмов
 * Открывается при клике на search input в Header
 */
interface SearchFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FilterState {
  doctor: string;
  status: string;
  date: string;
  time: string;
  week: string;
  category: string;
}

export const SearchFilterModal: React.FC<SearchFilterModalProps> = ({ isOpen, onClose }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const isDoctor = user?.role === 'DOCTOR';
  
  // Проверяем, находимся ли мы на странице Appointments
  const isOnAppointmentsPage = location.pathname === '/dashboard/appointments';

  // Загружаем список врачей для фильтра
  const { data: doctors = [] } = useDoctors();

  // Инициализация фильтров из URL параметров
  const [filters, setFilters] = useState<FilterState>({
    doctor: searchParams.get('doctor') || '',
    status: searchParams.get('status') || '',
    date: searchParams.get('date') || '',
    time: searchParams.get('time') || '',
    week: searchParams.get('week') || '',
    category: searchParams.get('category') || '',
  });

  // Синхронизируем фильтры с URL параметрами при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      setFilters({
        doctor: searchParams.get('doctor') || '',
        status: searchParams.get('status') || '',
        date: searchParams.get('date') || '',
        time: searchParams.get('time') || '',
        week: searchParams.get('week') || '',
        category: searchParams.get('category') || '',
      });
    }
  }, [isOpen, searchParams]);

  /**
   * Обновление фильтра
   */
  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  /**
   * Применить фильтры - обновляем URL и переходим на страницу Appointments
   */
  const handleApply = () => {
    const params = new URLSearchParams();
    
    // Добавляем только непустые фильтры
    if (filters.doctor && !isDoctor) params.set('doctor', filters.doctor);
    if (filters.status) params.set('status', filters.status);
    if (filters.date) params.set('date', filters.date);
    if (filters.time) params.set('time', filters.time);
    if (filters.week) params.set('week', filters.week);
    if (filters.category) params.set('category', filters.category);

    // Если мы уже на странице Appointments, обновляем URL params напрямую
    if (isOnAppointmentsPage) {
      setSearchParams(params, { replace: true });
    } else {
      // Иначе переходим на страницу Appointments с фильтрами
      navigate(`/dashboard/appointments?${params.toString()}`);
    }
    onClose();
  };

  /**
   * Сбросить все фильтры
   */
  const handleReset = () => {
    setFilters({
      doctor: '',
      status: '',
      date: '',
      time: '',
      week: '',
      category: '',
    });
    
    // Если мы уже на странице Appointments, очищаем URL params
    if (isOnAppointmentsPage) {
      setSearchParams({}, { replace: true });
    } else {
      // Иначе переходим на страницу Appointments без фильтров
      navigate('/dashboard/appointments');
    }
    onClose();
  };

  /**
   * Форматирование недели для отображения
   */
  const formatWeekDisplay = (weekValue: string): string => {
    if (!weekValue) return 'Week --, ----';
    
    try {
      // weekValue в формате "YYYY-WW"
      const [year, weekNum] = weekValue.split('-W').map(Number);
      return `Week ${weekNum}, ${year}`;
    } catch {
      return 'Week --, ----';
    }
  };

  /**
   * Получить текущую неделю в формате "YYYY-WW"
   */
  const getCurrentWeek = (): string => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    const weekNum = Math.ceil((days + start.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
  };

  // Закрытие по ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
        <div
          className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-stroke">
              <h2 className="text-xl font-semibold text-text-100">Фильтры поиска</h2>
              <button
                onClick={onClose}
                className="text-text-50 hover:text-text-100 transition-colors p-1 rounded-sm hover:bg-bg-primary"
                aria-label="Закрыть"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Filters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {/* Врач */}
              {!isDoctor && (
                <div>
                  <label className="block text-sm font-normal text-text-10 mb-2">Врач</label>
                  <select
                    value={filters.doctor}
                    onChange={(e) => updateFilter('doctor', e.target.value)}
                    className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm text-text-100 focus:outline-none focus:border-main-100 transition-smooth"
                  >
                    <option value="">Все врачи</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name} {doctor.specialization ? `(${doctor.specialization})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Статус */}
              <div>
                <label className="block text-sm font-normal text-text-10 mb-2">Статус</label>
                <select
                  value={filters.status}
                  onChange={(e) => updateFilter('status', e.target.value)}
                  className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm text-text-100 focus:outline-none focus:border-main-100 transition-smooth"
                >
                  <option value="">Все статусы</option>
                  <option value="pending">Ожидает подтверждения</option>
                  <option value="confirmed">Подтвержден</option>
                  <option value="completed">Завершен</option>
                  <option value="cancelled">Отменен</option>
                </select>
              </div>

              {/* Дата */}
              <div>
                <label className="block text-sm font-normal text-text-10 mb-2">Дата</label>
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) => {
                    updateFilter('date', e.target.value);
                    // Очищаем неделю при выборе даты
                    if (e.target.value) updateFilter('week', '');
                  }}
                  className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm text-text-100 focus:outline-none focus:border-main-100 transition-smooth"
                />
              </div>

              {/* Время */}
              <div>
                <label className="block text-sm font-normal text-text-10 mb-2">Время</label>
                <input
                  type="time"
                  value={filters.time}
                  onChange={(e) => updateFilter('time', e.target.value)}
                  className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm text-text-100 focus:outline-none focus:border-main-100 transition-smooth"
                />
              </div>

              {/* Неделя */}
              <div>
                <label className="block text-sm font-normal text-text-10 mb-2">Неделя</label>
                <input
                  type="week"
                  value={filters.week}
                  onChange={(e) => {
                    updateFilter('week', e.target.value);
                    // Очищаем дату при выборе недели
                    if (e.target.value) updateFilter('date', '');
                  }}
                  className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm text-text-100 focus:outline-none focus:border-main-100 transition-smooth"
                />
              </div>

              {/* Категория */}
              <div>
                <label className="block text-sm font-normal text-text-10 mb-2">Категория</label>
                <input
                  type="text"
                  value={filters.category}
                  onChange={(e) => updateFilter('category', e.target.value)}
                  placeholder="Процедура..."
                  className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm text-text-100 placeholder-text-10 focus:outline-none focus:border-main-100 transition-smooth"
                />
              </div>
            </div>

            {/* Active Filters Tags */}
            {(filters.doctor || filters.status || filters.date || filters.time || filters.week || filters.category) && (
              <div className="mb-6 pt-4 border-t border-stroke">
                <p className="text-sm font-medium text-text-100 mb-3">Активные фильтры:</p>
                <div className="flex flex-wrap gap-2">
                  {filters.doctor && !isDoctor && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-main-10 text-main-100 rounded-sm text-xs">
                      {doctors.find(d => d.id === filters.doctor)?.name || 'Врач'}
                      <button
                        onClick={() => updateFilter('doctor', '')}
                        className="hover:text-main-200"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.status && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-main-10 text-main-100 rounded-sm text-xs">
                      {filters.status === 'pending' && 'Ожидает'}
                      {filters.status === 'confirmed' && 'Подтвержден'}
                      {filters.status === 'completed' && 'Завершен'}
                      {filters.status === 'cancelled' && 'Отменен'}
                      <button
                        onClick={() => updateFilter('status', '')}
                        className="hover:text-main-200"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.date && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-main-10 text-main-100 rounded-sm text-xs">
                      {new Date(filters.date).toLocaleDateString('ru-RU')}
                      <button
                        onClick={() => updateFilter('date', '')}
                        className="hover:text-main-200"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.time && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-main-10 text-main-100 rounded-sm text-xs">
                      {filters.time}
                      <button
                        onClick={() => updateFilter('time', '')}
                        className="hover:text-main-200"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.week && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-main-10 text-main-100 rounded-sm text-xs">
                      {formatWeekDisplay(filters.week)}
                      <button
                        onClick={() => updateFilter('week', '')}
                        className="hover:text-main-200"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.category && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-main-10 text-main-100 rounded-sm text-xs">
                      {filters.category}
                      <button
                        onClick={() => updateFilter('category', '')}
                        className="hover:text-main-200"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-stroke">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-normal text-text-50 hover:text-text-100 transition-colors rounded-sm hover:bg-bg-primary"
              >
                Сбросить
              </button>
              <button
                onClick={handleApply}
                className="flex items-center gap-2 px-6 py-2.5 bg-main-100 text-white rounded-sm text-sm font-medium hover:bg-main-200 transition-colors shadow-sm"
              >
                <img src={searchIcon} alt="Search" className="w-4 h-4" />
                Поиск
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

