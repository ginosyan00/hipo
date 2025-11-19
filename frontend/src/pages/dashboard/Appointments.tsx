import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { NewDashboardLayout } from '../../components/dashboard/NewDashboardLayout';
import { Button, Card, Spinner } from '../../components/common';
import { AppointmentsTable } from '../../components/dashboard/AppointmentsTable';
import { CreateAppointmentModal } from '../../components/dashboard/CreateAppointmentModal';
import { CompleteAppointmentModal } from '../../components/dashboard/CompleteAppointmentModal';
import { CancelAppointmentModal } from '../../components/dashboard/CancelAppointmentModal';
import { EditAmountModal } from '../../components/dashboard/EditAmountModal';
import { useAppointments, useUpdateAppointmentStatus, useUpdateAppointment } from '../../hooks/useAppointments';
import { userService } from '../../services/user.service';
import { User, Appointment } from '../../types/api.types';
import { formatAppointmentDateTime } from '../../utils/dateFormat';

/**
 * Appointments Page - Figma Design
 * Управление приёмами в новом стиле
 * Улучшенная версия с фильтрами, статистикой и детальной информацией
 * Фильтры сохраняются в URL параметрах для сохранения состояния при обновлении страницы
 */
export const AppointmentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Инициализация фильтров из URL параметров
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
  const [dateFilter, setDateFilter] = useState<string>(searchParams.get('date') || '');
  const [doctorFilter, setDoctorFilter] = useState<string>(searchParams.get('doctor') || '');
  const [timeFilter, setTimeFilter] = useState<string>(searchParams.get('time') || '');
  const [weekFilter, setWeekFilter] = useState<string>(searchParams.get('week') || '');
  const [categoryFilter, setCategoryFilter] = useState<string>(searchParams.get('category') || '');
  const [categoryInput, setCategoryInput] = useState<string>(searchParams.get('category') || ''); // Для debounce
  
  // Вид отображения (table/cards)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  
  // Модальное окно создания приёма
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
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
  const { data, isLoading, isFetching, error } = useAppointments({
    status: statusFilter && statusFilter.trim() !== '' ? statusFilter : undefined,
    date: dateFilter || undefined,
    doctorId: doctorFilter || undefined,
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
    if (!data?.appointments) return [];
    
    // Если статус выбран явно (не пустая строка), используем данные как есть
    // API уже отфильтровал по статусу
    if (statusFilter && statusFilter.trim() !== '') {
      return data.appointments;
    }
    
    // Если выбран "Все статусы" (пустая строка) или статус не установлен
    // Показываем все приёмы без фильтрации
    // Это позволяет видеть все приёмы, включая завершенные и отмененные
    return data.appointments;
  }, [data?.appointments, statusFilter]);

  /**
   * Обработчик изменения статуса приёма
   * @param id - ID приёма
   * @param newStatus - Новый статус (confirmed, cancelled, completed)
   */
  const handleStatusChange = async (id: string, newStatus: string) => {
    // Если статус - completed, открываем модальное окно для ввода суммы
    if (newStatus === 'completed') {
      const appointment = appointments.find(a => a.id === id);
      if (appointment) {
        setSelectedAppointmentForComplete(appointment);
        setIsCompleteModalOpen(true);
      }
      return;
    }

    // Если статус - cancelled, открываем модальное окно для ввода причины отмены
    if (newStatus === 'cancelled') {
      const appointment = appointments.find(a => a.id === id);
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
  const prevAppointmentIdsRef = useRef<string[]>(appointments.map(a => a.id));
  
  // Плавное обновление данных при изменении
  useEffect(() => {
    const currentIds = appointments.map(a => a.id);
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
  const allAppointments = data?.appointments || [];
  const stats = {
    total: allAppointments.length,
    pending: allAppointments.filter(a => a.status === 'pending').length,
    confirmed: allAppointments.filter(a => a.status === 'confirmed').length,
    completed: allAppointments.filter(a => a.status === 'completed').length,
    cancelled: allAppointments.filter(a => a.status === 'cancelled').length,
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      confirmed: 'bg-main-10 text-main-100 border-main-100/20',
      completed: 'bg-secondary-10 text-secondary-100 border-secondary-100/20',
      cancelled: 'bg-bg-primary text-text-10 border-stroke',
    };
    const labels = {
      pending: 'Ожидает',
      confirmed: 'Подтвержден',
      completed: 'Завершен',
      cancelled: 'Отменен',
    };
    return (
      <span className={`px-3 py-1 border rounded-sm text-xs font-normal ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
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
                ? `Всего: ${data?.meta.total || 0} назначений`
                : `Активных: ${appointments.length} из ${data?.meta.total || 0} назначений`
              }
            </p>
          </div>
          <div className="flex gap-3">
            {/* Переключение вида */}
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
        {(doctorFilter || statusFilter || dateFilter || timeFilter || weekFilter || categoryFilter) && (
          <div className="mt-4 pt-4 border-t border-stroke">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setDoctorFilter('');
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

      {/* Appointments List */}
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
      ) : viewMode === 'table' ? (
        <Card padding="md" className={`transition-opacity duration-500 ease-out will-change-opacity ${isFetching ? 'opacity-95' : 'opacity-100'}`}>
          <div className={isTransitioning ? 'opacity-0 transition-opacity duration-300 ease-out' : 'opacity-100 transition-opacity duration-500 ease-out'}>
            <AppointmentsTable
              appointments={displayedAppointments}
              onStatusChange={handleStatusChange}
              onEditAmount={handleEditAmount}
              loadingAppointments={loadingAppointments}
              errorMessages={errorMessages}
            />
          </div>
        </Card>
      ) : (
        <div className={`space-y-4 transition-opacity duration-500 ease-out will-change-opacity ${isFetching ? 'opacity-95' : 'opacity-100'}`}>
          <div className={isTransitioning ? 'opacity-0 transition-opacity duration-300 ease-out' : 'opacity-100 transition-opacity duration-500 ease-out'}>
            {displayedAppointments.map((appointment) => (
              <Card 
                key={appointment.id} 
                padding="md"
                className="appointment-card transition-all duration-500 ease-out will-change-opacity animate-fade-in"
              >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  {/* Patient Info Header */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-12 h-12 bg-main-10 rounded-sm flex items-center justify-center flex-shrink-0">
                      <span className="text-base text-main-100 font-medium">
                        {appointment.patient?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-text-100 truncate">
                        {appointment.patient?.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {appointment.patient?.email && (
                          <p className="text-xs text-text-10">📧 {appointment.patient.email}</p>
                        )}
                        {appointment.patient?.phone && (
                          <p className="text-xs text-text-10">📱 {appointment.patient.phone}</p>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>

                  {/* Doctor and Appointment Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-bg-primary p-3 rounded-sm">
                      <p className="font-normal text-text-10 mb-2">👨‍⚕️ Врач:</p>
                      <p className="font-semibold text-text-50 text-sm">{appointment.doctor?.name}</p>
                      {appointment.doctor?.specialization && (
                        <p className="text-text-10 mt-1">{appointment.doctor.specialization}</p>
                      )}
                    </div>
                    <div className="bg-bg-primary p-3 rounded-sm">
                      <p className="font-normal text-text-10 mb-2">📅 Дата и время приёма:</p>
                      <p className="font-semibold text-text-50 text-sm">
                        {formatAppointmentDateTime(appointment.appointmentDate, { dateFormat: 'long' })}
                      </p>
                      {/* Показываем registeredAt если есть, иначе используем createdAt для старых записей */}
                      {/* Отображаем время регистрации в том же формате, в котором клиент зарегистрировался */}
                      {(appointment.registeredAt || appointment.createdAt) && (
                        <p className="text-text-10 mt-1 text-xs">
                          📝 Зарегистрировано: {(() => {
                            // Сначала проверяем, есть ли исходная строка времени в notes
                            let registeredAtOriginalStr = null;
                            if (appointment.notes) {
                              const match = appointment.notes.match(/REGISTERED_AT_ORIGINAL:\s*(.+)/);
                              if (match) {
                                registeredAtOriginalStr = match[1].trim();
                              }
                            }
                            
                            // Если есть исходная строка, используем её для отображения локального времени клиента
                            if (registeredAtOriginalStr) {
                              const match = registeredAtOriginalStr.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/);
                              if (match) {
                                const [datePart, timePart] = [match[1], match[2]];
                                const [year, month, day] = datePart.split('-');
                                const [hours, minutes] = timePart.split(':');
                                return `${day}.${month}.${year} ${hours}:${minutes}`;
                              }
                            }
                            
                            // Если исходной строки нет, используем стандартное форматирование
                            const registeredAtStr = appointment.registeredAt || appointment.createdAt;
                            if (!registeredAtStr) return '';
                            
                            const date = new Date(registeredAtStr);
                            return date.toLocaleString('ru-RU', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            });
                          })()}
                        </p>
                      )}
                      <p className="text-text-10 mt-1">⏱️ Длительность: {appointment.duration} мин</p>
                      {appointment.amount && (
                        <p className="text-text-10 mt-1">
                          💰 Сумма: <span className="font-semibold text-text-100">{appointment.amount.toLocaleString('ru-RU')} ֏</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {appointment.reason && (
                    <div className="text-xs">
                      <p className="font-normal text-text-10 mb-1">Причина визита:</p>
                      <p className="text-text-50">{appointment.reason}</p>
                    </div>
                  )}

                  {appointment.notes && (
                    <div className="text-xs">
                      <p className="font-normal text-text-10 mb-1">Заметки:</p>
                      <p className="text-text-50">{appointment.notes}</p>
                    </div>
                  )}

                  {/* Inline Error Message */}
                  {errorMessages[appointment.id] && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-sm">
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <span>⚠️</span>
                        {errorMessages[appointment.id]}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions - Три кнопки с умной логикой отображения */}
                {/* Доступны для ADMIN (администратор клиники) и DOCTOR (врач) */}
                {/* Права доступа проверяются на backend через authorize middleware */}
                <div className="flex flex-col gap-2 ml-4 min-w-[120px]">
                  {/* Кнопка "Подтвердить" - только для pending */}
                  {/* Доступна: ADMIN, DOCTOR */}
                  {appointment.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                      isLoading={loadingAppointments[appointment.id] === 'confirmed'}
                      disabled={!!loadingAppointments[appointment.id]}
                    >
                      Подтвердить
                    </Button>
                  )}

                  {/* Кнопка "Завершить" - только для confirmed */}
                  {/* Доступна: ADMIN, DOCTOR */}
                  {appointment.status === 'confirmed' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleStatusChange(appointment.id, 'completed')}
                      isLoading={loadingAppointments[appointment.id] === 'completed'}
                      disabled={!!loadingAppointments[appointment.id]}
                    >
                      Завершить
                    </Button>
                  )}

                  {/* Кнопка "Отменить" - для pending и confirmed */}
                  {/* Доступна: ADMIN, DOCTOR */}
                  {['pending', 'confirmed'].includes(appointment.status) && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                      isLoading={loadingAppointments[appointment.id] === 'cancelled'}
                      disabled={!!loadingAppointments[appointment.id]}
                    >
                      Отменить
                    </Button>
                  )}

                  {/* Кнопка редактирования суммы - только для завершенных приёмов */}
                  {appointment.status === 'completed' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEditAmount(appointment)}
                      isLoading={loadingAppointments[appointment.id] === 'updating'}
                      disabled={!!loadingAppointments[appointment.id]}
                    >
                      {appointment.amount ? 'Изменить сумму' : 'Добавить сумму'}
                    </Button>
                  )}

                  {/* Информация для отмененных приёмов */}
                  {appointment.status === 'cancelled' && (
                    <div className="text-xs text-text-10 text-center py-2">
                      ❌ Приём отменён
                    </div>
                  )}
                </div>
              </div>
            </Card>
            ))}
          </div>
        </div>
      )}

      {/* Модальное окно создания приёма */}
      <CreateAppointmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          // Обновление произойдет автоматически через React Query
          console.log('✅ [APPOINTMENTS] Приём успешно создан');
        }}
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
