import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { NewDashboardLayout } from '../../components/dashboard/NewDashboardLayout';
import { Button, Card, Spinner } from '../../components/common';
import { AppointmentsListView } from '../../components/dashboard/AppointmentsListView';
import { AppointmentsMonthlyCalendar } from '../../components/dashboard/AppointmentsMonthlyCalendar';
import { AppointmentsWeeklyView } from '../../components/dashboard/AppointmentsWeeklyView';
import { CreateAppointmentModal } from '../../components/dashboard/CreateAppointmentModal';
import { CompleteAppointmentModal } from '../../components/dashboard/CompleteAppointmentModal';
import { CancelAppointmentModal } from '../../components/dashboard/CancelAppointmentModal';
import { EditAmountModal } from '../../components/dashboard/EditAmountModal';
import { useAppointments, useUpdateAppointmentStatus, useUpdateAppointment } from '../../hooks/useAppointments';
import { userService } from '../../services/user.service';
import { useAuthStore } from '../../store/useAuthStore';
import { User, Appointment } from '../../types/api.types';
import { format } from 'date-fns';

/**
 * Appointments Page - Figma Design
 * Управление приёмами в новом стиле
 * Улучшенная версия с фильтрами, статистикой и детальной информацией
 * Фильтры сохраняются в URL параметрах для сохранения состояния при обновлении страницы
 */
