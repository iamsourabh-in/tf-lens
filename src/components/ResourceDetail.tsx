import { X } from 'lucide-react';
import { useState } from 'react';
import { displayActionLabel } from '../lib/actionLabels';
import type { NormalizedResource } from '../types/plan';
import { JsonTree } from './JsonTree';
import { ProviderIcon } from './ProviderIcon';

interface ResourceDetailProps {
  resource: NormalizedResource;
  onClose: () => void;
}

type DetailTab = 'before' | 'after' | 'raw';

export function ResourceDetail({ resource, onClose }: ResourceDetailProps) {
  const [tab, setTab] = useState<DetailTab>('after');
  const [showSensitive, setShowSensitive] = useState(false);

  const hasRaw = resource.parseStatus !== 'ok' || resource.raw !== undefined;

  const resourceId = (() => {
    if (resource.after && typeof resource.after === 'object') {
      const id = (resource.after as Record<string, unknown>).id;
      if (typeof id === 'string') return id;
    }
    if (resource.before && typeof resource.before === 'object') {
      const id = (resource.before as Record<string, unknown>).id;
      if (typeof id === 'string') return id;
    }
    return '(known after apply)';
  })();

  return (
    <aside className="resource-detail">
      <div className="detail-header">
        <div className="detail-header-text">
          <span className={`action-chip action-${resource.displayAction}`}>
            {displayActionLabel(resource.displayAction)}
          </span>
          <h2>{resource.address}</h2>
        </div>
        <button
          type="button"
          className="button icon-button"
          onClick={onClose}
          aria-label="Close resource detail"
        >
          <X size={18} />
        </button>
      </div>

      <dl className="detail-meta">
        <div>
          <dt>Type</dt>
          <dd className="mono type-detail-val">
            <ProviderIcon provider={resource.provider} type={resource.type} />
            <span>{resource.type}</span>
          </dd>
        </div>
        <div>
          <dt>Resource ID</dt>
          <dd className="mono selectable-text">{resourceId}</dd>
        </div>
        <div>
          <dt>Module</dt>
          <dd>{resource.moduleAddress || '(root)'}</dd>
        </div>
        <div>
          <dt>Provider</dt>
          <dd className="mono">{resource.provider}</dd>
        </div>
        <div>
          <dt>Mode</dt>
          <dd>{resource.mode}</dd>
        </div>
        <div>
          <dt>Parse status</dt>
          <dd>{resource.parseStatus}</dd>
        </div>
      </dl>

      {resource.parseWarning && (
        <p className="detail-warning">{resource.parseWarning}</p>
      )}

      <label className="sensitive-toggle">
        <input
          type="checkbox"
          checked={showSensitive}
          onChange={(event) => setShowSensitive(event.target.checked)}
        />
        Show sensitive values
      </label>

      <div className="detail-tabs">
        <button
          type="button"
          className={tab === 'before' ? 'active' : ''}
          onClick={() => setTab('before')}
        >
          Before
        </button>
        <button
          type="button"
          className={tab === 'after' ? 'active' : ''}
          onClick={() => setTab('after')}
        >
          After
        </button>
        {hasRaw && (
          <button
            type="button"
            className={tab === 'raw' ? 'active' : ''}
            onClick={() => setTab('raw')}
          >
            Raw
          </button>
        )}
      </div>

      <div className="detail-body">
        {tab === 'before' && (
          <JsonTree
            value={resource.before}
            sensitive={resource.beforeSensitive}
            showSensitive={showSensitive}
          />
        )}
        {tab === 'after' && (
          <JsonTree
            value={resource.after}
            sensitive={resource.afterSensitive}
            showSensitive={showSensitive}
          />
        )}
        {tab === 'raw' && (
          <JsonTree value={resource.raw ?? resource} showSensitive={showSensitive} />
        )}
      </div>
    </aside>
  );
}
