import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-textMain">
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
        
        <div className="flex items-center gap-5 text-textMuted">
          <span className="material-symbols-outlined text-[22px] cursor-pointer hover:text-white">notifications</span>
          <span className="material-symbols-outlined text-[22px] cursor-pointer hover:text-white">settings</span>
          <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="w-9 h-9 rounded-full border border-border cursor-pointer object-cover shadow-sm bg-surfaceHover" />
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
            <NavItem to="/support" icon="help" label="Support" isUpper={false} />
            <NavItem to="/logout" icon="logout" label="Sign Out" isUpper={false} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-10 relative">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
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

export default Layout;
