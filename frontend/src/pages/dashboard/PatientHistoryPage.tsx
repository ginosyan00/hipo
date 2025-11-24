import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { NewDashboardLayout } from '../../components/dashboard/NewDashboardLayout';
import { Card, Button, Spinner, Input } from '../../components/common';
import { usePatientAppointments } from '../../hooks/usePatientAppointments';
import { Appointment } from '../../types/api.types';
import { formatAppointmentDate, formatAppointmentTime } from '../../utils/dateFormat';
import { Calendar, Clock, User, Building2, FileText, Search, Filter, DollarSign, TrendingUp, X } from 'lucide-react';

/**
 * PatientHistoryPage
 * Страница полной истории консультаций пациента
 * Показывает все завершенные и отмененные визиты с детальной информацией
 */
export const PatientHistoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Фильтры из URL параметров
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
  const [dateFromFilter, setDateFromFilter] = useState<string>(searchParams.get('dateFrom') || '');
  const [dateToFilter, setDateToFilter] = useState<string>(searchParams.get('dateTo') || '');
  const [doctorFilter, setDoctorFilter] = useState<string>(searchParams.get('doctor') || '');
  const [clinicFilter, setClinicFilter] = useState<string>(searchParams.get('clinic') || '');
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('search') || '');
  const [searchInput, setSearchInput] = useState<string>(searchParams.get('search') || '');

  // Вид отображения (table/cards)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(searchParams.get('view') === 'cards' ? 'cards' : 'table');

  // Сортировка
  const [sortField, setSortField] = useState<'date' | 'amount' | 'doctor' | 'clinic'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const isInitialMount = React.useRef(true);

  // Debounce для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Синхронизация фильтров с URL
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (dateFromFilter) params.set('dateFrom', dateFromFilter);
    if (dateToFilter) params.set('dateTo', dateToFilter);
    if (doctorFilter) params.set('doctor', doctorFilter);
    if (clinicFilter) params.set('clinic', clinicFilter);
    if (searchQuery) params.set('search', searchQuery);
    if (viewMode === 'cards') params.set('view', 'cards');

    setSearchParams(params, { replace: true });
  }, [statusFilter, dateFromFilter, dateToFilter, doctorFilter, clinicFilter, searchQuery, viewMode, setSearchParams]);

  // Загружаем все записи пациента (без фильтра по статусу, чтобы получить все)
  const { data, isLoading, isFetching, error } = usePatientAppointments({
    limit: 1000, // Большой лимит для получения всей истории
  });

  const appointments = data?.appointments || [];

  // Фильтруем все прошлые записи (дата в прошлом) + завершенные и отмененные
  // Это позволяет видеть все регистрации, даже если они еще не завершены
  const historyAppointments = useMemo(() => {
    const now = new Date();
    return appointments.filter((apt: Appointment) => {
      const aptDate = new Date(apt.appointmentDate);
      // Показываем записи, которые:
      // 1. Были в прошлом (дата приема уже прошла)
      // 2. ИЛИ имеют статус completed/cancelled (независимо от даты)
      return aptDate < now || apt.status === 'completed' || apt.status === 'cancelled';
    });
  }, [appointments]);

  // Применяем фильтры
  const filteredAppointments = useMemo(() => {
    let filtered = [...historyAppointments];

    // Фильтр по статусу
    if (statusFilter) {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }

    // Фильтр по дате от
    if (dateFromFilter) {
      filtered = filtered.filter((apt) => {
        const aptDate = new Date(apt.appointmentDate);
        const fromDate = new Date(dateFromFilter);
        fromDate.setHours(0, 0, 0, 0);
        return aptDate >= fromDate;
      });
    }

    // Фильтр по дате до
    if (dateToFilter) {
      filtered = filtered.filter((apt) => {
        const aptDate = new Date(apt.appointmentDate);
        const toDate = new Date(dateToFilter);
        toDate.setHours(23, 59, 59, 999);
        return aptDate <= toDate;
      });
    }

    // Фильтр по врачу
    if (doctorFilter) {
      filtered = filtered.filter((apt) => {
        const doctorName = apt.doctor?.name?.toLowerCase() || '';
        return doctorName.includes(doctorFilter.toLowerCase());
      });
    }

    // Фильтр по клинике
    if (clinicFilter) {
      filtered = filtered.filter((apt) => {
        const clinicName = apt.clinic?.name?.toLowerCase() || '';
        return clinicName.includes(clinicFilter.toLowerCase());
      });
    }

    // Поиск по всем полям
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((apt) => {
        const doctorName = apt.doctor?.name?.toLowerCase() || '';
        const clinicName = apt.clinic?.name?.toLowerCase() || '';
        const reason = apt.reason?.toLowerCase() || '';
        const notes = apt.notes?.toLowerCase() || '';
        return (
          doctorName.includes(query) ||
          clinicName.includes(query) ||
          reason.includes(query) ||
          notes.includes(query)
        );
      });
    }

    // Сортировка
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'date':
          aValue = new Date(a.appointmentDate).getTime();
          bValue = new Date(b.appointmentDate).getTime();
          break;
        case 'amount':
          aValue = a.amount || 0;
          bValue = b.amount || 0;
          break;
        case 'doctor':
          aValue = a.doctor?.name || '';
          bValue = b.doctor?.name || '';
          break;
        case 'clinic':
          aValue = a.clinic?.name || '';
          bValue = b.clinic?.name || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [historyAppointments, statusFilter, dateFromFilter, dateToFilter, doctorFilter, clinicFilter, searchQuery, sortField, sortDirection]);

  // Статистика
  const stats = useMemo(() => {
    const completed = filteredAppointments.filter((a) => a.status === 'completed');
    const totalAmount = completed.reduce((sum, apt) => sum + (apt.amount || 0), 0);
    const averageAmount = completed.length > 0 ? totalAmount / completed.length : 0;

    return {
      total: filteredAppointments.length,
      pending: filteredAppointments.filter((a) => a.status === 'pending').length,
      confirmed: filteredAppointments.filter((a) => a.status === 'confirmed').length,
      completed: completed.length,
      cancelled: filteredAppointments.filter((a) => a.status === 'cancelled').length,
      totalAmount,
      averageAmount,
    };
  }, [filteredAppointments]);

  /**
   * Сброс всех фильтров
   */
  const handleResetFilters = () => {
    setStatusFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setDoctorFilter('');
    setClinicFilter('');
    setSearchInput('');
    setSearchQuery('');
    setSearchParams({}, { replace: true });
  };

  /**
   * Получить уникальных врачей из истории
   */
  const uniqueDoctors = useMemo(() => {
    const doctors = new Set<string>();
    historyAppointments.forEach((apt) => {
      if (apt.doctor?.name) {
        doctors.add(apt.doctor.name);
      }
    });
    return Array.from(doctors).sort();
  }, [historyAppointments]);

  /**
   * Получить уникальные клиники из истории
   */
  const uniqueClinics = useMemo(() => {
    const clinics = new Set<string>();
    historyAppointments.forEach((apt) => {
      if (apt.clinic?.name) {
        clinics.add(apt.clinic.name);
      }
    });
    return Array.from(clinics).sort();
  }, [historyAppointments]);

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
      completed: 'bg-green-100 text-green-700 border-green-200',
      cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    const labels = {
      pending: '⏳ Ожидает',
      confirmed: '✅ Подтверждено',
      completed: '✅ Завершено',
      cancelled: '❌ Отменено',
    };
    return (
      <span
        className={`px-3 py-1 border rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  if (error && !data) {
    return (
      <NewDashboardLayout>
        <Card className="bg-red-50 border-red-200 p-6">
          <p className="text-red-600 text-sm">Ошибка загрузки: {(error as any).message}</p>
        </Card>
      </NewDashboardLayout>
    );
  }

  return (
    <NewDashboardLayout>
      <div className="space-y-6">
        {/* Индикатор загрузки */}
        {isFetching && !isLoading && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-main-100/10 overflow-hidden z-50">
            <div
              className="h-full bg-main-100/40 relative"
              style={{
                width: '25%',
                animation: 'shimmer 2s ease-in-out infinite',
              }}
            />
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-50 mb-2">История консультаций</h1>
            <p className="text-text-10 text-sm">
              Полная история всех ваших записей, визитов и обследований. Здесь отображаются все прошлые регистрации, включая завершенные и отмененные консультации.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'table' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              📋 Таблица
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('cards')}
            >
              🗂️ Карточки
            </Button>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card padding="md" className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="text-center">
              <p className="text-xs text-blue-700 mb-1 font-medium">Всего записей</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
          </Card>
          {stats.pending > 0 && (
            <Card padding="md" className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <div className="text-center">
                <p className="text-xs text-yellow-700 mb-1 font-medium">Ожидают</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </Card>
          )}
          {stats.confirmed > 0 && (
            <Card padding="md" className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
              <div className="text-center">
                <p className="text-xs text-indigo-700 mb-1 font-medium">Подтверждено</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.confirmed}</p>
              </div>
            </Card>
          )}
          <Card padding="md" className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="text-center">
              <p className="text-xs text-green-700 mb-1 font-medium">Завершено</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
          </Card>
          <Card padding="md" className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-700 mb-1 font-medium">Отменено</p>
              <p className="text-2xl font-bold text-gray-600">{stats.cancelled}</p>
            </div>
          </Card>
          {stats.totalAmount > 0 && (
            <Card padding="md" className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="text-center">
                <p className="text-xs text-purple-700 mb-1 font-medium">Потрачено</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.totalAmount.toLocaleString('ru-RU')} ֏
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Фильтры */}
        <Card padding="lg" className="border border-stroke shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-text-50" />
              <h2 className="text-lg font-semibold text-text-50">Фильтры и поиск</h2>
            </div>
            {(statusFilter || dateFromFilter || dateToFilter || doctorFilter || clinicFilter || searchQuery) && (
              <Button variant="secondary" size="sm" onClick={handleResetFilters}>
                <X className="w-4 h-4 mr-1" />
                Сбросить
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Поиск */}
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-text-50 mb-2 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Поиск по всем полям
              </label>
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Поиск по врачу, клинике, процедуре..."
                className="w-full"
              />
            </div>

            {/* Статус */}
            <div>
              <label className="block text-sm font-medium text-text-50 mb-2">Статус</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-stroke rounded-lg bg-bg-white text-sm focus:outline-none focus:border-main-100 transition-all"
              >
                <option value="">Все статусы</option>
                <option value="pending">Ожидает подтверждения</option>
                <option value="confirmed">Подтверждено</option>
                <option value="completed">Завершено</option>
                <option value="cancelled">Отменено</option>
              </select>
            </div>

            {/* Дата от */}
            <div>
              <label className="block text-sm font-medium text-text-50 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Дата от
              </label>
              <input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-stroke rounded-lg bg-bg-white text-sm focus:outline-none focus:border-main-100 transition-all"
              />
            </div>

            {/* Дата до */}
            <div>
              <label className="block text-sm font-medium text-text-50 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Дата до
              </label>
              <input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-stroke rounded-lg bg-bg-white text-sm focus:outline-none focus:border-main-100 transition-all"
              />
            </div>

            {/* Врач */}
            <div>
              <label className="block text-sm font-medium text-text-50 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Врач
              </label>
              <input
                type="text"
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                placeholder="Поиск по врачу..."
                list="doctors-list"
                className="w-full px-4 py-2.5 border border-stroke rounded-lg bg-bg-white text-sm focus:outline-none focus:border-main-100 transition-all"
              />
              <datalist id="doctors-list">
                {uniqueDoctors.map((doctor) => (
                  <option key={doctor} value={doctor} />
                ))}
              </datalist>
            </div>

            {/* Клиника */}
            <div>
              <label className="block text-sm font-medium text-text-50 mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Клиника
              </label>
              <input
                type="text"
                value={clinicFilter}
                onChange={(e) => setClinicFilter(e.target.value)}
                placeholder="Поиск по клинике..."
                list="clinics-list"
                className="w-full px-4 py-2.5 border border-stroke rounded-lg bg-bg-white text-sm focus:outline-none focus:border-main-100 transition-all"
              />
              <datalist id="clinics-list">
                {uniqueClinics.map((clinic) => (
                  <option key={clinic} value={clinic} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Сортировка */}
          <div className="pt-4 border-t border-stroke">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-text-50">Сортировка:</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as any)}
                className="px-3 py-2 border border-stroke rounded-lg bg-bg-white text-sm focus:outline-none focus:border-main-100"
              >
                <option value="date">По дате</option>
                <option value="amount">По сумме</option>
                <option value="doctor">По врачу</option>
                <option value="clinic">По клинике</option>
              </select>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              >
                {sortDirection === 'asc' ? '↑ По возрастанию' : '↓ По убыванию'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Список истории */}
        {isLoading ? (
          <Card>
            <div className="flex justify-center items-center py-12">
              <Spinner size="lg" />
            </div>
          </Card>
        ) : filteredAppointments.length === 0 ? (
          <Card>
            <div className="text-center py-12 text-text-10">
              <div className="text-5xl mb-3">📋</div>
              <p className="text-sm font-medium mb-2">История пуста</p>
              <p className="text-xs mb-4">
                {historyAppointments.length === 0
                  ? 'У вас пока нет прошлых записей или консультаций. История будет отображаться здесь после того, как вы запишетесь на прием.'
                  : 'Попробуйте изменить фильтры для поиска'}
              </p>
            </div>
          </Card>
        ) : viewMode === 'table' ? (
          <Card padding="md" className="border border-stroke shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-bg-primary border-b-2 border-stroke">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-50">Дата и время</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-50">Врач</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-50">Клиника</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-50">Процедура</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-50">Сумма</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-50">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appointment) => {
                    const aptDate = new Date(appointment.appointmentDate);
                    const isPast = aptDate < new Date();
                    const isPendingPast = isPast && (appointment.status === 'pending' || appointment.status === 'confirmed');
                    
                    return (
                    <tr
                      key={appointment.id}
                      className={`border-b border-stroke hover:bg-bg-secondary transition-colors ${
                        isPendingPast ? 'bg-yellow-50/50' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-text-50">
                          {formatAppointmentDate(appointment.appointmentDate, 'short')}
                        </div>
                        <div className="text-xs text-text-10">
                          {formatAppointmentTime(appointment.appointmentDate)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-main-10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-main-100">
                              {appointment.doctor?.name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-text-50">
                              {appointment.doctor?.name || 'Не указан'}
                            </div>
                            {appointment.doctor?.specialization && (
                              <div className="text-xs text-text-10">{appointment.doctor.specialization}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-text-50">
                          {appointment.clinic?.name || 'Не указана'}
                        </div>
                        {appointment.clinic?.city && (
                          <div className="text-xs text-text-10">📍 {appointment.clinic.city}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-text-50">
                          {appointment.reason || <span className="text-text-10 italic">Не указана</span>}
                        </div>
                        {appointment.notes && (
                          <div className="text-xs text-text-10 mt-1 line-clamp-1">{appointment.notes}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {appointment.amount ? (
                          <div className="text-sm font-medium text-green-600">
                            {appointment.amount.toLocaleString('ru-RU')} ֏
                          </div>
                        ) : (
                          <span className="text-xs text-text-10">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(appointment.status)}
                          {isPendingPast && (
                            <span className="text-xs text-yellow-600" title="Запись была в прошлом, но еще не завершена">
                              ⚠️
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAppointments.map((appointment) => {
              const aptDate = new Date(appointment.appointmentDate);
              const isPast = aptDate < new Date();
              const isPendingPast = isPast && (appointment.status === 'pending' || appointment.status === 'confirmed');
              
              return (
              <Card
                key={appointment.id}
                padding="lg"
                className={`border-2 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
                  isPendingPast 
                    ? 'border-yellow-300 bg-yellow-50/30 hover:border-yellow-400' 
                    : 'border-stroke hover:border-main-100'
                }`}
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-bold text-text-50 mb-1">
                        {formatAppointmentDate(appointment.appointmentDate, 'long')}
                      </div>
                      <div className="text-xs text-text-10 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatAppointmentTime(appointment.appointmentDate)}
                      </div>
                      {isPendingPast && (
                        <div className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                          <span>⚠️</span>
                          <span>Запись была в прошлом</span>
                        </div>
                      )}
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>

                  {/* Врач */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-main-100 to-blue-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <span className="text-xl">⚕️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-text-50 text-base mb-1">
                        {appointment.doctor?.name || 'Врач'}
                      </h3>
                      {appointment.doctor?.specialization && (
                        <p className="text-xs font-medium text-main-100">
                          {appointment.doctor.specialization}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Клиника */}
                  <div className="flex items-center gap-2 text-sm text-text-10">
                    <Building2 className="w-4 h-4" />
                    <span>{appointment.clinic?.name || 'Клиника'}</span>
                    {appointment.clinic?.city && (
                      <span className="text-xs">• {appointment.clinic.city}</span>
                    )}
                  </div>

                  {/* Процедура */}
                  {appointment.reason && (
                    <div>
                      <p className="text-xs font-medium text-text-10 mb-1">Процедура / Причина:</p>
                      <p className="text-sm text-text-50">{appointment.reason}</p>
                    </div>
                  )}

                  {/* Примечания */}
                  {appointment.notes && (
                    <div>
                      <p className="text-xs font-medium text-text-10 mb-1">Примечания:</p>
                      <p className="text-sm text-text-50 line-clamp-2">{appointment.notes}</p>
                    </div>
                  )}

                  {/* Сумма */}
                  {appointment.amount && (
                    <div className="pt-2 border-t border-stroke">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-text-10">Сумма оплаты:</span>
                        <span className="text-lg font-bold text-green-600">
                          {appointment.amount.toLocaleString('ru-RU')} ֏
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Причина отмены */}
                  {appointment.status === 'cancelled' && appointment.cancellationReason && (
                    <div className="pt-2 border-t border-stroke">
                      <p className="text-xs font-medium text-red-600 mb-1">Причина отмены:</p>
                      <p className="text-sm text-text-50">{appointment.cancellationReason}</p>
                    </div>
                  )}
                </div>
              </Card>
              );
            })}
          </div>
        )}
      </div>
    </NewDashboardLayout>
  );
};