export const AppointmentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore(state => state.user);
  const isDoctor = user?.role === 'DOCTOR';
  
  // Инициализация фильтров из URL параметров
  // Для врачей фильтр по врачу устанавливается автоматически и не может быть изменен
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
  const [dateFilter, setDateFilter] = useState<string>(searchParams.get('date') || '');
  const [doctorFilter, setDoctorFilter] = useState<string>(searchParams.get('doctor') || '');
  const [timeFilter, setTimeFilter] = useState<string>(searchParams.get('time') || '');
  const [weekFilter, setWeekFilter] = useState<string>(searchParams.get('week') || '');
  const [categoryFilter, setCategoryFilter] = useState<string>(searchParams.get('category') || '');
  const [categoryInput, setCategoryInput] = useState<string>(searchParams.get('category') || ''); // Для debounce
  
  // Вид отображения (list/monthly/weekly) - только для CLINIC
  const isClinic = user?.role === 'CLINIC' || user?.role === 'ADMIN';
  
  // Загружаем сохраненный вид из localStorage при инициализации
  const [viewType, setViewType] = useState<'list' | 'monthly' | 'weekly'>(() => {
    try {
      const saved = localStorage.getItem('appointmentsViewType');
      if (saved && ['list', 'monthly', 'weekly'].includes(saved)) {
        return saved as 'list' | 'monthly' | 'weekly';
      }
    } catch (error) {
      console.error('Ошибка загрузки вида из localStorage:', error);
    }
    return 'list';
  });
  
  // Для list вида - переключение между table и cards
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(() => {
    try {
      const saved = localStorage.getItem('appointmentsViewMode');
      if (saved && ['table', 'cards'].includes(saved)) {
        return saved as 'table' | 'cards';
      }
    } catch (error) {
      console.error('Ошибка загрузки режима из localStorage:', error);
    }
    return 'table';
  });
  
  // Сохраняем выбранный вид в localStorage при изменении
  useEffect(() => {
    try {
      if (isClinic) {
        localStorage.setItem('appointmentsViewType', viewType);
      }
    } catch (error) {
      console.error('Ошибка сохранения вида в localStorage:', error);
    }
  }, [viewType, isClinic]);
  
  useEffect(() => {
    try {
      localStorage.setItem('appointmentsViewMode', viewMode);
    } catch (error) {
      console.error('Ошибка сохранения режима в localStorage:', error);
    }
  }, [viewMode]);
  
  // Функция для установки вида с автоматическим сохранением
  const handleViewTypeChange = (newViewType: 'list' | 'monthly' | 'weekly') => {
    setViewType(newViewType);
    if (newViewType === 'list') {
      // При переключении на список, сохраняем режим таблицы
      setViewMode('table');
    }
  };
  
  // Модальное окно создания приёма
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalDefaultDate, setCreateModalDefaultDate] = useState<string | undefined>(undefined);
  
  // Модальное окно завершения приёма
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedAppointmentForComplete, setSelectedAppointmentForComplete] = useState<Appointment | null>(null);
  
  // Модальное окно отмены приёма
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedAppointmentForCancel, setSelectedAppointmentForCancel] = useState<Appointment | null>(null);
  
  // Модальное окно редактирования суммы
  const [isEditAmountModalOpen, setIsEditAmountModalOpen] = useState(false);
  const [selectedAppointmentForEdit, setSelectedAppointmentForEdit] = useState<Appointment | null>(null);
  
  const [doctors, setDoctors] = useState<User[]>([]);
  const [isDoctorsLoading, setIsDoctorsLoading] = useState(true);
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});
  const [loadingAppointments, setLoadingAppointments] = useState<Record<string, string>>({});
  
  // Флаг для отслеживания первой инициализации
  const isInitialMount = useRef(true);

  // Загрузка списка врачей для фильтра
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setIsDoctorsLoading(true);
        const doctorsList = await userService.getDoctors();
        setDoctors(doctorsList);
      } catch (err) {
        console.error('Ошибка загрузки врачей:', err);
      } finally {
        setIsDoctorsLoading(false);
      }
    };
    loadDoctors();
  }, []);

  // Debounce для поля категории - обновляем фильтр только после 500ms паузы в вводе
  useEffect(() => {
    const timer = setTimeout(() => {
      setCategoryFilter(categoryInput);
    }, 500); // 500ms задержка

    return () => {
      clearTimeout(timer);
    };
  }, [categoryInput]);

  // Синхронизация фильтров с URL параметрами
  // Обновляем URL только когда фильтры изменяются пользователем (не при первой загрузке)
  useEffect(() => {
    // Пропускаем обновление URL при первой загрузке (фильтры уже инициализированы из URL)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (dateFilter) params.set('date', dateFilter);
    if (doctorFilter) params.set('doctor', doctorFilter);
    if (timeFilter) params.set('time', timeFilter);
    if (weekFilter) params.set('week', weekFilter);
    if (categoryFilter) params.set('category', categoryFilter);
    
    // Обновляем URL без перезагрузки страницы
    setSearchParams(params, { replace: true });
  }, [statusFilter, dateFilter, doctorFilter, timeFilter, weekFilter, categoryFilter, setSearchParams]);

  // По умолчанию исключаем завершенные приёмы (completed) из раздела Appointments
  // Они должны отображаться только в разделе Patients
  // Но если выбран фильтр "Все статусы" (пустая строка), показываем все приёмы
  // Для врачей автоматически устанавливаем doctorId = user.id (врачи видят только свои назначения)
  const { data, isLoading, isFetching, error } = useAppointments({
    status: statusFilter && statusFilter.trim() !== '' ? statusFilter : undefined,
    date: dateFilter || undefined,
    doctorId: isDoctor ? user?.id : (doctorFilter || undefined), // Для врачей автоматически фильтруем по их ID
    time: timeFilter || undefined,
    week: weekFilter || undefined,
    category: categoryFilter || undefined,
  });
  const updateStatusMutation = useUpdateAppointmentStatus();
  const updateAppointmentMutation = useUpdateAppointment();

  // Фильтруем завершенные приёмы, если статус не выбран явно
  // Это гарантирует, что завершенные приёмы не отображаются в разделе Appointments
  // НО: если выбран фильтр "Все статусы" (statusFilter === ''), показываем все приёмы
  const filteredAppointments = React.useMemo(() => {
    // API возвращает { appointments: Appointment[], meta: {...} }
    const appointments = (data as any)?.appointments || [];
    if (!appointments || appointments.length === 0) return [];
    
    // Если статус выбран явно (не пустая строка), используем данные как есть
    // API уже отфильтровал по статусу
    if (statusFilter && statusFilter.trim() !== '') {
      return appointments;
    }
    
    // Если выбран "Все статусы" (пустая строка) или статус не установлен
    // Показываем все приёмы без фильтрации
    // Это позволяет видеть все приёмы, включая завершенные и отмененные
    return appointments;
  }, [data, statusFilter]);

  /**
   * Обработчик изменения статуса приёма
   * @param id - ID приёма
   * @param newStatus - Новый статус (confirmed, cancelled, completed)
   */
  const handleStatusChange = async (id: string, newStatus: string) => {
    // Если статус - completed, открываем модальное окно для ввода суммы
    if (newStatus === 'completed') {
      const appointment = appointments.find((a: Appointment) => a.id === id);
      if (appointment) {
        setSelectedAppointmentForComplete(appointment);
        setIsCompleteModalOpen(true);
      }
      return;
    }

    // Если статус - cancelled, открываем модальное окно для ввода причины отмены
    if (newStatus === 'cancelled') {
      const appointment = appointments.find((a: Appointment) => a.id === id);
      if (appointment) {
        setSelectedAppointmentForCancel(appointment);
        setIsCancelModalOpen(true);
      }
      return;
    }

    // Для других статусов - обычное изменение
    // Очищаем предыдущую ошибку для этого приёма
    setErrorMessages(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });

    // Устанавливаем состояние загрузки
    setLoadingAppointments(prev => ({ ...prev, [id]: newStatus }));

    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus });
      // Успешно - очищаем состояние загрузки
      setLoadingAppointments(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } catch (err: any) {
      console.error('❌ [APPOINTMENTS] Ошибка изменения статуса:', err);
      
      // Сохраняем сообщение об ошибке для отображения inline
      const errorMessage = err.message || 'Ошибка изменения статуса. Попробуйте позже.';
      setErrorMessages(prev => ({ ...prev, [id]: errorMessage }));
      
      // Очищаем состояние загрузки
      setLoadingAppointments(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  };

  /**
   * Обработчик завершения приёма с суммой
   */
  const handleComplete = async (appointmentId: string, amount: number) => {
    setLoadingAppointments(prev => ({ ...prev, [appointmentId]: 'completed' }));
    try {
      await updateStatusMutation.mutateAsync({ id: appointmentId, status: 'completed', amount });
      setIsCompleteModalOpen(false);
      setSelectedAppointmentForComplete(null);
      setLoadingAppointments(prev => {
        const updated = { ...prev };
        delete updated[appointmentId];
        return updated;
      });
    } catch (err: any) {
      console.error('❌ [APPOINTMENTS] Ошибка завершения приёма:', err);
      throw err;
    }
  };

  /**
   * Обработчик отмены приёма с причиной
   */
  const handleCancel = async (cancellationReason: string, suggestedNewDate?: string) => {
    if (!selectedAppointmentForCancel) return;
    
    const appointmentId = selectedAppointmentForCancel.id;
    setLoadingAppointments(prev => ({ ...prev, [appointmentId]: 'cancelled' }));
    
    try {
      await updateStatusMutation.mutateAsync({ 
        id: appointmentId, 
        status: 'cancelled',
        cancellationReason,
        suggestedNewDate
      });
      setIsCancelModalOpen(false);
      setSelectedAppointmentForCancel(null);
      setLoadingAppointments(prev => {
        const updated = { ...prev };
        delete updated[appointmentId];
        return updated;
      });
    } catch (err: any) {
      console.error('❌ [APPOINTMENTS] Ошибка отмены приёма:', err);
      throw err;
    }
  };

  /**
   * Обработчик редактирования суммы
   */
  const handleEditAmount = (appointment: Appointment) => {
    setSelectedAppointmentForEdit(appointment);
    setIsEditAmountModalOpen(true);
  };

  /**
   * Обработчик сохранения новой суммы
   */
  const handleUpdateAmount = async (appointmentId: string, amount: number) => {
    setLoadingAppointments(prev => ({ ...prev, [appointmentId]: 'updating' }));
    try {
      await updateAppointmentMutation.mutateAsync({ id: appointmentId, data: { amount } });
      setIsEditAmountModalOpen(false);
      setSelectedAppointmentForEdit(null);
      setLoadingAppointments(prev => {
        const updated = { ...prev };
        delete updated[appointmentId];
        return updated;
      });
    } catch (err: any) {
      console.error('❌ [APPOINTMENTS] Ошибка обновления суммы:', err);
      throw err;
    }
  };

  // Показываем ошибку только если это первая загрузка и есть ошибка
  if (error && !data) {
    return (
      <NewDashboardLayout>
        <div>
          <Card className="bg-red-50 border-red-200">
            <p className="text-red-600 text-sm">Ошибка загрузки: {(error as any).message}</p>
          </Card>
        </div>
      </NewDashboardLayout>
    );
  }

  // Используем отфильтрованные приёмы (исключаем completed по умолчанию)
  const appointments = filteredAppointments;
  
  // Показываем спиннер только при первой загрузке (когда нет данных)
  const isInitialLoading = isLoading && !data;
  
  // Отслеживаем изменения для плавного исчезновения/появления
  const [displayedAppointments, setDisplayedAppointments] = useState(appointments);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevAppointmentIdsRef = useRef<string[]>(appointments.map((a: Appointment) => a.id));
  
  // Плавное обновление данных при изменении
  useEffect(() => {
    const currentIds = appointments.map((a: Appointment) => a.id);
    const prevIds = prevAppointmentIdsRef.current;
    
    // Проверяем, изменился ли состав данных
    const idsChanged = JSON.stringify([...currentIds].sort()) !== JSON.stringify([...prevIds].sort());
    
    if (idsChanged && prevIds.length > 0) {
      // Если состав изменился и были предыдущие данные, делаем плавный переход
      setIsTransitioning(true);
      
      // Небольшая задержка для fade-out эффекта
      const transitionTimer = setTimeout(() => {
        setDisplayedAppointments(appointments);
        prevAppointmentIdsRef.current = currentIds;
        
        // Небольшая задержка перед fade-in
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 250); // Время для fade-out
      
      return () => clearTimeout(transitionTimer);
    } else {
      // Если данные не изменились или это первая загрузка, просто обновляем
      setDisplayedAppointments(appointments);
      prevAppointmentIdsRef.current = currentIds;
      setIsTransitioning(false);
    }
  }, [appointments]);

  // Статистика по статусам (считаем из всех данных, включая completed, для правильной статистики)
  // Но отображаем только те, которые не отфильтрованы
  const allAppointments = ((data as any)?.appointments || []) as Appointment[];
  const stats = {
    total: allAppointments.length,
    pending: allAppointments.filter((a: Appointment) => a.status === 'pending').length,
    confirmed: allAppointments.filter((a: Appointment) => a.status === 'confirmed').length,
    completed: allAppointments.filter((a: Appointment) => a.status === 'completed').length,
    cancelled: allAppointments.filter((a: Appointment) => a.status === 'cancelled').length,
  };

  return (
    <NewDashboardLayout>
      <div className="space-y-6 relative">
        {/* Сверхтонкий индикатор загрузки вверху страницы (почти незаметный) */}
        {isFetching && !isInitialLoading && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-main-100/10 overflow-hidden z-50">
            <div 
              className="h-full bg-main-100/40 relative"
              style={{ 
                width: '25%',
                animation: 'shimmer 2s ease-in-out infinite'
              }} 
            />
          </div>
        )}
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-text-100">Приёмы</h1>
            <p className="text-text-10 text-sm mt-1">
              {statusFilter 
                ? `Всего: ${(data as any)?.meta?.total || 0} назначений`
                : `Активных: ${appointments.length} из ${(data as any)?.meta?.total || 0} назначений`
              }
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {/* Для врачей - переключение table/cards */}
            {!isClinic && (
            <div className="flex border border-stroke rounded-sm overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 text-sm font-normal transition-smooth ${
                  viewMode === 'table'
                    ? 'bg-main-100 text-white'
                    : 'bg-bg-white text-text-50 hover:bg-bg-primary'
                }`}
              >
                📊 Таблица
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-4 py-2 text-sm font-normal transition-smooth ${
                  viewMode === 'cards'
                    ? 'bg-main-100 text-white'
                    : 'bg-bg-white text-text-50 hover:bg-bg-primary'
                }`}
              >
                🃏 Карточки
              </button>
            </div>
            )}
            
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              ➕ Создать приём
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className={`grid grid-cols-2 md:grid-cols-5 gap-4 transition-opacity duration-500 ease-out ${isFetching ? 'opacity-95' : 'opacity-100'}`}>
          <Card padding="md" className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="text-center">
              <p className="text-xs text-blue-700 mb-1 font-medium">Всего</p>
              <p className="text-2xl font-bold text-blue-600 transition-all duration-300">{stats.total}</p>
            </div>
          </Card>
          <Card padding="md" className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <div className="text-center">
              <p className="text-xs text-yellow-700 mb-1 font-medium">Ожидают</p>
              <p className="text-2xl font-bold text-yellow-600 transition-all duration-300">{stats.pending}</p>
            </div>
          </Card>
          <Card padding="md" className="bg-gradient-to-br from-main-10 to-main-100/10 border-main-100/20">
            <div className="text-center">
              <p className="text-xs text-main-100 mb-1 font-medium">Подтверждены</p>
              <p className="text-2xl font-bold text-main-100 transition-all duration-300">{stats.confirmed}</p>
            </div>
          </Card>
          <Card padding="md" className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="text-center">
              <p className="text-xs text-green-700 mb-1 font-medium">Завершены</p>
              <p className="text-2xl font-bold text-green-600 transition-all duration-300">{stats.completed}</p>
            </div>
          </Card>
          <Card padding="md" className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-700 mb-1 font-medium">Отменены</p>
              <p className="text-2xl font-bold text-gray-600 transition-all duration-300">{stats.cancelled}</p>
            </div>
          </Card>
        </div>

      {/* Filters */}
      <Card padding="md">
        <div className={`grid grid-cols-1 md:grid-cols-3 ${isDoctor ? 'lg:grid-cols-5' : 'lg:grid-cols-6'} gap-4`}>
          {/* Фильтр "Врач" скрыт для врачей, так как они видят только свои назначения */}
          {!isDoctor && (
            <div>
              <label className="block text-sm font-normal text-text-10 mb-2">Врач</label>
              <select
                value={doctorFilter}
                onChange={e => setDoctorFilter(e.target.value)}
                className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm focus:outline-none focus:border-main-100 transition-smooth"
                disabled={isDoctorsLoading}
              >
                <option value="">Все врачи</option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} {doctor.specialization ? `(${doctor.specialization})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-normal text-text-10 mb-2">Статус</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm focus:outline-none focus:border-main-100 transition-smooth"
            >
              <option value="">Все статусы</option>
              <option value="pending">Ожидает подтверждения</option>
              <option value="confirmed">Подтвержден</option>
              <option value="completed">Завершен</option>
              <option value="cancelled">Отменен</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-normal text-text-10 mb-2">Дата</label>
            <input
              type="date"
              value={dateFilter}
              onChange={e => {
                setDateFilter(e.target.value);
                // Очищаем фильтр по неделе при выборе даты
                if (e.target.value) setWeekFilter('');
              }}
              className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm focus:outline-none focus:border-main-100 transition-smooth"
            />
          </div>
          <div>
            <label className="block text-sm font-normal text-text-10 mb-2">Время</label>
            <input
              type="time"
              value={timeFilter}
              onChange={e => setTimeFilter(e.target.value)}
              className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm focus:outline-none focus:border-main-100 transition-smooth"
            />
          </div>
          <div>
            <label className="block text-sm font-normal text-text-10 mb-2">Неделя</label>
            <input
              type="week"
              value={weekFilter}
              onChange={e => {
                setWeekFilter(e.target.value);
                // Очищаем фильтр по дате при выборе недели
                if (e.target.value) setDateFilter('');
              }}
              className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm focus:outline-none focus:border-main-100 transition-smooth"
            />
          </div>
          <div>
            <label className="block text-sm font-normal text-text-10 mb-2">Категория</label>
            <input
              type="text"
              value={categoryInput}
              onChange={e => setCategoryInput(e.target.value)}
              placeholder="Процедура..."
              className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm focus:outline-none focus:border-main-100 transition-smooth"
            />
          </div>
        </div>
        {(!isDoctor && doctorFilter || statusFilter || dateFilter || timeFilter || weekFilter || categoryFilter) && (
          <div className="mt-4 pt-4 border-t border-stroke">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (!isDoctor) setDoctorFilter('');
                setStatusFilter('');
                setDateFilter('');
                setTimeFilter('');
                setWeekFilter('');
                setCategoryFilter('');
                setCategoryInput('');
                // Очищаем URL параметры
                setSearchParams({}, { replace: true });
              }}
            >
              🔄 Сбросить фильтры
            </Button>
          </div>
        )}
      </Card>

      {/* Appointments Display - разные виды для CLINIC */}
      {isInitialLoading ? (
        <Card>
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        </Card>
      ) : appointments.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-text-10 text-sm">
            Приёмы не найдены
          </div>
        </Card>
      ) : isClinic && viewType === 'monthly' ? (
        <AppointmentsMonthlyCalendar
          appointments={appointments}
          onAppointmentClick={(appointment) => {
            // При клике на приём в календаре - открываем модальное окно или выполняем действие
            if (appointment.status === 'pending') {
              handleStatusChange(appointment.id, 'confirmed');
            } else if (appointment.status === 'confirmed') {
              handleStatusChange(appointment.id, 'completed');
            }
          }}
          onDateClick={(date) => {
            // При клике на ячейку календаря - открываем модальное окно создания приёма с предзаполненной датой
            const dateStr = format(date, 'yyyy-MM-dd');
            setCreateModalDefaultDate(dateStr);
            setIsCreateModalOpen(true);
          }}
          onViewChange={handleViewTypeChange}
          currentView={viewType}
        />
      ) : isClinic && viewType === 'weekly' ? (
        <AppointmentsWeeklyView
          appointments={appointments}
          onAppointmentClick={(appointment) => {
            // При клике на приём в недельном виде
            if (appointment.status === 'pending') {
              handleStatusChange(appointment.id, 'confirmed');
            } else if (appointment.status === 'confirmed') {
              handleStatusChange(appointment.id, 'completed');
            }
          }}
          onTimeSlotClick={() => {
            // При клике на временной слот - открываем модальное окно создания приёма
            setIsCreateModalOpen(true);
          }}
          onViewChange={handleViewTypeChange}
          currentView={viewType}
        />
      ) : (
        // List view (table или cards) - для всех ролей
        <div className="space-y-4">
          {/* Переключение видов для CLINIC в списке */}
          {isClinic && (
            <Card padding="sm">
              <div className="flex items-center justify-center">
                <div className="flex border border-stroke rounded-sm overflow-hidden">
                  <button
                    onClick={() => handleViewTypeChange('list')}
                    className={`px-5 py-2.5 text-base font-medium transition-smooth ${
                      viewType === 'list'
                        ? 'bg-main-100 text-white'
                        : 'bg-bg-white text-text-50 hover:bg-bg-primary'
                    }`}
                    title="Таблица"
                  >
                    📊 Таблица
                  </button>
                  <button
                    onClick={() => handleViewTypeChange('monthly')}
                    className={`px-5 py-2.5 text-base font-medium transition-smooth ${
                      viewType === 'monthly'
                        ? 'bg-main-100 text-white'
                        : 'bg-bg-white text-text-50 hover:bg-bg-primary'
                    }`}
                    title="Месячный календарь"
                  >
                    📅 Месяц
                  </button>
                  <button
                    onClick={() => handleViewTypeChange('weekly')}
                    className={`px-5 py-2.5 text-base font-medium transition-smooth ${
                      viewType === 'weekly'
                        ? 'bg-main-100 text-white'
                        : 'bg-bg-white text-text-50 hover:bg-bg-primary'
                    }`}
                    title="Недельный вид"
                  >
                    📆 Неделя
                  </button>
                </div>
              </div>
            </Card>
          )}
          <AppointmentsListView
            appointments={displayedAppointments}
            viewMode={viewMode}
            onStatusChange={handleStatusChange}
            onEditAmount={handleEditAmount}
            loadingAppointments={loadingAppointments}
            errorMessages={errorMessages}
            isFetching={isFetching}
            isTransitioning={isTransitioning}
          />
        </div>
      )}

      {/* Модальное окно создания приёма */}
      <CreateAppointmentModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateModalDefaultDate(undefined);
        }}
        onSuccess={() => {
          // Обновление произойдет автоматически через React Query
          console.log('✅ [APPOINTMENTS] Приём успешно создан');
          setCreateModalDefaultDate(undefined);
        }}
        defaultDate={createModalDefaultDate}
      />

      {/* Модальное окно завершения приёма */}
      <CompleteAppointmentModal
        isOpen={isCompleteModalOpen}
        onClose={() => {
          setIsCompleteModalOpen(false);
          setSelectedAppointmentForComplete(null);
        }}
        appointment={selectedAppointmentForComplete}
        onComplete={handleComplete}
        isLoading={selectedAppointmentForComplete ? loadingAppointments[selectedAppointmentForComplete.id] === 'completed' : false}
      />

      {/* Модальное окно отмены приёма */}
      <CancelAppointmentModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setSelectedAppointmentForCancel(null);
        }}
        appointment={selectedAppointmentForCancel}
        onConfirm={handleCancel}
        isLoading={selectedAppointmentForCancel ? loadingAppointments[selectedAppointmentForCancel.id] === 'cancelled' : false}
      />

      {/* Модальное окно редактирования суммы */}
      <EditAmountModal
        isOpen={isEditAmountModalOpen}
        onClose={() => {
          setIsEditAmountModalOpen(false);
          setSelectedAppointmentForEdit(null);
        }}
        appointment={selectedAppointmentForEdit}
        onUpdate={handleUpdateAmount}
        isLoading={selectedAppointmentForEdit ? loadingAppointments[selectedAppointmentForEdit.id] === 'updating' : false}
      />
      </div>
    </NewDashboardLayout>
  );
};

