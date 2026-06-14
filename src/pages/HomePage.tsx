import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Database, Network, FileText, CheckCircle2, Shield, ArrowRight } from 'lucide-react';
import samplePlan from '../fixtures/sample-plan.json';
import sampleState from '../fixtures/sample-state.json';
import type { ParsedPlan } from '../types/plan';
import type { ParsedState } from '../types/state';
import { parsePlanJson } from '../lib/parsePlan';
import { parseStateJson } from '../lib/parseState';

interface HomePageProps {
  setPlan: (plan: ParsedPlan | null) => void;
  setPlanFileName: (name: string | undefined) => void;
  setPlanFileSize: (size: number | undefined) => void;
  setState: (state: ParsedState | null) => void;
  setStateFileName: (name: string | undefined) => void;
  setStateFileSize: (size: number | undefined) => void;
}

export function HomePage({
  setPlan,
  setPlanFileName,
  setPlanFileSize,
  setState,
  setStateFileName,
  setStateFileSize,
}: HomePageProps) {
  const navigate = useNavigate();

  const handleLoadSamplePlan = () => {
    try {
      const planStr = JSON.stringify(samplePlan);
      const parsed = parsePlanJson(planStr, 'sample-plan.json');
      setPlan(parsed);
      setPlanFileName('sample-plan.json');
      setPlanFileSize(planStr.length);
      navigate('/plan');
    } catch (err) {
      console.error('Failed to load sample plan: ', err);
    }
  };

  const handleLoadSampleState = () => {
    try {
      const stateStr = JSON.stringify(sampleState);
      const parsed = parseStateJson(stateStr, 'sample-state.json');
      setState(parsed);
      setStateFileName('sample-state.json');
      setStateFileSize(stateStr.length);
      navigate('/state');
    } catch (err) {
      console.error('Failed to load sample state: ', err);
    }
  };

  return (
    <div className="home-page">
      {/* Hero Welcome Banner */}
      <section className="home-hero">
        <div className="hero-badge">v1.2.0 Enterprise Release</div>
        <h1>
          Infrastructure Clarity with <span className="brand-highlight">tf-lens</span>
        </h1>
        <p className="hero-subtitle">
          Interactive client-side browser visualizer for exploring, analyzing, and auditing Terraform plans and state configurations.
        </p>
        <div className="hero-actions">
          <button type="button" className="button primary" onClick={handleLoadSamplePlan}>
            <span>Try Sample Plan</span>
            <ArrowRight className="hero-btn-arrow" size={16} />
          </button>
          <button type="button" className="button secondary" onClick={handleLoadSampleState}>
            <span>Try Sample State</span>
          </button>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="home-section">
        <h2>Features & Toolkits</h2>
        <p className="section-desc">Explore the standard modules built directly into the tf-lens browser ecosystem.</p>
        
        <div className="features-grid">
          <div className="feature-card" onClick={() => navigate('/plan')}>
            <div className="feature-icon plan">
              <LayoutGrid size={24} />
            </div>
            <h3>Plan Analyzer</h3>
            <p>Upload plan JSON files to inspect proposed creations, replacements, updates, and deletes. Explore dynamic module and provider allocations.</p>
            <span className="card-link">Launch Plan Analyzer →</span>
          </div>

          <div className="feature-card" onClick={() => navigate('/state')}>
            <div className="feature-icon state">
              <Database size={24} />
            </div>
            <h3>State Explorer</h3>
            <p>Navigate live resources, output values, tainted or deposed configurations, and audit check block failures in real-time.</p>
            <span className="card-link">Launch State Explorer →</span>
          </div>

          <div className="feature-card" onClick={() => navigate('/topology')}>
            <div className="feature-icon topology">
              <Network size={24} />
            </div>
            <h3>Topology Map</h3>
            <p>Interactive dependency graph grouping nodes by module boundaries. Features include dynamic dependency inference, click inspector, filters, panning, and zoom.</p>
            <span className="card-link">Open Topology Map →</span>
          </div>

          <div className="feature-card" onClick={() => navigate('/reports')}>
            <div className="feature-icon security">
              <FileText size={24} />
            </div>
            <h3>Security Reports</h3>
            <p>Review compliance checks, high-risk deletes, resource modification reports, and automated parsed warnings.</p>
            <span className="card-link">View Security Reports →</span>
          </div>
        </div>
      </section>

      {/* Onboarding Guide & Commands */}
      <section className="home-section guide-section">
        <div className="guide-layout">
          <div className="guide-text">
            <h2>Quick Start Onboarding</h2>
            <p>Follow these quick commands to export your Terraform plans or state files into browser-compatible JSON formats:</p>
            
            <div className="guide-steps">
              <div className="step-item">
                <div className="step-num">1</div>
                <div>
                  <h4>Export Terraform Plan to JSON</h4>
                  <p>Run these commands inside your local project terminal to generate the plan JSON:</p>
                  <pre className="terminal-code">
                    <code>
                      {`# 1. Output binary plan file\nterraform plan -out=tfplan.binary\n\n# 2. Convert to JSON output file\nterraform show -json tfplan.binary > plan.json`}
                    </code>
                  </pre>
                </div>
              </div>

              <div className="step-item">
                <div className="step-num">2</div>
                <div>
                  <h4>Locate Terraform State File</h4>
                  <p>State files are already stored as raw JSON. You can upload your live state file directly:</p>
                  <pre className="terminal-code">
                    <code>
                      {`# Upload your terraform.tfstate file directly,\n# or export the show state output to a file:\nterraform show -json > state.json`}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <div className="security-highlight-box">
            <div className="security-badge-icon">
              <Shield size={32} />
            </div>
            <h3>100% Client-Side Privacy</h3>
            <p>
              Your security is our highest priority. **tf-lens** parses, builds, and visualizes all files locally inside your browser sandbox.
            </p>
            <ul className="security-features-list">
              <li>
                <CheckCircle2 size={16} className="bullet-ok" />
                <span>No servers or database collection.</span>
              </li>
              <li>
                <CheckCircle2 size={16} className="bullet-ok" />
                <span>Zero outbound API file tracking.</span>
              </li>
              <li>
                <CheckCircle2 size={16} className="bullet-ok" />
                <span>Works fully offline in isolated environments.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
