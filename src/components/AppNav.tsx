import { Database, FileDiff } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export function AppNav() {
  return (
    <nav className="app-nav">
      <NavLink
        to="/plan"
        className={({ isActive }) => (isActive ? 'active' : '')}
      >
        <FileDiff size={18} aria-hidden="true" />
        Plan Viewer
      </NavLink>
      <NavLink
        to="/state"
        className={({ isActive }) => (isActive ? 'active' : '')}
      >
        <Database size={18} aria-hidden="true" />
        State Viewer
      </NavLink>
    </nav>
  );
}
