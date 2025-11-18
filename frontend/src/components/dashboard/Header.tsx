import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';

// Import icons
import searchIcon from '../../assets/icons/search.svg';
import notificationIcon from '../../assets/icons/notification.svg';
import settingsIcon from '../../assets/icons/settings.svg';
import arrowDownIcon from '../../assets/icons/arrow-down.svg';

/**
 * Header Component - Figma Design
 * Верхняя панель с поиском и профилем
 */
export const Header: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const toggleSidebar = useUIStore(state => state.toggleSidebar);
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);

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
            className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px]"
          />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-11 pr-4 py-2.5 border border-stroke rounded-sm bg-bg-white text-sm placeholder-text-10 focus:outline-none focus:border-main-100 transition-smooth"
          />
        </div>

        {/* Right: Icons & Profile */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 rounded-sm hover:bg-bg-primary transition-smooth">
            <img src={notificationIcon} alt="Notifications" className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-secondary-100 rounded-full"></span>
          </button>

          {/* Settings */}
          {(user?.role === 'ADMIN' || user?.role === 'CLINIC') && (
            <button
              onClick={() => navigate('/dashboard/settings')}
              className="p-2 rounded-sm hover:bg-bg-primary transition-smooth"
            >
              <img src={settingsIcon} alt="Settings" className="w-6 h-6" />
            </button>
          )}

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
    </header>
  );
};
