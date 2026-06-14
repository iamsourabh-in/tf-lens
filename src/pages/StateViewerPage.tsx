import {
  AlertTriangle,
  Boxes,
  FolderTree,
  Share2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { IssuesPanel } from '../components/IssuesPanel';
import { ResourcesLayout } from '../components/ResourcesLayout';
import { StateFilterBar } from '../components/StateFilterBar';
import { StateModuleTree } from '../components/StateModuleTree';
import { StateOutputsPanel } from '../components/StateOutputsPanel';
import { StateResourceDetail } from '../components/StateResourceDetail';
import { StateResourceTable } from '../components/StateResourceTable';
import { StateSummary } from '../components/StateSummary';
import { WarningsBanner } from '../components/WarningsBanner';
import sampleState from '../fixtures/sample-state.json';
import { isStateFile, STATE_ACCEPT } from '../lib/acceptedFiles';
import { filterStateResources } from '../lib/filterStateResources';
import { parseStateJson } from '../lib/parseState';
import type {
  NormalizedStateResource,
  ParsedState,
  StateResourceFilters,
} from '../types/state';

type Tab = 'resources' | 'modules' | 'outputs' | 'issues';

const EMPTY_FILTERS: StateResourceFilters = {
  search: '',
  statuses: [],
  types: [],
  modules: [],
  providers: [],
  mode: 'all',
};

interface StateViewerPageProps {
  state: ParsedState | null;
  setState: (state: ParsedState | null) => void;
  fileName: string | undefined;
  setFileName: (name: string | undefined) => void;
  fileSize: number | undefined;
  setFileSize: (size: number | undefined) => void;
}

export function StateViewerPage({
  state,
  setState,
  fileName,
  setFileName,
  fileSize,
  setFileSize,
}: StateViewerPageProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('resources');
  const [filters, setFilters] = useState<StateResourceFilters>(EMPTY_FILTERS);
  const [selectedResource, setSelectedResource] =
    useState<NormalizedStateResource | null>(null);

  const filteredResources = useMemo(() => {
    if (!state) return [];
    return filterStateResources(state.resources, filters);
  }, [state, filters]);

  const loadText = (text: string, name: string, size?: number) => {
    setLoading(true);
    setError(null);
    try {
      const parsed = parseStateJson(text, name);
      setState(parsed);
      setFileName(name);
      setFileSize(size);
      setTab('resources');
      setFilters(EMPTY_FILTERS);
      setSelectedResource(null);
    } catch (loadError) {
      setState(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load state file',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!isStateFile(file.name)) {
      setError('Please upload a .json or .tfstate file');
      return;
    }
    const text = await file.text();
    loadText(text, file.name, file.size);
  };

  const handleLoadSample = () => {
    loadText(JSON.stringify(sampleState), 'sample-state.json');
  };

  const issueCount = state?.issues.length ?? 0;
  const tabs: Array<{ id: Tab; label: string; icon: typeof Boxes }> = [
    { id: 'resources', label: 'Resources', icon: Boxes },
    { id: 'modules', label: 'Modules', icon: FolderTree },
    { id: 'outputs', label: 'Outputs', icon: Share2 },
    {
      id: 'issues',
      label: issueCount > 0 ? `Issues (${issueCount})` : 'Issues',
      icon: AlertTriangle,
    },
  ];

  return (
    <>
      <header className="page-header">
        <div>
          <h1>State Viewer</h1>
          <p>
            Upload a Terraform state file (.tfstate or JSON export) to explore
            managed resources.
          </p>
        </div>
      </header>

      <FileUpload
        title="Upload Terraform state file"
        hint="Drag and drop a .tfstate or .json file, or choose one from disk."
        sampleLabel="Load sample state"
        accept={STATE_ACCEPT}
        onFileSelect={handleFileSelect}
        onLoadSample={handleLoadSample}
        fileName={fileName}
        fileSize={fileSize}
        disabled={loading}
      />

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      {state && (
        <>
          <WarningsBanner warnings={state.warnings} title="Parse warnings" />

          <StateSummary
            metadata={state.metadata}
            statusCounts={state.statusCounts}
            typeCounts={state.typeCounts}
          />

          <nav className="tab-nav">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={tab === id ? 'active' : ''}
                onClick={() => setTab(id)}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </button>
            ))}
          </nav>

          {tab === 'resources' && (
            <ResourcesLayout
              hasDetail={!!selectedResource}
              main={
                <>
                  <StateFilterBar
                    resources={state.resources}
                    filters={filters}
                    onChange={setFilters}
                  />
                  <StateResourceTable
                    resources={filteredResources}
                    selectedId={selectedResource?.id}
                    onSelect={setSelectedResource}
                  />
                </>
              }
              detail={
                selectedResource && (
                  <StateResourceDetail
                    resource={selectedResource}
                    onClose={() => setSelectedResource(null)}
                  />
                )
              }
            />
          )}

          {tab === 'modules' && (
            <StateModuleTree resources={state.resources} />
          )}
          {tab === 'outputs' && (
            <StateOutputsPanel outputs={state.outputs} />
          )}
          {tab === 'issues' && (
            <IssuesPanel
              issues={state.issues}
              checkResults={state.checkResults}
            />
          )}
        </>
      )}
    </>
  );
}
