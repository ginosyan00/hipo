import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { NewDashboardLayout } from '../../components/dashboard/NewDashboardLayout';
import { Button, Card, Spinner } from '../../components/common';
import { useAppointments, useUpdateAppointmentStatus } from '../../hooks/useAppointments';
import { userService } from '../../services/user.service';
import { User } from '../../types/api.types';

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
    
    // Обновляем URL без перезагрузки страницы
    setSearchParams(params, { replace: true });
  }, [statusFilter, dateFilter, doctorFilter, setSearchParams]);

  const { data, isLoading, error } = useAppointments({
    status: statusFilter || undefined,
    date: dateFilter || undefined,
    doctorId: doctorFilter || undefined,
  });
  const updateStatusMutation = useUpdateAppointmentStatus();

  /**
   * Обработчик изменения статуса приёма
   * @param id - ID приёма
   * @param newStatus - Новый статус (confirmed, cancelled, completed)
   */
  const handleStatusChange = async (id: string, newStatus: string) => {
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

  if (isLoading) {
    return (
      <NewDashboardLayout>
        <div className="flex justify-center items-center h-full">
          <Spinner size="lg" />
        </div>
      </NewDashboardLayout>
    );
  }

  if (error) {
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

  const appointments = data?.appointments || [];

  // Статистика по статусам
  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-text-100">Приёмы</h1>
            <p className="text-text-10 text-sm mt-1">
              Всего: {data?.meta.total || 0} назначений
            </p>
          </div>
          <Button variant="primary">➕ Создать приём</Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card padding="md" className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="text-center">
              <p className="text-xs text-blue-700 mb-1 font-medium">Всего</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
          </Card>
          <Card padding="md" className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <div className="text-center">
              <p className="text-xs text-yellow-700 mb-1 font-medium">Ожидают</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </Card>
          <Card padding="md" className="bg-gradient-to-br from-main-10 to-main-100/10 border-main-100/20">
            <div className="text-center">
              <p className="text-xs text-main-100 mb-1 font-medium">Подтверждены</p>
              <p className="text-2xl font-bold text-main-100">{stats.confirmed}</p>
            </div>
          </Card>
          <Card padding="md" className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="text-center">
              <p className="text-xs text-green-700 mb-1 font-medium">Завершены</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
          </Card>
          <Card padding="md" className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-700 mb-1 font-medium">Отменены</p>
              <p className="text-2xl font-bold text-gray-600">{stats.cancelled}</p>
            </div>
          </Card>
        </div>

      {/* Filters */}
      <Card padding="md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              onChange={e => setDateFilter(e.target.value)}
              className="block w-full px-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm focus:outline-none focus:border-main-100 transition-smooth"
            />
          </div>
        </div>
        {(doctorFilter || statusFilter || dateFilter) && (
          <div className="mt-4 pt-4 border-t border-stroke">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setDoctorFilter('');
                setStatusFilter('');
                setDateFilter('');
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
      {appointments.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-text-10 text-sm">
            Приёмы не найдены
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map(appointment => (
            <Card key={appointment.id} padding="md">
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
                        {new Date(appointment.appointmentDate).toLocaleString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
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

                  {/* Информация для завершенных/отмененных приёмов */}
                  {['completed', 'cancelled'].includes(appointment.status) && (
                    <div className="text-xs text-text-10 text-center py-2">
                      {appointment.status === 'completed' 
                        ? '✅ Приём завершён' 
                        : '❌ Приём отменён'}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      </div>
    </NewDashboardLayout>
  );
};
