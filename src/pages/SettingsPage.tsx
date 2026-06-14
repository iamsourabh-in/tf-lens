import { Sun, Moon, Eye, ShieldCheck, Cpu } from 'lucide-react';

interface SettingsPageProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export function SettingsPage({ theme, setTheme }: SettingsPageProps) {
  return (
    <div className="settings-page">
      <header className="page-header">
        <h1>Settings & Configuration</h1>
        <p>Customize user interface preferences, security levels, and app profiles.</p>
      </header>

      <div className="settings-grid">
        <div className="report-card">
          <div className="report-card-header">
            <Cpu size={20} className="report-icon-accent" />
            <h3>Appearance</h3>
          </div>
          <div className="settings-row">
            <div className="settings-label">
              <strong>Theme Mode</strong>
              <p>Toggle between Light and Dark interface styles.</p>
            </div>
            <button
              type="button"
              className="button secondary theme-toggle-btn"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? (
                <>
                  <Moon size={16} />
                  Dark Mode
                </>
              ) : (
                <>
                  <Sun size={16} />
                  Light Mode
                </>
              )}
            </button>
          </div>
        </div>

        <div className="report-card">
          <div className="report-card-header">
            <ShieldCheck size={20} className="report-icon-accent" />
            <h3>Privacy & Masking</h3>
          </div>
          <div className="settings-row">
            <div className="settings-label">
              <strong>Sensitive Value Masking</strong>
              <p>Mask sensitive variables and database credentials automatically in code views.</p>
            </div>
            <label className="checkbox-wrap">
              <input type="checkbox" defaultChecked disabled />
              <span className="checkbox-indicator" />
            </label>
          </div>
          <div className="settings-row">
            <div className="settings-label">
              <strong>Local Browser Only Parsing</strong>
              <p>Process your state and plan JSON files strictly in the client. No data is sent to external servers.</p>
            </div>
            <span className="badge ok">Enabled</span>
          </div>
        </div>

        <div className="report-card">
          <div className="report-card-header">
            <Eye size={20} className="report-icon-accent" />
            <h3>About TF Lens</h3>
          </div>
          <div className="about-text">
            <p>
              <strong>TF Lens</strong> is an interactive web-based utility for browsing and auditing
              Terraform plans and tfstate files.
            </p>
            <p>Version: 1.0.0 (Professional Edition)</p>
            <p>Created to deliver a professional, high-fidelity developer inspection experience.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
