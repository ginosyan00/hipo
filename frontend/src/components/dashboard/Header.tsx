import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { NotificationDropdown } from './NotificationDropdown';
import { PatientChat } from '../chat/PatientChat';
import { ClinicChat } from '../chat/ClinicChat';
import { SearchFilterModal } from './SearchFilterModal';
import { useUnreadCount } from '../../hooks/useChat';

// Import icons
import searchIcon from '../../assets/icons/search.svg';
import arrowDownIcon from '../../assets/icons/arrow-down.svg';

/**
 * Header Component - Figma Design
 * Верхняя панель с поиском и профилем
 */
export const Header: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const toggleSidebar = useUIStore(state => state.toggleSidebar);
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const { unreadCount } = useUnreadCount();

  return (
    <header className="bg-bg-white border-b border-stroke px-8 py-6 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Left: Page Title + Mobile Menu */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-sm hover:bg-bg-primary transition-smooth"
          >
            <svg className="h-5 w-5 text-text-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-2xl font-semibold text-text-100">Dashboard</h1>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden lg:flex relative max-w-md w-full">
          <img 
            src={searchIcon} 
            alt="Search" 
            className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search..."
            onClick={() => setIsSearchModalOpen(true)}
            readOnly
            className="w-full pl-11 pr-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm placeholder-text-10 focus:outline-none focus:border-main-100 transition-smooth cursor-pointer"
          />
        </div>

        {/* Right: Icons & Profile */}
        <div className="flex items-center gap-4">
          {/* Chat Button - для CLINIC, DOCTOR и PATIENT */}
          {(user?.role === 'CLINIC' || user?.role === 'DOCTOR' || user?.role === 'PATIENT') && (
            <button
              onClick={() => setIsChatOpen(true)}
              className="relative p-2 rounded-sm hover:bg-bg-primary transition-smooth"
              title={user?.role === 'CLINIC' ? 'Чат врачей' : 'Чат'}
            >
              <svg  
                className="w-8 h-8 text-text-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-main-100 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Notifications */}
          <NotificationDropdown />

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 hover:bg-bg-primary px-2 py-1 rounded-sm transition-smooth"
            >
              <div className="w-10 h-10 bg-main-10 rounded-sm flex items-center justify-center">
                <span className="text-sm text-main-100 font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <img src={arrowDownIcon} alt="Menu" className="w-6 h-6" />
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-bg-white border border-stroke rounded-sm shadow-lg py-2">
                <div className="px-4 py-2 border-b border-stroke">
                  <p className="text-sm font-medium text-text-100">{user?.name}</p>
                  <p className="text-xs text-text-10 capitalize">{user?.role}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setShowProfileMenu(false);
                    // Используем window.location для полного перехода, чтобы избежать redirect от ProtectedRoute
                    window.location.href = '/';
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-text-50 hover:bg-bg-primary transition-smooth"
                >
                  Выйти
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Component - разный для разных ролей */}
      {user?.role === 'CLINIC' ? (
        <ClinicChat
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          mode="sidebar"
          width="800px"
        />
      ) : (user?.role === 'DOCTOR' || user?.role === 'PATIENT') ? (
        <PatientChat
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          mode="sidebar"
          width="450px"
        />
      ) : null}

      {/* Search Filter Modal */}
      <SearchFilterModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </header>
  );
};
