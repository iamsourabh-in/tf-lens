import {
  FileText,
  Heart,
  HelpCircle,
  LayoutGrid,
  Layers,
  LogOut,
  Network,
  Settings,
} from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        {/* Custom premium logo symbol */}
        <div className="sidebar-logo">
          <Layers size={24} className="logo-pulse" />
        </div>
      </div>

      <nav className="sidebar-menu">
        <button type="button" className="sidebar-item active" title="Dashboard">
          <LayoutGrid size={20} />
        </button>
        <button type="button" className="sidebar-item" title="Favorites">
          <Heart size={20} />
        </button>
        <button type="button" className="sidebar-item" title="Topology">
          <Network size={20} />
        </button>
        <button type="button" className="sidebar-item" title="Reports">
          <FileText size={20} />
        </button>
        <button type="button" className="sidebar-item" title="Settings">
          <Settings size={20} />
        </button>
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="sidebar-item" title="Help">
          <HelpCircle size={20} />
        </button>
        <button type="button" className="sidebar-item logout-btn" title="Logout">
          <LogOut size={20} />
        </button>
      </div>
    </aside>
  );
}
