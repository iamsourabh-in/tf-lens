import { useLocation } from 'react-router-dom';
import { Search, ChevronRight, User } from 'lucide-react';

interface TopBarProps {
  planFileName?: string;
  stateFileName?: string;
}

export function TopBar({ planFileName, stateFileName }: TopBarProps) {
  const location = useLocation();

  // Determine page title and breadcrumbs based on location
  const getBreadcrumbs = () => {
    switch (location.pathname) {
      case '/':
        return { category: 'tf-lens', page: 'Onboarding & Guide' };
      case '/plan':
        return { category: 'Dashboard', page: 'Plan Analyzer' };
      case '/state':
        return { category: 'Dashboard', page: 'State Explorer' };
      case '/topology':
        return { category: 'Infrastructure', page: 'Topology Graph' };
      case '/reports':
        return { category: 'Audit', page: 'Security & Compliance' };
      case '/settings':
        return { category: 'Management', page: 'Settings' };
      default:
        return { category: 'Dashboard', page: 'Analyzer' };
    }
  };

  const { category, page } = getBreadcrumbs();
  const currentFile = location.pathname === '/state' ? stateFileName : planFileName;

  return (
    <header className="site-top-bar">
      <div className="top-bar-left">
        <span className="breadcrumb-category">{category}</span>
        <ChevronRight size={14} className="breadcrumb-separator" />
        <span className="breadcrumb-page">{page}</span>
        
        {currentFile ? (
          <div className="workspace-badge ok">
            <span className="workspace-dot" />
            Workspace: <strong>{currentFile}</strong>
          </div>
        ) : (
          <div className="workspace-badge warn">
            <span className="workspace-dot" />
            No configuration loaded
          </div>
        )}
      </div>

      <div className="top-bar-right">
        <div className="top-bar-search">
          <Search size={16} className="search-icon" />
          <input type="text" placeholder="Search resources..." aria-label="Search" />
        </div>

        <div className="user-profile">
          <div className="user-avatar" title="Sourabh Rustagi">
            <User size={16} />
          </div>
          <span className="user-status-dot" />
        </div>
      </div>
    </header>
  );
}
