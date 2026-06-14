import { Layers } from 'lucide-react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppNav } from './components/AppNav';
import { Sidebar } from './components/Sidebar';
import { PlanViewerPage } from './pages/PlanViewerPage';
import { StateViewerPage } from './pages/StateViewerPage';
import './styles/app.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
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
              <Route path="/plan" element={<PlanViewerPage />} />
              <Route path="/state" element={<StateViewerPage />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
