import { X } from 'lucide-react';
import { useState } from 'react';
import { statusClassName, statusLabel } from '../lib/stateStatus';
import type { NormalizedStateResource } from '../types/state';
import { JsonTree } from './JsonTree';
import { ProviderIcon } from './ProviderIcon';

interface StateResourceDetailProps {
  resource: NormalizedStateResource;
  onClose: () => void;
}

type DetailTab = 'attributes' | 'raw';

export function StateResourceDetail({
  resource,
  onClose,
}: StateResourceDetailProps) {
  const [tab, setTab] = useState<DetailTab>('attributes');
  const [showSensitive, setShowSensitive] = useState(false);

  const hasRaw = resource.parseStatus !== 'ok' || resource.raw !== undefined;

  const resourceId = (() => {
    if (resource.attributes && typeof resource.attributes === 'object') {
      const id = (resource.attributes as Record<string, unknown>).id;
      if (typeof id === 'string') return id;
    }
    return 'unknown';
  })();

  return (
    <aside className="resource-detail">
      <div className="detail-header">
        <div className="detail-header-text">
          <span className={statusClassName(resource.status)}>
            {statusLabel(resource.status)}
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
          <dt>Instances</dt>
          <dd>{resource.instanceCount}</dd>
        </div>
        <div>
          <dt>Parse status</dt>
          <dd>{resource.parseStatus}</dd>
        </div>
      </dl>

      {resource.statusDetail && (
        <p className="detail-warning">{resource.statusDetail}</p>
      )}

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
          className={tab === 'attributes' ? 'active' : ''}
          onClick={() => setTab('attributes')}
        >
          Attributes
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
        {tab === 'attributes' && (
          <JsonTree
            value={resource.attributes}
            sensitivePaths={resource.sensitivePaths}
            showSensitive={showSensitive}
          />
        )}
        {tab === 'raw' && (
          <JsonTree
            value={resource.raw ?? resource}
            showSensitive={showSensitive}
          />
        )}
      </div>
    </aside>
  );
}
