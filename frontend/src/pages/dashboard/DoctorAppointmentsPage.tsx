import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NewDashboardLayout } from '../../components/dashboard/NewDashboardLayout';
import { DoctorAppointmentsSection } from '../../components/dashboard/DoctorAppointmentsSection';
import { Card } from '../../components/common';

/**
 * DoctorAppointmentsPage
 * Отдельная страница приёмов для врачей
 * Показывает все приёмы текущего врача с полным функционалом управления:
 * - Просмотр всех приёмов (только для текущего врача)
 * - Фильтрация по статусу, дате, времени, неделе, категории
 * - Статистика по статусам
 * - Создание новых приёмов
 * - Управление статусами (подтверждение, завершение, отмена)
 * - Редактирование суммы для завершенных приёмов
 * - Табличный и карточный вид отображения
 */
export const DoctorAppointmentsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <NewDashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold text-text-100">Мои приёмы</h1>
          <p className="text-text-10 text-sm mt-1">
            Управление всеми вашими приёмами - просмотр, создание и изменение статусов
          </p>
        </div>

        {/* Quick Actions */}
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-text-50 mb-4">Быстрые действия</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => navigate('/dashboard/doctor')}
              className="p-3 border border-stroke rounded-lg hover:border-main-100 hover:bg-main-100 hover:bg-opacity-5 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="text-xl">📊</div>
                <div>
                  <h3 className="font-medium text-text-50 text-sm">Dashboard</h3>
                  <p className="text-xs text-text-10">Главная страница</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/dashboard/patients')}
              className="p-3 border border-stroke rounded-lg hover:border-main-100 hover:bg-main-100 hover:bg-opacity-5 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="text-xl">👥</div>
                <div>
                  <h3 className="font-medium text-text-50 text-sm">Мои пациенты</h3>
                  <p className="text-xs text-text-10">Просмотр базы пациентов</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/dashboard/doctor/analytics')}
              className="p-3 border border-stroke rounded-lg hover:border-main-100 hover:bg-main-100 hover:bg-opacity-5 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="text-xl">📈</div>
                <div>
                  <h3 className="font-medium text-text-50 text-sm">Статистика</h3>
                  <p className="text-xs text-text-10">Моя статистика и аналитика</p>
                </div>
              </div>
            </button>
          </div>
        </Card>

        {/* Appointments Section with all functionality */}
        <DoctorAppointmentsSection />
      </div>
    </NewDashboardLayout>
  );
};

