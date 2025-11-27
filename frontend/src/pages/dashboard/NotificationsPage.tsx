import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NewDashboardLayout } from '../../components/dashboard/NewDashboardLayout';
import { Card, Button, Spinner } from '../../components/common';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
} from '../../hooks/useNotifications';
import { useAuthStore } from '../../store/useAuthStore';
import { Notification } from '../../types/api.types';
import notificationIcon from '../../assets/icons/notification.svg';

/**
 * NotificationsPage
 * Страница со всеми уведомлениями для всех ролей
 */
export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Определяем, для кого загружать уведомления
  const isDoctor = user?.role === 'DOCTOR';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'CLINIC';
  // Для врачей и администраторов используем userId, для пациентов - API определит по токену
  const userId = (isDoctor || isAdmin) ? user?.id : undefined;
  const patientId = undefined; // API определит по токену для всех ролей

  // Параметры для загрузки уведомлений
  const notificationParams = {
    userId,
    patientId,
    isRead: filter === 'all' ? undefined : filter === 'read',
    limit: 100,
  };

  // Загружаем уведомления
  const { data: notificationsData, isLoading } = useNotifications(notificationParams);
  const notifications = notificationsData?.notifications || [];

  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const deleteMutation = useDeleteNotification();

  const handleNotificationClick = async (notification: Notification) => {
    // Отмечаем как прочитанное, если не прочитано
    if (!notification.isRead) {
      await markAsReadMutation.mutateAsync({
        id: notification.id,
        patientId,
        userId,
      });
    }

    // Переход к appointment, если есть appointmentId
    if (notification.appointmentId) {
      if (isAdmin || isDoctor) {
        navigate(`/dashboard/appointments?highlight=${notification.appointmentId}`);
      } else if (user?.role === 'PATIENT') {
        navigate(`/dashboard/patient/appointments?highlight=${notification.appointmentId}`);
      }
    }
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsReadMutation.mutateAsync({
        id: notification.id,
        patientId,
        userId,
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync(patientId, userId);
  };

  const handleDelete = async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Удалить это уведомление?')) {
      await deleteMutation.mutateAsync({
        id: notification.id,
        patientId,
        userId,
      });
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    if (days < 7) return `${days} дн назад`;
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NewDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-text-100">Уведомления</h1>
            <p className="text-sm text-text-10 mt-1">
              Все ваши уведомления в одном месте
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? '...' : 'Отметить все прочитанными'}
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-sm text-sm font-medium transition-smooth ${
              filter === 'all'
                ? 'bg-main-100 text-white'
                : 'bg-bg-primary text-text-50 hover:bg-bg-primary/80'
            }`}
          >
            Все ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-sm text-sm font-medium transition-smooth ${
              filter === 'unread'
                ? 'bg-main-100 text-white'
                : 'bg-bg-primary text-text-50 hover:bg-bg-primary/80'
            }`}
          >
            Непрочитанные ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-sm text-sm font-medium transition-smooth ${
              filter === 'read'
                ? 'bg-main-100 text-white'
                : 'bg-bg-primary text-text-50 hover:bg-bg-primary/80'
            }`}
          >
            Прочитанные ({notifications.length - unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <Card padding="none" className="overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <img src={notificationIcon} alt="No notifications" className="w-16 h-16 opacity-30 mb-4" />
              <p className="text-lg font-medium text-text-50 mb-2">Нет уведомлений</p>
              <p className="text-sm text-text-10 text-center">
                {filter === 'all'
                  ? 'У вас пока нет уведомлений'
                  : filter === 'unread'
                  ? 'Все уведомления прочитаны'
                  : 'Нет прочитанных уведомлений'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stroke">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-bg-primary transition-smooth cursor-pointer ${
                    !notification.isRead ? 'bg-main-10/10' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-4">
                    {/* Indicator */}
                    <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                      !notification.isRead ? 'bg-main-100' : 'bg-transparent'
                    }`} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className={`text-sm font-medium mb-1 ${
                            !notification.isRead ? 'text-text-100' : 'text-text-50'
                          }`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-text-50 mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-text-10">
                            <span>{formatDate(notification.createdAt)}</span>
                            {notification.type && (
                              <span className="px-2 py-0.5 bg-bg-primary rounded-sm">
                                {notification.type}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {!notification.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notification)}
                              className="px-3 py-1 text-xs text-main-100 hover:bg-main-10 rounded-sm transition-smooth"
                              disabled={markAsReadMutation.isPending}
                            >
                              Прочитано
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(notification, e)}
                            className="px-3 py-1 text-xs text-red-500 hover:bg-red-50 rounded-sm transition-smooth"
                            disabled={deleteMutation.isPending}
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </NewDashboardLayout>
  );
};

