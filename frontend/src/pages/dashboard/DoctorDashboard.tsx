import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NewDashboardLayout } from '../../components/dashboard/NewDashboardLayout';
import { DoctorOverviewSection } from '../../components/dashboard/DoctorOverviewSection';
import { Card, Button } from '../../components/common';
import { useAuthStore } from '../../store/useAuthStore';

/**
 * DoctorDashboard
 * Dashboard для врачей - обзор всех модулей
 * Показывает статистику из Appointments, Patients и других разделов
 * Appointments функциональность вынесена в отдельную страницу /dashboard/doctor/appointments
 */
export const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);

  return (
    <NewDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-text-50 mb-2">
            Добро пожаловать, Доктор {user?.name}! ⚕️
          </h1>
          <p className="text-sm text-text-10">
            Специализация: {user?.specialization || 'Не указано'} • Опыт: {user?.experience || 0} лет
          </p>
        </div>

        {/* Overview Section - показывает статистику из всех модулей */}
        <DoctorOverviewSection />

        {/* License Info */}
        {user?.licenseNumber && (
          <Card className="bg-green-50 border-green-200" padding="md">
            <p className="text-sm text-green-800">
              <strong>✅ Лицензия подтверждена:</strong> {user.licenseNumber}
            </p>
          </Card>
        )}
      </div>
    </NewDashboardLayout>
  );
};

