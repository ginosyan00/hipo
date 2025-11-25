import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner } from '../common';
import { AppointmentsTable } from './AppointmentsTable';
import { CreateAppointmentModal } from './CreateAppointmentModal';
import { CompleteAppointmentModal } from './CompleteAppointmentModal';
import { CancelAppointmentModal } from './CancelAppointmentModal';
import { EditAmountModal } from './EditAmountModal';
import { useAppointments, useUpdateAppointmentStatus, useUpdateAppointment } from '../../hooks/useAppointments';
import { useAuthStore } from '../../store/useAuthStore';
import { Appointment } from '../../types/api.types';
import { formatAppointmentDateTime } from '../../utils/dateFormat';

/**
 * DoctorAppointmentsSection Component
 * Секция приёмов для страницы врача
 * Показывает все приёмы текущего врача с фильтрами и возможностью управления
 */
export const DoctorAppointmentsSection: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const doctorId = user?.id;

  // Фильтры
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<string>('');
  const [weekFilter, setWeekFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [categoryInput, setCategoryInput] = useState<string>(''); // Для debounce

  // Вид отображения (table/cards)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Модальные окна
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedAppointmentForComplete, setSelectedAppointmentForComplete] = useState<Appointment | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedAppointmentForCancel, setSelectedAppointmentForCancel] = useState<Appointment | null>(null);
  const [isEditAmountModalOpen, setIsEditAmountModalOpen] = useState(false);
  const [selectedAppointmentForEdit, setSelectedAppointmentForEdit] = useState<Appointment | null>(null);

  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});
  const [loadingAppointments, setLoadingAppointments] = useState<Record<string, string>>({});

  // Debounce для поля категории
  useEffect(() => {
    const timer = setTimeout(() => {
      setCategoryFilter(categoryInput);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [categoryInput]);

  // Загружаем приёмы с фильтром по текущему врачу
  const { data, isLoading, isFetching, error } = useAppointments({
    doctorId: doctorId, // Автоматически фильтруем по текущему врачу
    status: statusFilter && statusFilter.trim() !== '' ? statusFilter : undefined,
    date: dateFilter || undefined,
    time: timeFilter || undefined,
    week: weekFilter || undefined,
    category: categoryFilter || undefined,
  });

  const updateStatusMutation = useUpdateAppointmentStatus();
  const updateAppointmentMutation = useUpdateAppointment();

  const appointments = data?.appointments || [];

  // Статистика по статусам
  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };

  /**
   * Обработчик изменения статуса приёма
   */
  const handleStatusChange = async (id: string, newStatus: string) => {
    if (newStatus === 'completed') {
      const appointment = appointments.find(a => a.id === id);
      if (appointment) {
        setSelectedAppointmentForComplete(appointment);
        setIsCompleteModalOpen(true);
      }
      return;
    }

    if (newStatus === 'cancelled') {
      const appointment = appointments.find(a => a.id === id);
      if (appointment) {
        setSelectedAppointmentForCancel(appointment);
        setIsCancelModalOpen(true);
      }
      return;
    }

    setErrorMessages(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });

    setLoadingAppointments(prev => ({ ...prev, [id]: newStatus }));

    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus });
      setLoadingAppointments(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } catch (err: any) {
      console.error('❌ [DOCTOR APPOINTMENTS] Ошибка изменения статуса:', err);
      const errorMessage = err.message || 'Ошибка изменения статуса. Попробуйте позже.';
      setErrorMessages(prev => ({ ...prev, [id]: errorMessage }));
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
      console.error('❌ [DOCTOR APPOINTMENTS] Ошибка завершения приёма:', err);
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
      console.error('❌ [DOCTOR APPOINTMENTS] Ошибка отмены приёма:', err);
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
      console.error('❌ [DOCTOR APPOINTMENTS] Ошибка обновления суммы:', err);
      throw err;
    }
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

  if (error && !data) {
    return (
      <Card className="bg-red-50 border-red-200">
        <p className="text-red-600 text-sm">Ошибка загрузки: {(error as any).message}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text-100">Все приёмы</h2>
          <p className="text-text-10 text-sm mt-1">
            Всего: {data?.meta.total || 0} назначений
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
        {(statusFilter || dateFilter || timeFilter || weekFilter || categoryFilter) && (
          <div className="mt-4 pt-4 border-t border-stroke">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setStatusFilter('');
                setDateFilter('');
                setTimeFilter('');
                setWeekFilter('');
                setCategoryFilter('');
                setCategoryInput('');
              }}
            >
              🔄 Сбросить фильтры
            </Button>
          </div>
        )}
      </Card>

      {/* Appointments List */}
      {isLoading && !data ? (
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
        <Card padding="md" className={`transition-opacity duration-500 ease-out ${isFetching ? 'opacity-95' : 'opacity-100'}`}>
          <AppointmentsTable
            appointments={appointments}
            onStatusChange={handleStatusChange}
            onEditAmount={handleEditAmount}
            loadingAppointments={loadingAppointments}
            errorMessages={errorMessages}
          />
        </Card>
      ) : (
        <div className={`space-y-4 transition-opacity duration-500 ease-out ${isFetching ? 'opacity-95' : 'opacity-100'}`}>
          {appointments.map((appointment) => (
            <Card
              key={appointment.id}
              padding="md"
              className="appointment-card transition-all duration-500 ease-out"
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

                  {/* Appointment Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-bg-primary p-3 rounded-sm">
                      <p className="font-normal text-text-10 mb-2">📅 Дата и время приёма:</p>
                      <p className="font-semibold text-text-50 text-sm">
                        {formatAppointmentDateTime(appointment.appointmentDate, { dateFormat: 'long' })}
                      </p>
                      <p className="text-text-10 mt-1">⏱️ Длительность: {appointment.duration} мин</p>
                      {appointment.amount && (
                        <p className="text-text-10 mt-1">
                          💰 Сумма: <span className="font-semibold text-text-100">{appointment.amount.toLocaleString('ru-RU')} ֏</span>
                        </p>
                      )}
                    </div>
                    {appointment.reason && (
                      <div className="bg-bg-primary p-3 rounded-sm">
                        <p className="font-normal text-text-10 mb-2">Процедура:</p>
                        <p className="text-text-50">{appointment.reason}</p>
                      </div>
                    )}
                  </div>

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

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4 min-w-[120px]">
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
      )}

      {/* Модальное окно создания приёма */}
      <CreateAppointmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          console.log('✅ [DOCTOR APPOINTMENTS] Приём успешно создан');
        }}
        defaultDoctorId={doctorId} // Автоматически выбираем текущего врача
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
  );
};

