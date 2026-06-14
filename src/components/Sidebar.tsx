import { NavLink } from 'react-router-dom';
import {
  FileText,
  HelpCircle,
  LayoutGrid,
  Layers,
  Network,
  Settings,
  Sun,
  Moon,
  Database,
} from 'lucide-react';

interface SidebarProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export function Sidebar({ theme, toggleTheme }: SidebarProps) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Layers size={24} className="logo-pulse" />
        </div>
      </div>

      <nav className="sidebar-menu">
        <NavLink
          to="/plan"
          className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
          title="Plan Viewer"
        >
          <LayoutGrid size={20} />
        </NavLink>
        <NavLink
          to="/state"
          className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
          title="State Viewer"
        >
          <Database size={20} />
        </NavLink>
        <NavLink
          to="/topology"
          className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
          title="Topology Map"
        >
          <Network size={20} />
        </NavLink>
        <NavLink
          to="/reports"
          className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
          title="Security Reports"
        >
          <FileText size={20} />
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
          title="Settings"
        >
          <Settings size={20} />
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-item theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        <button type="button" className="sidebar-item" title="Help">
          <HelpCircle size={20} />
        </button>
      </div>
    </aside>
  );
}
