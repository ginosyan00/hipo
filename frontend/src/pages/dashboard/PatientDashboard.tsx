import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NewDashboardLayout } from '../../components/dashboard/NewDashboardLayout';
import { Card, Button, Spinner } from '../../components/common';
import { useAuthStore } from '../../store/useAuthStore';
import { usePatientAppointments } from '../../hooks/usePatientAppointments';
import { useClinics } from '../../hooks/usePublic';
import { useNotifications, useUnreadNotificationsCount, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '../../hooks/useNotifications';
import { formatAppointmentDate, formatAppointmentTime } from '../../utils/dateFormat';
import { Notification, NotificationType } from '../../types/api.types';

/**
 * PatientDashboard
 * Գեղեցիկ dashboard պացիենտների համար
 */
export const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);

  // Загружаем appointments пациента
  const { data: appointmentsData, isLoading: isLoadingAppointments } = usePatientAppointments({
    limit: 20,
  });

  // Загружаем список клиник
  const { data: clinicsData, isLoading: isLoadingClinics } = useClinics();

  // Загружаем уведомления
  const { data: notificationsData, isLoading: isLoadingNotifications } = useNotifications({
    limit: 10,
  });
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  const notifications = notificationsData?.notifications || [];

  const appointments = appointmentsData?.appointments || [];
  const clinics = clinicsData?.data || [];

  // Разделяем appointments на предстоящие и завершенные
  const now = new Date();
  const upcomingAppointments = appointments.filter(
    (apt: any) => new Date(apt.appointmentDate) >= now && apt.status !== 'cancelled'
  );
  const recentVisits = appointments.filter(
    (apt: any) => new Date(apt.appointmentDate) < now || apt.status === 'completed'
  );

  // Форматирование даты и времени - используем утилиту для правильного форматирования
  // Это исправляет проблемы с часовыми поясами при отображении времени приема
  const formatDate = (dateString: string) => {
    return formatAppointmentDate(dateString, 'short');
  };

  const formatTime = (dateString: string) => {
    return formatAppointmentTime(dateString, 'short');
  };

  return (
    <NewDashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-main-100 to-blue-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold mb-2">
                Здравствуйте, {user?.name}! 👋
              </h1>
              <p className="text-white/80 text-sm">
                Рады видеть вас снова. У вас {upcomingAppointments.length} предстоящих {upcomingAppointments.length === 1 ? 'запись' : 'записей'}.
              </p>
            </div>
            <div className="hidden md:block text-6xl opacity-20">
              👤
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card padding="lg" className="hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-text-10 mb-2">Предстоящие</p>
                <h3 className="text-3xl font-bold text-main-100">{upcomingAppointments.length}</h3>
                <p className="text-xs text-text-10 mt-1">записи</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
            </div>
          </Card>

          <Card padding="lg" className="hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-text-10 mb-2">Всего визитов</p>
                <h3 className="text-3xl font-bold text-green-600">{recentVisits.length}</h3>
                <p className="text-xs text-text-10 mt-1">посещений</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏥</span>
              </div>
            </div>
          </Card>

          <Card padding="lg" className="hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-text-10 mb-2">Рецепты</p>
                <h3 className="text-3xl font-bold text-purple-600">3</h3>
                <p className="text-xs text-text-10 mt-1">активных</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💊</span>
              </div>
            </div>
          </Card>

          <Card padding="lg" className="hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-text-10 mb-2">Уведомления</p>
                <h3 className="text-3xl font-bold text-orange-600">{unreadCount}</h3>
                <p className="text-xs text-text-10 mt-1">{unreadCount === 1 ? 'новое' : unreadCount > 1 && unreadCount < 5 ? 'новых' : 'новых'}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔔</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Appointments */}
          <div className="lg:col-span-2">
            <Card padding="lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-50">Предстоящие записи</h2>
                <Button variant="primary" size="sm" onClick={() => navigate('/clinics')}>
                  ➕ Записаться
                </Button>
              </div>

              {isLoadingAppointments ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : upcomingAppointments.length === 0 ? (
                <div className="text-center py-8 text-text-10">
                  <div className="text-4xl mb-2">📅</div>
                  <p className="text-sm mb-4">Нет предстоящих записей</p>
                  <Button variant="primary" size="sm" onClick={() => navigate('/clinics')}>
                    Записаться на прием
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.map((appointment: any) => (
                    <Card key={appointment.id} className="border border-stroke hover:border-main-100 transition-colors" padding="md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-main-100 bg-opacity-10 rounded-lg flex items-center justify-center">
                            <span className="text-xl">⚕️</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-text-50 text-sm">
                              {appointment.doctor?.name || 'Врач'}
                            </h3>
                            <p className="text-xs text-text-10">
                              {appointment.doctor?.specialization || 'Специализация не указана'}
                            </p>
                            <p className="text-xs text-text-10 mt-1">
                              📍 {appointment.clinic?.name || 'Клиника'}
                            </p>
                            {appointment.reason && (
                              <p className="text-xs text-text-10 mt-1">
                                Причина: {appointment.reason}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-text-50">
                            {formatDate(appointment.appointmentDate)}
                          </p>
                          <p className="text-xs text-text-10">{formatTime(appointment.appointmentDate)}</p>
                          <span className={`inline-block px-2 py-1 mt-2 text-xs rounded ${
                            appointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {appointment.status === 'confirmed' ? 'Подтверждено' :
                             appointment.status === 'pending' ? 'Ожидает' :
                             appointment.status}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent Visits */}
            <Card padding="lg" className="mt-6">
              <h2 className="text-lg font-semibold text-text-50 mb-4">Недавние визиты</h2>
              {recentVisits.length === 0 ? (
                <div className="text-center py-8 text-text-10">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-sm">Нет завершенных визитов</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentVisits.slice(0, 5).map((visit: any) => (
                    <div key={visit.id} className="flex items-center justify-between p-3 border border-stroke rounded-lg hover:bg-bg-secondary transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg">✅</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-text-50 text-sm">
                            {visit.doctor?.name || 'Врач'}
                          </h3>
                          <p className="text-xs text-text-10">
                            {visit.doctor?.specialization || 'Специализация не указана'}
                          </p>
                          {visit.reason && (
                            <p className="text-xs text-text-10 mt-1">Причина: {visit.reason}</p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-text-10">{formatDate(visit.appointmentDate)}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Clinics List */}
            <Card padding="lg" className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-50">Доступные клиники</h2>
                <Button variant="primary" size="sm" onClick={() => navigate('/clinics')}>
                  Все клиники
                </Button>
              </div>
              {isLoadingClinics ? (
                <div className="flex justify-center py-4">
                  <Spinner />
                </div>
              ) : clinics.length === 0 ? (
                <div className="text-center py-4 text-text-10">
                  <p className="text-sm">Клиники не найдены</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {clinics.slice(0, 5).map((clinic: any) => (
                    <button
                      key={clinic.id}
                      onClick={() => navigate(`/clinic/${clinic.slug}`)}
                      className="w-full p-3 border border-stroke rounded-lg hover:border-main-100 hover:bg-main-100 hover:bg-opacity-5 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-main-100 bg-opacity-10 rounded-lg flex items-center justify-center">
                          <span className="text-lg">🏥</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-text-50 text-sm">{clinic.name}</h3>
                          <p className="text-xs text-text-10">{clinic.city}</p>
                        </div>
                        <span className="text-xs text-text-10">→</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar - Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-text-50 mb-4">Быстрые действия</h2>
              <div className="space-y-2">
                <button className="w-full p-3 border-2 border-main-100 bg-main-100 bg-opacity-5 rounded-lg hover:bg-opacity-10 transition-all text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📅</span>
                    <div>
                      <h3 className="font-medium text-main-100 text-sm">Записаться на прием</h3>
                      <p className="text-xs text-text-10">Выбрать врача и время</p>
                    </div>
                  </div>
                </button>

                <button className="w-full p-3 border border-stroke rounded-lg hover:border-main-100 hover:bg-main-100 hover:bg-opacity-5 transition-all text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📋</span>
                    <div>
                      <h3 className="font-medium text-text-50 text-sm">Мед. карта</h3>
                      <p className="text-xs text-text-10">История лечения</p>
                    </div>
                  </div>
                </button>

                <button className="w-full p-3 border border-stroke rounded-lg hover:border-main-100 hover:bg-main-100 hover:bg-opacity-5 transition-all text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">💊</span>
                    <div>
                      <h3 className="font-medium text-text-50 text-sm">Рецепты</h3>
                      <p className="text-xs text-text-10">Активные назначения</p>
                    </div>
                  </div>
                </button>

                <button className="w-full p-3 border border-stroke rounded-lg hover:border-main-100 hover:bg-main-100 hover:bg-opacity-5 transition-all text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">💬</span>
                    <div>
                      <h3 className="font-medium text-text-50 text-sm">Консультация</h3>
                      <p className="text-xs text-text-10">Задать вопрос</p>
                    </div>
                  </div>
                </button>
              </div>
            </Card>

            {/* Notifications */}
            <Card padding="lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-50">Уведомления</h2>
                {unreadCount > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => markAllAsReadMutation.mutate()}
                    isLoading={markAllAsReadMutation.isPending}
                  >
                    Отметить все прочитанными
                  </Button>
                )}
              </div>
              {isLoadingNotifications ? (
                <div className="flex justify-center py-4">
                  <Spinner />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-4 text-text-10">
                  <div className="text-3xl mb-2">🔔</div>
                  <p className="text-sm">Нет уведомлений</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {notifications.map((notification: Notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border rounded-lg transition-all cursor-pointer ${
                        notification.isRead
                          ? 'border-stroke bg-bg-white'
                          : 'border-orange-200 bg-orange-50'
                      } hover:border-main-100 hover:bg-main-100 hover:bg-opacity-5`}
                      onClick={() => {
                        if (!notification.isRead) {
                          markAsReadMutation.mutate({ id: notification.id });
                        }
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-1">
                          {notification.type === NotificationType.Cancellation && (
                            <span className="text-lg">❌</span>
                          )}
                          {notification.type === NotificationType.Reschedule && (
                            <span className="text-lg">🔄</span>
                          )}
                          {notification.type === NotificationType.Reminder && (
                            <span className="text-lg">⏰</span>
                          )}
                          {notification.type === NotificationType.Confirmation && (
                            <span className="text-lg">✅</span>
                          )}
                          {notification.type === NotificationType.Other && (
                            <span className="text-lg">📢</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className={`text-sm font-medium ${notification.isRead ? 'text-text-50' : 'text-text-100'}`}>
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-1"></span>
                            )}
                          </div>
                          <p className="text-xs text-text-10 mt-1 whitespace-pre-line">
                            {notification.message}
                          </p>
                          <p className="text-xs text-text-10 mt-2">
                            {new Date(notification.createdAt).toLocaleString('ru-RU', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Health Tips */}
            <Card className="bg-gradient-to-br from-blue-50 to-green-50 border-blue-200" padding="lg">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <h3 className="font-semibold text-text-50 text-sm mb-2">Совет дня</h3>
                  <p className="text-xs text-text-10 leading-relaxed">
                    Пейте не менее 8 стаканов воды в день для поддержания здоровья!
                  </p>
                </div>
              </div>
            </Card>

            {/* Contact Support */}
            <Card className="bg-main-100 bg-opacity-5 border-main-100" padding="md">
              <div className="text-center">
                <span className="text-2xl">📞</span>
                <h3 className="font-semibold text-text-50 text-sm mt-2 mb-1">Нужна помощь?</h3>
                <p className="text-xs text-text-10 mb-3">
                  Свяжитесь с нами
                </p>
                <Button variant="primary" size="sm" className="w-full">
                  Позвонить
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </NewDashboardLayout>
  );
};
