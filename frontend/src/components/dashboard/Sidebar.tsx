import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';

// Import icons
import dashboardIcon from '../../assets/icons/dashboard.svg';
import calendarIcon from '../../assets/icons/calendar.svg';
import doctorIcon from '../../assets/icons/doctor.svg';
import patientIcon from '../../assets/icons/patient.svg';
import analyticsIcon from '../../assets/icons/analytics.svg';
import settingsIcon from '../../assets/icons/settings.svg';
import brainLogo from '../../assets/icons/brain-logo.svg';

/**
 * Sidebar Component - Figma Design
 * Боковое меню навигации в стиле медицинского дашборда
 */
export const Sidebar: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const isSidebarOpen = useUIStore(state => state.isSidebarOpen);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-5 pr-11 pb-2 transition-smooth ${
      isActive
        ? 'text-main-100 font-semibold'
        : 'text-text-10 font-normal hover:text-text-50'
    }`;

  if (!isSidebarOpen) {
    return null;
  }

  return (
    <aside className="hidden md:flex w-64 bg-bg-primary border-r border-stroke min-h-screen flex-col">
      {/* Logo Section */}
      <div className="px-10 pt-6 pb-16">
        <div className="flex items-center gap-1">
          <img src={brainLogo} alt="Logo" className="w-10 h-10 -ml-1" />
          <h2 className="text-[21px] font-semibold text-main-100">Medic</h2>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-10 space-y-8">
        <div className="space-y-8">
          <NavLink to="/dashboard" className={navLinkClass}>
            <img src={dashboardIcon} alt="Dashboard" className="w-6 h-6" />
            <span className="text-sm">Dashboard</span>
          </NavLink>

          <NavLink to="/dashboard/appointments" className={navLinkClass}>
            <img src={calendarIcon} alt="Appointments" className="w-6 h-6" />
            <span className="text-sm">Appointment</span>
          </NavLink>

          {(user?.role === 'ADMIN' || user?.role === 'CLINIC') && (
            <NavLink to="/dashboard/doctors" className={navLinkClass}>
              <img src={doctorIcon} alt="Doctors" className="w-6 h-6" />
              <span className="text-sm">Doctors</span>
            </NavLink>
          )}

          <NavLink to="/dashboard/patients" className={navLinkClass}>
            <img src={patientIcon} alt="Patients" className="w-6 h-6" />
            <span className="text-sm">Patient</span>
          </NavLink>

          <NavLink to="/dashboard/analytics" className={navLinkClass}>
            <img src={analyticsIcon} alt="Analytics" className="w-6 h-6" />
            <span className="text-sm">Analytic</span>
          </NavLink>

          {(user?.role === 'ADMIN' || user?.role === 'CLINIC') && (
            <NavLink to="/dashboard/settings" className={navLinkClass}>
              <img src={settingsIcon} alt="Settings" className="w-6 h-6" />
              <span className="text-sm">Settings</span>
            </NavLink>
          )}
        </div>
      </nav>

      {/* Bottom User Section */}
      <div className="px-10 py-6 border-t border-stroke">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-main-10 rounded-md flex items-center justify-center">
            <span className="text-sm text-main-100 font-medium">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-100 truncate">{user?.name}</p>
            <p className="text-[10px] text-text-10 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
