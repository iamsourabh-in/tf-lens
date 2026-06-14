import {
  Boxes,
  FolderTree,
  Share2,
  Variable,
  FileJson,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { FilterBar } from '../components/FilterBar';
import { ModuleTree } from '../components/ModuleTree';
import { OutputsPanel } from '../components/OutputsPanel';
import { PlanSummary } from '../components/PlanSummary';
import { ResourceDetail } from '../components/ResourceDetail';
import { ResourcesLayout } from '../components/ResourcesLayout';
import { ResourceTable } from '../components/ResourceTable';
import { VariablesPanel } from '../components/VariablesPanel';
import { WarningsBanner } from '../components/WarningsBanner';
import { RawJsonPanel } from '../components/RawJsonPanel';
import samplePlan from '../fixtures/sample-plan.json';
import { isPlanFile, PLAN_ACCEPT } from '../lib/acceptedFiles';
import { filterResources } from '../lib/filterResources';
import { parsePlanJson } from '../lib/parsePlan';
import type { NormalizedResource, ParsedPlan, ResourceFilters } from '../types/plan';

type Tab = 'resources' | 'modules' | 'outputs' | 'variables' | 'raw';

const TABS: Array<{ id: Tab; label: string; icon: any }> = [
  { id: 'resources', label: 'Resources', icon: Boxes },
  { id: 'modules', label: 'Modules', icon: FolderTree },
  { id: 'outputs', label: 'Outputs', icon: Share2 },
  { id: 'variables', label: 'Variables', icon: Variable },
  { id: 'raw', label: 'Raw JSON', icon: FileJson },
];

const EMPTY_FILTERS: ResourceFilters = {
  search: '',
  actions: [],
  types: [],
  modules: [],
  providers: [],
  mode: 'all',
};

interface PlanViewerPageProps {
  plan: ParsedPlan | null;
  setPlan: (plan: ParsedPlan | null) => void;
  fileName: string | undefined;
  setFileName: (name: string | undefined) => void;
  fileSize: number | undefined;
  setFileSize: (size: number | undefined) => void;
}

export function PlanViewerPage({
  plan,
  setPlan,
  fileName,
  setFileName,
  fileSize,
  setFileSize,
}: PlanViewerPageProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('resources');
  const [filters, setFilters] = useState<ResourceFilters>(EMPTY_FILTERS);
  const [selectedResource, setSelectedResource] =
    useState<NormalizedResource | null>(null);
  const [rawJsonText, setRawJsonText] = useState<string>('');

  const filteredResources = useMemo(() => {
    if (!plan) return [];
    return filterResources(plan.resources, filters);
  }, [plan, filters]);

  const loadText = (text: string, name: string, size?: number) => {
    setLoading(true);
    setError(null);
    try {
      const parsed = parsePlanJson(text, name);
      setPlan(parsed);
      setRawJsonText(text);
      setFileName(name);
      setFileSize(size);
      setTab('resources');
      setFilters(EMPTY_FILTERS);
      setSelectedResource(null);
    } catch (loadError) {
      setPlan(null);
      setRawJsonText('');
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load plan file',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!isPlanFile(file.name)) {
      setError('Please upload a .json plan file');
      return;
    }
    const text = await file.text();
    loadText(text, file.name, file.size);
  };

  const handleLoadSample = () => {
    loadText(JSON.stringify(samplePlan), 'sample-plan.json');
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1>tf-lens Plan Analyzer</h1>
          <p>Upload a Terraform plan JSON file to explore resource changes.</p>
        </div>
      </header>

      <FileUpload
        title="Upload Terraform plan JSON"
        hint="Drag and drop a .json file, or choose one from disk."
        sampleLabel="Load sample"
        accept={PLAN_ACCEPT}
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

      {plan && (
        <>
          <WarningsBanner
            warnings={plan.warnings}
            errored={plan.metadata.errored}
          />

          <PlanSummary
            metadata={plan.metadata}
            actionCounts={plan.actionCounts}
            typeCounts={plan.typeCounts}
            resources={plan.resources}
          />

          <nav className="tab-nav">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={tab === id ? 'active' : ''}
                onClick={() => setTab(id)}
                data-tooltip={`Switch to ${label}`}
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
                  <FilterBar
                    resources={plan.resources}
                    filters={filters}
                    onChange={setFilters}
                  />
                  <ResourceTable
                    resources={filteredResources}
                    selectedId={selectedResource?.id}
                    onSelect={setSelectedResource}
                  />
                </>
              }
              detail={
                selectedResource && (
                  <ResourceDetail
                    resource={selectedResource}
                    onClose={() => setSelectedResource(null)}
                  />
                )
              }
            />
          )}

           {tab === 'modules' && <ModuleTree resources={plan.resources} />}
          {tab === 'outputs' && <OutputsPanel outputs={plan.outputs} />}
          {tab === 'variables' && (
            <VariablesPanel variables={plan.variables} />
          )}
          {tab === 'raw' && (
            <RawJsonPanel jsonText={rawJsonText} fileName={fileName} />
          )}
        </>
      )}
    </>
  );
}
