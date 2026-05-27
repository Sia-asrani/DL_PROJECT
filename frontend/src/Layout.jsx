import React, { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';

const Layout = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('mindsight_theme') || 'dark');
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const topbarMenusRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('mindsight_theme', theme);
  }, [theme]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (topbarMenusRef.current && !topbarMenusRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  return (
    <div className={`flex flex-col min-h-screen bg-background text-textMain ${theme === 'light' ? 'theme-light' : ''}`}>
      {/* Top Navbar */}
      <header className="h-[72px] bg-surface flex items-center justify-between px-8 z-20 shadow-none border-b border-border">
        <div className="flex items-center w-64">
          <span className="font-bold text-2xl tracking-tight text-white">MindSight AI</span>
        </div>
        
        <nav className="flex items-center gap-10 font-medium text-[15px] text-textMuted h-full">
          <NavLink to="/dashboard" className={({ isActive }) => `flex items-center h-full border-b-2 transition-colors ${isActive ? 'border-primary text-primary' : 'border-transparent hover:text-white'}`}>Analytics</NavLink>
          <NavLink to="/predict" className={({ isActive }) => `flex items-center h-full border-b-2 transition-colors ${isActive ? 'border-primary text-primary' : 'border-transparent hover:text-white'}`}>Screening</NavLink>
          <NavLink to="/logs" className={({ isActive }) => `flex items-center h-full border-b-2 transition-colors ${isActive ? 'border-primary text-primary' : 'border-transparent hover:text-white'}`}>History</NavLink>
        </nav>
        
        <div ref={topbarMenusRef} className="relative flex items-center gap-5 text-textMuted">
          <button
            type="button"
            onClick={() => {
              setIsNotificationsOpen((open) => !open);
              setIsSettingsOpen(false);
            }}
            className="material-symbols-outlined text-[22px] cursor-pointer transition-colors hover:text-white"
            aria-label="Open notifications"
          >
            notifications
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSettingsOpen((open) => !open);
              setIsNotificationsOpen(false);
            }}
            className="material-symbols-outlined text-[22px] cursor-pointer transition-colors hover:text-white"
            aria-label="Open settings"
          >
            settings
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-14 top-12 w-64 rounded-xl border border-border bg-surface p-4 shadow-xl">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              <p className="mt-2 text-sm text-textMuted">No new notifications right now.</p>
            </div>
          )}

          {isSettingsOpen && (
            <div className="absolute right-0 top-12 w-64 rounded-xl border border-border bg-surface p-4 shadow-xl">
              <h3 className="text-sm font-semibold text-white">Settings</h3>
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    theme === 'dark'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-textMain hover:bg-surfaceHover'
                  }`}
                >
                  Dark Theme
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    theme === 'light'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-textMain hover:bg-surfaceHover'
                  }`}
                >
                  Light Theme
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 bg-surface flex flex-col py-8 border-r border-border">
          <div className="px-8 mb-8">
            <h3 className="text-[11px] font-bold text-textMuted tracking-[0.2em] uppercase mb-1">Dashboard Menu</h3>
            <p className="text-[11px] text-textMuted italic">Student Predictor</p>
          </div>
          
          <div className="flex-1 flex flex-col gap-2 px-5">
            <NavItem to="/dashboard" icon="dashboard" label="Overview" isUpper={true} />
            <NavItem to="/predict" icon="person_search" label="Screening" isUpper={true} />
            <NavItem to="/batch" icon="layers" label="Batching" isUpper={true} />
            
            <div className="mt-8">
              <button className="w-full bg-primary hover:bg-primaryLight text-white rounded-lg py-3.5 font-medium text-sm transition-colors shadow-sm flex items-center justify-center">
                Generate Report
              </button>
            </div>
          </div>
          
          <div className="mt-auto px-5 flex flex-col gap-2 pt-6">
            <ActionItem icon="help" label="Support" isUpper={false} onClick={() => setIsSupportOpen(true)} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-10 relative">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {isSupportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Support Resources</h2>
                <p className="mt-2 text-sm text-textMuted">
                  If you need immediate support, please contact a trusted campus or local mental health resource.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSupportOpen(false)}
                className="text-textMuted transition-colors hover:text-white"
                aria-label="Close support dialog"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mt-6 space-y-4 rounded-xl border border-border bg-surfaceHover/60 p-4 text-sm text-textMain">
              <p><span className="font-medium text-white">Campus Counsellor:</span> Student Wellness Center, Room B-204</p>
              <p><span className="font-medium text-white">Office Hours:</span> Monday to Friday, 9:00 AM to 5:00 PM</p>
              <p><span className="font-medium text-white">Phone:</span> +1 (555) 210-4477</p>
              <p><span className="font-medium text-white">Email:</span> support@campuswellness.example</p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSupportOpen(false)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primaryLight"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NavItem = ({ to, icon, label, isUpper }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group ${
          isActive
            ? 'bg-surfaceHover text-primary font-medium border border-border shadow-sm'
            : 'text-textMuted hover:text-white border border-transparent'
        }`
      }
    >
      <span className="material-symbols-outlined text-[20px] opacity-80 group-hover:opacity-100">{icon}</span>
      <span className={`text-[13px] ${isUpper ? 'uppercase tracking-wider' : ''}`}>{label}</span>
    </NavLink>
  );
};

const ActionItem = ({ icon, label, isUpper, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group text-textMuted hover:text-white border border-transparent w-full text-left"
  >
    <span className="material-symbols-outlined text-[20px] opacity-80 group-hover:opacity-100">{icon}</span>
    <span className={`text-[13px] ${isUpper ? 'uppercase tracking-wider' : ''}`}>{label}</span>
  </button>
);

export default Layout;
