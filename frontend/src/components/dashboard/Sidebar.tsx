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
import webIcon from '../../assets/icons/web.svg';
import hippocratesLogo from '../../assets/icons/hippocrates-logo.png';

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
        <div className="flex items-center justify-center group cursor-pointer">
          <div className="relative">
            <img 
              src={hippocratesLogo} 
              alt="Logo" 
              className="w-44 h-24 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg object-contain" 
            />
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-10 space-y-8">
        <div className="space-y-8">
          {/* Для пациентов */}
          {user?.role === 'PATIENT' && (
            <>
              <NavLink to="/dashboard/patient" className={navLinkClass}>
                <img src={dashboardIcon} alt="Dashboard" className="w-6 h-6" />
                <span className="text-sm">Dashboard</span>
              </NavLink>

              <NavLink to="/dashboard/patient/appointments" className={navLinkClass}>
                <img src={calendarIcon} alt="Appointments" className="w-6 h-6" />
                <span className="text-sm">Appointments</span>
              </NavLink>

              <NavLink to="/dashboard/patient/clinics" className={navLinkClass}>
                <img src={doctorIcon} alt="Clinics" className="w-6 h-6" />
                <span className="text-sm">Clinics</span>
              </NavLink>

              <NavLink to="/dashboard/patient/analytics" className={navLinkClass}>
                <img src={analyticsIcon} alt="Analytics" className="w-6 h-6" />
                <span className="text-sm">Analytics</span>
              </NavLink>

              <NavLink to="/dashboard/patient/history" className={navLinkClass}>
                <img src={calendarIcon} alt="History" className="w-6 h-6" />
                <span className="text-sm">History</span>
              </NavLink>

              <NavLink to="/dashboard/patient/settings" className={navLinkClass}>
                <img src={settingsIcon} alt="Settings" className="w-6 h-6" />
                <span className="text-sm">Settings</span>
              </NavLink>
            </>
          )}

          {/* Для врачей */}
          {user?.role === 'DOCTOR' && (
            <>
              <NavLink to="/dashboard/doctor" className={navLinkClass}>
                <img src={dashboardIcon} alt="Dashboard" className="w-6 h-6" />
                <span className="text-sm">Dashboard</span>
              </NavLink>

              <NavLink to="/dashboard/doctor/appointments" className={navLinkClass}>
                <img src={calendarIcon} alt="Appointments" className="w-6 h-6" />
                <span className="text-sm">Appointment</span>
              </NavLink>

              <NavLink to="/dashboard/doctor/patients" className={navLinkClass}>
                <img src={patientIcon} alt="Patients" className="w-6 h-6" />
                <span className="text-sm">Patient</span>
              </NavLink>

              <NavLink to="/dashboard/doctor/analytics" className={navLinkClass}>
                <img src={analyticsIcon} alt="Analytics" className="w-6 h-6" />
                <span className="text-sm">Analytics</span>
              </NavLink>

              <NavLink to="/dashboard/doctor/settings" className={navLinkClass}>
                <img src={settingsIcon} alt="Settings" className="w-6 h-6" />
                <span className="text-sm">Settings</span>
              </NavLink>
            </>
          )}

          {/* Для клиник и администраторов */}
          {(user?.role === 'ADMIN' || user?.role === 'CLINIC') && (
            <>
              <NavLink to="/dashboard" className={navLinkClass}>
                <img src={dashboardIcon} alt="Dashboard" className="w-6 h-6" />
                <span className="text-sm">Dashboard</span>
              </NavLink>

              <NavLink to="/dashboard/appointments" className={navLinkClass}>
                <img src={calendarIcon} alt="Appointments" className="w-6 h-6" />
                <span className="text-sm">Appointment</span>
              </NavLink>

              <NavLink to="/dashboard/patients" className={navLinkClass}>
                <img src={patientIcon} alt="Patients" className="w-6 h-6" />
                <span className="text-sm">Patient</span>
              </NavLink>

              <NavLink to="/dashboard/doctors" className={navLinkClass}>
                <img src={doctorIcon} alt="Doctors" className="w-6 h-6" />
                <span className="text-sm">Doctors</span>
              </NavLink>

              <NavLink to="/dashboard/analytics" className={navLinkClass}>
                <img src={analyticsIcon} alt="Analytics" className="w-6 h-6" />
                <span className="text-sm">Analytic</span>
              </NavLink>

              <NavLink to="/dashboard/web" className={navLinkClass}>
                <img src={webIcon} alt="Web" className="w-6 h-6" />
                <span className="text-sm">Web</span>
              </NavLink>

              <NavLink to="/dashboard/settings" className={navLinkClass}>
                <img src={settingsIcon} alt="Settings" className="w-6 h-6" />
                <span className="text-sm">Settings</span>
              </NavLink>
            </>
          )}
        </div>
      </nav>

      {/* Bottom User Section */}
      <div className="px-10 py-6 border-t border-stroke">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-stroke bg-main-10 flex items-center justify-center flex-shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm text-main-100 font-medium">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            )}
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
