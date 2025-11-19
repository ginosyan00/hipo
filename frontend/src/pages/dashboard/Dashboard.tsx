import React from 'react';
import { NewDashboardLayout } from '../../components/dashboard/NewDashboardLayout';
import { AppointmentChart } from '../../components/dashboard/AppointmentChart';
import { OverviewSection } from '../../components/dashboard/OverviewSection';
import { Card } from '../../components/common';
import { useAuthStore } from '../../store/useAuthStore';


/**
 * Dashboard Page
 * Գեղեցիկ dashboard կլինիկայի համար
 */
export const DashboardPage: React.FC = () => {
  const user = useAuthStore(state => state.user);

  // Mock data for appointments table
  const upcomingAppointments = [
    {
      id: 1,
      patientName: 'Darrell Steward',
      date: '15 July 2020, 9:00 AM',
      service: 'Chiropractic Care',
    },
    {
      id: 2,
      patientName: 'Brooklyn Simmons',
      date: '15 July 2020, 9:00 AM',
      service: 'Nephrology (Kidneys)',
    },
    {
      id: 3,
      patientName: 'Cameron Williamson',
      date: '15 July 2020, 9:00 AM',
      service: 'Diabetes Education',
    },
  ];

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

          {/* Upcoming Appointments Table */}
          <Card padding="none" className="p-5">
            <h3 className="text-lg font-medium text-text-50 mb-6">Upcoming Appointment</h3>
            
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 pb-4 border-b border-stroke mb-4">
              <div className="col-span-4 text-sm font-normal text-text-10">Patient name</div>
              <div className="col-span-3 text-sm font-normal text-text-10">Date</div>
              <div className="col-span-3 text-sm font-normal text-text-10">Service</div>
              <div className="col-span-2 text-sm font-normal text-text-10">Action</div>
            </div>

            {/* Table Rows */}
            <div className="space-y-4">
              {upcomingAppointments.map(appointment => (
                <div key={appointment.id} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-main-10 rounded-sm flex items-center justify-center">
                      <span className="text-xs text-main-100 font-medium">
                        {appointment.patientName.charAt(0)}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-text-100">{appointment.patientName}</span>
                  </div>
                  <div className="col-span-3 text-xs font-medium text-text-50">{appointment.date}</div>
                  <div className="col-span-3 text-xs font-normal text-text-10">{appointment.service}</div>
                  <div className="col-span-2">
                    <button className="bg-main-10 text-main-100 px-6 py-1.5 rounded-sm text-xs font-normal hover:bg-main-100 hover:text-white transition-smooth">
                      Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        </div>
      </div>
    </NewDashboardLayout>
  );
};
