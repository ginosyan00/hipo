import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, useUnreadNotificationsCount, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '../../hooks/useNotifications';
import { useAuthStore } from '../../store/useAuthStore';
import { Notification } from '../../types/api.types';
import { Spinner } from '../common';
import notificationIcon from '../../assets/icons/notification.svg';

/**
 * NotificationDropdown Component
 * Dropdown для отображения уведомлений врача
 */
export const NotificationDropdown: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Определяем, для кого загружать уведомления
  const isDoctor = user?.role === 'DOCTOR';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'CLINIC';
  // Для врачей и администраторов используем userId, для пациентов - patientId
  const userId = (isDoctor || isAdmin) ? user?.id : undefined;
  const patientId = user?.role === 'PATIENT' ? undefined : undefined; // Пациенты используют patientId из их записи

  // Загружаем уведомления
  const { data: notificationsData, isLoading } = useNotifications({
    userId,
    patientId,
    limit: 10,
  });

  // Загружаем количество непрочитанных
  const { data: unreadCount = 0 } = useUnreadNotificationsCount(patientId, userId);

  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  // notificationsData - это PaginatedResponse с полями { notifications, meta }
  // API возвращает { data: { notifications, meta } }, но service возвращает data.data
  // Поэтому notificationsData уже содержит { notifications, meta }
  const notifications = notificationsData?.notifications || [];

  // Закрываем dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification: Notification) => {
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
      } else {
        navigate(`/dashboard/patient/appointments?highlight=${notification.appointmentId}`);
      }
    }

    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync(patientId, userId);
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
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-sm hover:bg-bg-primary transition-smooth"
      >
        <img src={notificationIcon} alt="Notifications" className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-bg-white border border-stroke rounded-sm shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-stroke flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-100">Уведомления</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-main-100 hover:text-main-100/80 transition-smooth"
                disabled={markAllAsReadMutation.isPending}
              >
                {markAllAsReadMutation.isPending ? '...' : 'Отметить все прочитанными'}
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="sm" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-text-10">Нет уведомлений</p>
              </div>
            ) : (
              <div className="divide-y divide-stroke">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left px-4 py-3 hover:bg-bg-primary transition-smooth ${
                      !notification.isRead ? 'bg-main-10/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                        !notification.isRead ? 'bg-main-100' : 'bg-transparent'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-100 mb-1">
                          {notification.title}
                        </p>
                        <p className="text-xs text-text-50 line-clamp-2 mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-text-10">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-stroke">
              <button
                onClick={() => {
                  navigate('/dashboard/notifications');
                  setIsOpen(false);
                }}
                className="w-full text-center text-xs text-main-100 hover:text-main-100/80 transition-smooth"
              >
                Показать все уведомления
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

