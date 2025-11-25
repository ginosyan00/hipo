import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NewDashboardLayout } from '../../components/dashboard/NewDashboardLayout';
import { Card, Button, Spinner } from '../../components/common';
import { PatientAppointmentsStats } from '../../components/dashboard/PatientAppointmentsStats';
import { PatientMiniChart } from '../../components/dashboard/PatientMiniChart';
import { useAuthStore } from '../../store/useAuthStore';
import { usePatientAppointments } from '../../hooks/usePatientAppointments';
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

  // Загружаем appointments пациента (больше данных для статистики и графиков)
  const { data: appointmentsData, isLoading: isLoadingAppointments } = usePatientAppointments({
    limit: 100, // Больше данных для графиков и статистики
  });

  // Загружаем уведомления
  const { data: notificationsData, isLoading: isLoadingNotifications } = useNotifications({
    limit: 10,
  });
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  const notifications = notificationsData?.notifications || [];

  const appointments = appointmentsData?.appointments || [];

  // Debug: Проверяем appointments и amount
  React.useEffect(() => {
    console.log('🔵 [PatientDashboard] All appointments:', appointments);
    console.log('🔵 [PatientDashboard] Completed appointments:', appointments.filter((apt: any) => apt.status === 'completed'));
    console.log('🔵 [PatientDashboard] Appointments with amount:', appointments.filter((apt: any) => apt.amount && apt.amount > 0));
    console.log('🔵 [PatientDashboard] Completed with amount:', appointments.filter((apt: any) => apt.status === 'completed' && apt.amount && apt.amount > 0));
  }, [appointments]);

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

  // Функция для получения совета дня (разный каждый день)
  const getDailyTip = (): string => {
    // Массив советов для здоровья зубов
    const tips = [
      "Пейте не менее 8 стаканов воды в день для поддержания здоровья и хорошего самочувствия!",
      "Чистите зубы дважды в день утром и вечером по 2 минуты для идеальной гигиены полости рта.",
      "Используйте зубную нить ежедневно для удаления остатков пищи между зубами.",
      "Ограничьте потребление сладких напитков и продуктов, они могут повредить эмаль зубов.",
      "Регулярно посещайте стоматолога для профилактических осмотров каждые 6 месяцев.",
      "Используйте фторсодержащую зубную пасту для укрепления эмали и предотвращения кариеса.",
      "Избегайте курения и употребления табака - они вредят здоровью зубов и десен.",
      "Ешьте больше свежих овощей и фруктов - они помогают естественному очищению зубов.",
      "Заменяйте зубную щетку каждые 3 месяца или когда щетинки изнашиваются.",
      "Используйте ополаскиватель для рта после чистки зубов для дополнительной защиты.",
      "Ограничьте перекусы между основными приемами пищи для снижения риска кариеса.",
      "Пейте зеленый чай - он содержит антиоксиданты, полезные для здоровья десен.",
      "Избегайте слишком горячих или холодных напитков, они могут повредить эмаль.",
      "Жуйте жевательную резинку без сахара после еды для стимуляции слюноотделения.",
      "Используйте мягкую зубную щетку, чтобы не повредить десны при чистке.",
      "Массируйте десны мягкими круговыми движениями во время чистки зубов.",
      "Ограничьте потребление кислых продуктов, они могут разъедать эмаль зубов.",
      "Пейте молоко и ешьте молочные продукты - они богаты кальцием для крепких зубов.",
      "Избегайте использования зубов как инструмента для открывания упаковок.",
      "Практикуйте правильную технику чистки зубов - движения должны быть мягкими и круговыми.",
      "Используйте зубную пасту с фтором, одобренную стоматологической ассоциацией.",
      "Ограничьте потребление кофе и чая, они могут окрашивать зубы.",
      "Пейте воду после каждого приема пищи для естественного очищения полости рта.",
      "Избегайте стресса - он может привести к скрежетанию зубами во сне.",
      "Ешьте продукты, богатые витамином C, для здоровья десен.",
      "Используйте электрическую зубную щетку для более эффективной чистки.",
      "Ограничьте потребление алкоголя - он может сушить рот и способствовать кариесу.",
      "Практикуйте дыхание через нос, а не через рот, для поддержания здоровья полости рта.",
      "Регулярно проверяйте десны на наличие признаков воспаления или кровотечения.",
      "Пейте зеленый чай без сахара - он помогает бороться с бактериями во рту.",
      "Используйте зубную пасту с натуральными ингредиентами, если у вас чувствительные зубы.",
    ];

    // Получаем текущую дату и используем её как seed для выбора совета
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    
    // Используем день года для выбора совета (гарантирует одинаковый совет в течение дня)
    const tipIndex = dayOfYear % tips.length;
    
    return tips[tipIndex];
  };

  const dailyTip = getDailyTip();

  return (
    <NewDashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-main-100 via-blue-500 to-purple-600 rounded-2xl p-6 md:p-8 text-white shadow-xl animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Здравствуйте, {user?.name}! 👋
              </h1>
              <p className="text-white/90 text-sm md:text-base">
                Рады видеть вас снова. У вас <strong>{upcomingAppointments.length}</strong> предстоящих {upcomingAppointments.length === 1 ? 'запись' : 'записей'}.
              </p>
              {upcomingAppointments.length > 0 && (
                <p className="text-white/70 text-xs mt-2">
                  Ближайшая запись: {formatDate(upcomingAppointments[0]?.appointmentDate)} в {formatTime(upcomingAppointments[0]?.appointmentDate)}
                </p>
              )}
            </div>
            <div className="hidden md:block">
              {user?.avatar ? (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl bg-white/10 flex items-center justify-center">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white/30 shadow-2xl bg-white/20 flex items-center justify-center text-4xl md:text-6xl text-white/80 font-bold">
                  {user?.name?.charAt(0).toUpperCase() || '👤'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Совет дня - Prominent Position */}
        <Card className="bg-gradient-to-br from-blue-50 via-green-50 to-blue-50 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-top-4" padding="lg">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 animate-pulse">
              <span className="text-3xl">💡</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-bold text-text-100 text-lg">Совет дня</h3>
                <span className="px-2 py-1 bg-main-100 text-white text-xs font-medium rounded-full">
                  {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                </span>
              </div>
              <p className="text-base text-text-50 leading-relaxed font-medium">
                {dailyTip}
              </p>
            </div>
          </div>
        </Card>

        {/* Расширенная статистика */}
        <PatientAppointmentsStats
          appointments={appointments}
          isLoading={isLoadingAppointments}
        />

        {/* Мини-графики */}
        {appointments.length > 0 && (
          <PatientMiniChart 
            appointments={appointments} 
            isLoading={isLoadingAppointments}
          />
        )}

        {/* Уведомления карточка (для быстрого доступа) */}
        {unreadCount > 0 && (
          <Card padding="lg" className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 animate-in fade-in slide-in-from-left-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                  <span className="text-3xl">🔔</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-orange-900">
                    {unreadCount} {unreadCount === 1 ? 'новое уведомление' : unreadCount < 5 ? 'новых уведомления' : 'новых уведомлений'}
                  </h3>
                  <p className="text-sm text-orange-700">У вас есть непрочитанные уведомления</p>
                </div>
              </div>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => markAllAsReadMutation.mutate()}
                isLoading={markAllAsReadMutation.isPending}
              >
                Прочитать все
              </Button>
            </div>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Appointments */}
          <div className="lg:col-span-2 space-y-6">
            <Card padding="lg" className="border border-stroke shadow-md hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-text-50 mb-1">Предстоящие записи</h2>
                  <p className="text-xs text-text-10">Ваши ближайшие приемы</p>
                </div>
                <Button variant="primary" size="sm" onClick={() => navigate('/dashboard/patient/clinics')} className="shadow-md hover:shadow-lg transition-shadow">
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
                  <Button variant="primary" size="sm" onClick={() => navigate('/dashboard/patient/clinics')}>
                    Записаться на прием
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.map((appointment: any, index: number) => (
                    <Card
                      key={appointment.id}
                      className="border-2 border-stroke hover:border-main-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
                      padding="md"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-14 h-14 bg-gradient-to-br from-main-100 to-blue-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                            <span className="text-2xl">⚕️</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-text-50 text-base mb-1">
                              {appointment.doctor?.name || 'Врач'}
                            </h3>
                            <p className="text-xs font-medium text-main-100 mb-1">
                              {appointment.doctor?.specialization || 'Специализация не указана'}
                            </p>
                            <p className="text-xs text-text-10 flex items-center gap-1">
                              <span>📍</span>
                              {appointment.clinic?.name || 'Клиника'}
                            </p>
                            {appointment.reason && (
                              <p className="text-xs text-text-10 mt-1 line-clamp-1">
                                <span className="font-medium">Причина:</span> {appointment.reason}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="bg-main-10 px-3 py-2 rounded-lg mb-2">
                            <p className="text-sm font-bold text-main-100">
                              {formatDate(appointment.appointmentDate)}
                            </p>
                            <p className="text-xs font-medium text-main-100">{formatTime(appointment.appointmentDate)}</p>
                          </div>
                          <span
                            className={`inline-block px-3 py-1 text-xs font-medium rounded-full shadow-sm ${
                              appointment.status === 'confirmed'
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : appointment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}
                          >
                            {appointment.status === 'confirmed'
                              ? '✅ Подтверждено'
                              : appointment.status === 'pending'
                              ? '⏳ Ожидает'
                              : appointment.status}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent Visits */}
            <Card padding="lg" className="border border-stroke shadow-md hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-text-50 mb-1">История визитов</h2>
                  <p className="text-xs text-text-10">Полная история всех посещений</p>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => navigate('/dashboard/patient/history')}
                  className="shadow-md hover:shadow-lg transition-shadow"
                >
                  📋 Вся история
                </Button>
              </div>
              {recentVisits.length === 0 ? (
                <div className="text-center py-12 text-text-10">
                  <div className="text-5xl mb-3 animate-pulse">✅</div>
                  <p className="text-sm font-medium">Нет завершенных визитов</p>
                  <p className="text-xs mt-1">Ваша история визитов появится здесь после завершения приема</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentVisits.slice(0, 5).map((visit: any, index: number) => (
                    <div
                      key={visit.id}
                      className="flex items-center justify-between p-4 border-2 border-stroke rounded-xl hover:border-green-200 hover:bg-green-50 transition-all duration-300 transform hover:-translate-x-1 animate-in fade-in slide-in-from-left-4"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                          <span className="text-xl">✅</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-text-50 text-sm mb-1">
                            {visit.doctor?.name || 'Врач'}
                          </h3>
                          <p className="text-xs font-medium text-green-600 mb-1">
                            {visit.doctor?.specialization || 'Специализация не указана'}
                          </p>
                          <p className="text-xs text-text-10 flex items-center gap-1 mb-1">
                            <span>📍</span>
                            {visit.clinic?.name || 'Клиника'}
                            {visit.clinic?.city && <span className="text-text-10">• {visit.clinic.city}</span>}
                          </p>
                          {visit.reason && (
                            <p className="text-xs text-text-10 line-clamp-1">
                              <span className="font-medium">Причина:</span> {visit.reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-medium text-text-50 whitespace-nowrap">
                          {formatDate(visit.appointmentDate)}
                        </p>
                        <p className="text-xs text-text-10 mb-2">{formatTime(visit.appointmentDate)}</p>
                        {visit.amount && visit.status === 'completed' && (
                          <div className="mt-2 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg">
                            <p className="text-xs font-medium text-emerald-700 mb-0.5">Оплачено</p>
                            <p className="text-sm font-bold text-emerald-600">
                              {visit.amount.toLocaleString('ru-RU')} ֏
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {recentVisits.length > 5 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => navigate('/dashboard/patient/history')}
                    >
                      Показать всю историю ({recentVisits.length})
                    </Button>
                  )}
                </div>
              )}
            </Card>

          </div>

          {/* Sidebar - Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card padding="lg" className="border border-stroke shadow-md hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-right-4">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-text-50 mb-1">Быстрые действия</h2>
                <p className="text-xs text-text-10">Часто используемые функции</p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/dashboard/patient/clinics')}
                  className="w-full p-4 border-2 border-main-100 bg-gradient-to-r from-main-100 bg-opacity-10 to-blue-500 bg-opacity-5 rounded-xl hover:from-main-100 hover:to-blue-500 hover:bg-opacity-10 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg text-left animate-in fade-in slide-in-from-right-4"
                  style={{ animationDelay: '0ms' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-main-100 to-blue-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                      <span className="text-xl">🏥</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-main-100 text-sm mb-1">Выбрать клинику</h3>
                      <p className="text-xs text-text-10">Просмотреть все доступные клиники</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/dashboard/patient/history')}
                  className="w-full p-4 border-2 border-stroke rounded-xl hover:border-green-400 hover:bg-green-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md text-left animate-in fade-in slide-in-from-right-4"
                  style={{ animationDelay: '100ms' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                      <span className="text-xl">📋</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-text-50 text-sm mb-1">История визитов</h3>
                      <p className="text-xs text-text-10">Полная история посещений</p>
                    </div>
                  </div>
                </button>

                <button
                  className="w-full p-4 border-2 border-stroke rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md text-left animate-in fade-in slide-in-from-right-4"
                  style={{ animationDelay: '200ms' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                      <span className="text-xl">💊</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-text-50 text-sm mb-1">Рецепты</h3>
                      <p className="text-xs text-text-10">Активные назначения</p>
                    </div>
                  </div>
                </button>

                <button
                  className="w-full p-4 border-2 border-stroke rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md text-left animate-in fade-in slide-in-from-right-4"
                  style={{ animationDelay: '300ms' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                      <span className="text-xl">💬</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-text-50 text-sm mb-1">Консультация</h3>
                      <p className="text-xs text-text-10">Задать вопрос</p>
                    </div>
                  </div>
                </button>
              </div>
            </Card>

            {/* Contact Support */}
            <Card className="bg-gradient-to-br from-main-100 bg-opacity-10 to-blue-500 bg-opacity-5 border-2 border-main-100 shadow-md hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-right-4" padding="lg">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-main-100 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
                  <span className="text-3xl">📞</span>
                </div>
                <h3 className="font-bold text-text-50 text-base mb-2">Нужна помощь?</h3>
                <p className="text-xs text-text-10 mb-4">
                  Свяжитесь с нами в любое время
                </p>
                <Button variant="primary" size="sm" className="w-full shadow-md hover:shadow-lg transition-shadow">
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
