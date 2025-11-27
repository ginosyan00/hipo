import React from 'react';
import { NewDashboardLayout } from '../../components/dashboard/NewDashboardLayout';
import { AppointmentChart } from '../../components/dashboard/AppointmentChart';
import { OverviewSection } from '../../components/dashboard/OverviewSection';
import { useAuthStore } from '../../store/useAuthStore';


/**
 * Dashboard Page
 * Գեղեցիկ dashboard կլինիկայի համար
 */
export const DashboardPage: React.FC = () => {
  const user = useAuthStore(state => state.user);

  return (
    <NewDashboardLayout>
      <div className="space-y-6">
        {/* Overview Section - только для CLINIC */}
        {user?.role === 'CLINIC' && <OverviewSection />}

        <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content - Left Side */}
        <div className="flex-1 space-y-6">
          {/* Appointment Chart */}
          <AppointmentChart />
        </div>
        </div>
      </div>
    </NewDashboardLayout>
  );
};
