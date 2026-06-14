import { useEffect, useState } from 'react';
import { Layers } from 'lucide-react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppNav } from './components/AppNav';
import { Sidebar } from './components/Sidebar';
import { PlanViewerPage } from './pages/PlanViewerPage';
import { StateViewerPage } from './pages/StateViewerPage';
import { TopologyPage } from './pages/TopologyPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import type { ParsedPlan } from './types/plan';
import type { ParsedState } from './types/state';
import './styles/app.css';

function App() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('tf-lens-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tf-lens-theme', theme);
  }, [theme]);

  // Lifted Plan Viewer states
  const [plan, setPlan] = useState<ParsedPlan | null>(null);
  const [planFileName, setPlanFileName] = useState<string | undefined>();
  const [planFileSize, setPlanFileSize] = useState<number | undefined>();

  // Lifted State Viewer states
  const [state, setState] = useState<ParsedState | null>(null);
  const [stateFileName, setStateFileName] = useState<string | undefined>();
  const [stateFileSize, setStateFileSize] = useState<number | undefined>();

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar theme={theme} toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')} />
        <div className="app-main-content">
          <div className="app">
            <header className="app-header">
              <div className="app-header-brand">
                <img src="/favicon.svg" alt="" className="app-logo" width={36} height={36} />
                <div>
                  <h1>
                    <Layers size={22} aria-hidden="true" className="app-title-icon" />
                    Terraform Viewer
                  </h1>
                  <p>Explore Terraform plan and state files in your browser.</p>
                </div>
              </div>
            </header>

            <AppNav />

            <Routes>
              <Route path="/" element={<Navigate to="/plan" replace />} />
              <Route
                path="/plan"
                element={
                  <PlanViewerPage
                    plan={plan}
                    setPlan={setPlan}
                    fileName={planFileName}
                    setFileName={setPlanFileName}
                    fileSize={planFileSize}
                    setFileSize={setPlanFileSize}
                  />
                }
              />
              <Route
                path="/state"
                element={
                  <StateViewerPage
                    state={state}
                    setState={setState}
                    fileName={stateFileName}
                    setFileName={setStateFileName}
                    fileSize={stateFileSize}
                    setFileSize={setStateFileSize}
                  />
                }
              />
              <Route path="/topology" element={<TopologyPage plan={plan} state={state} />} />
              <Route path="/reports" element={<ReportsPage plan={plan} state={state} />} />
              <Route path="/settings" element={<SettingsPage theme={theme} setTheme={setTheme} />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
