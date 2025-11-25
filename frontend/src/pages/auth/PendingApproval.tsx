import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common';
import { useAuthStore } from '../../store/useAuthStore';

// Import logo
import hippocratesLogo from '../../assets/icons/hippocrates-logo.png';

/**
 * PendingApproval Page
 * Страница ожидания одобрения для Doctor и Partner
 */
export const PendingApprovalPage: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  const getRoleTitle = () => {
    if (user?.role === 'CLINIC') return 'клиники';
    if (user?.role === 'PARTNER') return 'партнера';
    return 'пользователя';
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4 group">
            <div className="relative">
              <img 
                src={hippocratesLogo} 
                alt="Logo" 
                className="w-48 h-28 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg object-contain" 
              />
            </div>
          </div>
        </div>

        <Card padding="lg">
          <div className="text-center space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <div>
              <h2 className="text-xl font-semibold text-text-50 mb-2">Заявка на рассмотрении</h2>
              <p className="text-sm text-text-10">
                Спасибо за регистрацию в качестве {getRoleTitle()}!
              </p>
            </div>

            {/* Content */}
            <Card className="bg-yellow-50 border-yellow-200" padding="md">
              <div className="text-left space-y-3">
                <p className="text-sm text-yellow-800">
                  <strong>Ваша заявка проходит проверку:</strong>
                </p>
                <ul className="text-xs text-yellow-700 space-y-2 list-disc list-inside">
                  <li>Проверка документов и лицензии</li>
                  <li>Верификация контактной информации</li>
                  <li>Одобрение администратором</li>
                </ul>
                <p className="text-xs text-yellow-700 mt-4">
                  Обычно процесс занимает <strong>1-2 рабочих дня</strong>. Мы отправим уведомление на ваш email:{' '}
                  <strong className="break-all">{user?.email}</strong>
                </p>
              </div>
            </Card>

            {/* User info */}
            <div className="text-left space-y-2">
              <p className="text-xs text-text-10">
                <strong>Имя:</strong> {user?.name}
              </p>
              <p className="text-xs text-text-10">
                <strong>Email:</strong> {user?.email}
              </p>
              <p className="text-xs text-text-10">
                <strong>Роль:</strong> {user?.role}
              </p>
              <p className="text-xs text-text-10">
                <strong>Статус:</strong>{' '}
                <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-600 rounded">
                  PENDING
                </span>
              </p>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-stroke space-y-2">
              <button
                onClick={logout}
                className="w-full px-4 py-2 text-sm text-text-10 hover:text-main-100 transition-colors"
              >
                Выйти из аккаунта
              </button>
              <Link
                to="/"
                className="block w-full px-4 py-2 text-sm text-main-100 hover:underline"
              >
                На главную
              </Link>
            </div>
          </div>
        </Card>

        {/* Support */}
        <div className="mt-6 text-center">
          <p className="text-xs text-text-10">
            Вопросы? Свяжитесь с нами:{' '}
            <a href="mailto:support@medic.am" className="text-main-100 hover:underline">
              support@medic.am
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

