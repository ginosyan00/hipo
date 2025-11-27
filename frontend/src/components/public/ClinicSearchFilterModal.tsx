import React, { useState, useEffect } from 'react';
import { Modal, Button } from '../common';
import searchIcon from '../../assets/icons/search.svg';

interface ClinicSearchFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: ClinicFilters) => void;
  onReset: () => void;
  initialFilters?: ClinicFilters;
  doctors?: Array<{ id: string; name: string; specialization?: string }>;
}

export interface ClinicFilters {
  doctor: string;
  status: string;
  date: string;
  time: string;
  week: string;
  category: string;
  searchText: string;
}

/**
 * ClinicSearchFilterModal
 * Модальное окно фильтров поиска для страницы клиники
 * Стиль как на изображении Kanban board
 */
export const ClinicSearchFilterModal: React.FC<ClinicSearchFilterModalProps> = ({
  isOpen,
  onClose,
  onApply,
  onReset,
  initialFilters,
  doctors = [],
}) => {
  const [filters, setFilters] = useState<ClinicFilters>(
    initialFilters || {
      doctor: '',
      status: '',
      date: '',
      time: '',
      week: '',
      category: '',
      searchText: '',
    }
  );

  // Обновляем фильтры при изменении initialFilters
  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);

  const handleFilterChange = (key: keyof ClinicFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    
    // Очищаем фильтр по неделе при выборе даты
    if (key === 'date' && value) {
      setFilters(prev => ({ ...prev, week: '' }));
    }
    
    // Очищаем фильтр по дате при выборе недели
    if (key === 'week' && value) {
      setFilters(prev => ({ ...prev, date: '' }));
    }
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const emptyFilters: ClinicFilters = {
      doctor: '',
      status: '',
      date: '',
      time: '',
      week: '',
      category: '',
      searchText: '',
    };
    setFilters(emptyFilters);
    onReset();
  };

  const hasActiveFilters = 
    filters.doctor || 
    filters.status || 
    filters.date || 
    filters.time || 
    filters.week || 
    filters.category || 
    filters.searchText;

  // Debug log
  useEffect(() => {
    if (isOpen) {
      console.log('🔍 [CLINIC FILTER MODAL] Modal opened with filters:', filters);
    }
  }, [isOpen, filters]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        console.log('🔍 [CLINIC FILTER MODAL] Modal closing');
        onClose();
      }}
      size="lg"
    >
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <img src={searchIcon} alt="Search" className="w-5 h-5 text-text-10" />
          </div>
          <input
            type="text"
            value={filters.searchText}
            onChange={e => handleFilterChange('searchText', e.target.value)}
            placeholder="All X + search"
            className="w-full pl-12 pr-4 py-3 border border-stroke rounded-sm bg-bg-white text-sm text-text-100 placeholder-text-10 focus:outline-none focus:border-main-100 transition-smooth"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 border-b border-stroke pb-4">
          <button
            onClick={() => handleFilterChange('status', '')}
            className={`px-4 py-2 text-sm font-normal rounded-sm transition-smooth ${
              filters.status === ''
                ? 'bg-main-100 text-white'
                : 'bg-bg-white text-text-50 hover:bg-bg-primary'
            }`}
          >
            Все
          </button>
          <button
            onClick={() => handleFilterChange('status', 'active')}
            className={`px-4 py-2 text-sm font-normal rounded-sm transition-smooth ${
              filters.status === 'active'
                ? 'bg-main-100 text-white'
                : 'bg-bg-white text-text-50 hover:bg-bg-primary'
            }`}
          >
            В работе
          </button>
          <button
            onClick={() => handleFilterChange('status', 'closed')}
            className={`px-4 py-2 text-sm font-normal rounded-sm transition-smooth ${
              filters.status === 'closed'
                ? 'bg-main-100 text-white'
                : 'bg-bg-white text-text-50 hover:bg-bg-primary'
            }`}
          >
            Закрытые
          </button>
        </div>

        {/* Save Filter Button */}
        <div className="pt-2">
          <button className="text-sm font-normal text-main-100 hover:text-main-100/80 transition-smooth flex items-center gap-1">
            <span>+</span>
            <span>Сохранить фильтр</span>
          </button>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Врач */}
          <div>
            <label className="block text-sm font-normal text-text-10 mb-2">Врач</label>
            <select
              value={filters.doctor}
              onChange={e => handleFilterChange('doctor', e.target.value)}
              className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm text-text-100 focus:outline-none focus:border-main-100 transition-smooth"
            >
              <option value="">Все врачи</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} {doctor.specialization ? `(${doctor.specialization})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Статус */}
          <div>
            <label className="block text-sm font-normal text-text-10 mb-2">Статус</label>
            <select
              value={filters.status}
              onChange={e => handleFilterChange('status', e.target.value)}
              className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm text-text-100 focus:outline-none focus:border-main-100 transition-smooth"
            >
              <option value="">Все статусы</option>
              <option value="active">Активен</option>
              <option value="available">Доступен</option>
              <option value="busy">Занят</option>
            </select>
          </div>

          {/* Дата */}
          <div>
            <label className="block text-sm font-normal text-text-10 mb-2">Дата</label>
            <input
              type="date"
              value={filters.date}
              onChange={e => handleFilterChange('date', e.target.value)}
              className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm text-text-100 focus:outline-none focus:border-main-100 transition-smooth"
            />
          </div>

          {/* Время */}
          <div>
            <label className="block text-sm font-normal text-text-10 mb-2">Время</label>
            <input
              type="time"
              value={filters.time}
              onChange={e => handleFilterChange('time', e.target.value)}
              className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm text-text-100 focus:outline-none focus:border-main-100 transition-smooth"
            />
          </div>

          {/* Неделя */}
          <div>
            <label className="block text-sm font-normal text-text-10 mb-2">Неделя</label>
            <input
              type="week"
              value={filters.week}
              onChange={e => handleFilterChange('week', e.target.value)}
              className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm text-text-100 focus:outline-none focus:border-main-100 transition-smooth"
            />
          </div>

          {/* Категория */}
          <div>
            <label className="block text-sm font-normal text-text-10 mb-2">Категория</label>
            <input
              type="text"
              value={filters.category}
              onChange={e => handleFilterChange('category', e.target.value)}
              placeholder="Специализация..."
              className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm text-text-100 placeholder-text-10 focus:outline-none focus:border-main-100 transition-smooth"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-stroke">
          <Button
            variant="secondary"
            onClick={handleReset}
            disabled={!hasActiveFilters}
            className="text-sm font-normal"
          >
            Сбросить
          </Button>
          <Button
            variant="primary"
            onClick={handleApply}
            className="text-sm font-normal bg-main-100 text-white hover:bg-main-100/90 flex items-center gap-2"
          >
            <img src={searchIcon} alt="Search" className="w-4 h-4" />
            Поиск
          </Button>
        </div>
      </div>
    </Modal>
  );
};

