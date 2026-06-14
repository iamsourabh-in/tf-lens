import { useMemo } from 'react';
import type { ActionCounts, NormalizedResource } from '../types/plan';
import type { StatusCounts, NormalizedStateResource } from '../types/state';

interface SummaryChartsProps {
  type: 'plan' | 'state';
  counts: ActionCounts | StatusCounts;
  resources: Array<NormalizedResource | NormalizedStateResource>;
}

// Curated colors for module segments
const SEGMENT_COLORS = [
  'var(--color-accent)',
  'var(--color-success)',
  'var(--color-info)',
  'var(--color-warning)',
  'var(--color-replace)',
];

export function SummaryCharts({ type, counts, resources }: SummaryChartsProps) {
  // Extract values for the bar chart
  let data: Array<{ label: string; count: number; color: string }> = [];
  if (type === 'plan') {
    const planCounts = counts as ActionCounts;
    data = [
      { label: 'Created', count: planCounts.create ?? 0, color: 'var(--color-success)' },
      { label: 'Updated', count: planCounts.update ?? 0, color: 'var(--color-warning)' },
      { label: 'Deleted', count: planCounts.delete ?? 0, color: 'var(--color-danger)' },
      { label: 'Unchanged', count: planCounts.noOp ?? 0, color: 'var(--color-text-muted)' },
    ];
  } else {
    const stateCounts = counts as StatusCounts;
    data = [
      { label: 'Active', count: stateCounts.ok ?? 0, color: 'var(--color-success)' },
      { label: 'Tainted', count: stateCounts.tainted ?? 0, color: 'var(--color-warning)' },
      { label: 'Deposed', count: stateCounts.deposed ?? 0, color: 'var(--color-info)' },
      { label: 'Failed', count: stateCounts.failed ?? 0, color: 'var(--color-danger)' },
    ];
  }

  const maxCount = Math.max(...data.map(d => d.count), 5);
  const height = 150;
  const width = 450;
  const padding = 24;

  // Calculate module resource allocation (real data)
  const moduleAllocation = useMemo(() => {
    const countsMap: Record<string, number> = {};
    resources.forEach(r => {
      const mod = r.moduleAddress || '(root)';
      countsMap[mod] = (countsMap[mod] ?? 0) + 1;
    });

    const totalResources = resources.length || 1;
    const sorted = Object.entries(countsMap)
      .sort((a, b) => b[1] - a[1]);

    const topModules = sorted.slice(0, 4).map(([name, count], index) => ({
      name,
      count,
      percentage: (count / totalResources) * 100,
      color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
    }));

    // If there are more than 4 modules, group the rest into "Other"
    if (sorted.length > 4) {
      const otherCount = sorted.slice(4).reduce((acc, curr) => acc + curr[1], 0);
      topModules.push({
        name: 'Other Modules',
        count: otherCount,
        percentage: (otherCount / totalResources) * 100,
        color: '#9ca3af',
      });
    }

    return topModules;
  }, [resources]);

  return (
    <div className="charts-container">
      {/* Chart 1: Resources by Status Bar Chart */}
      <div className="chart-box">
        <h4>Resources by Status</h4>
        <div className="chart-wrapper">
          <svg viewBox={`0 0 ${width} ${height}`} className="svg-chart">
            {/* Grid lines */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--color-border)" />
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--color-border)" strokeDasharray="3 3" />
            <line x1={padding} y1={(height) / 2} x2={width - padding} y2={(height) / 2} stroke="var(--color-border)" strokeDasharray="3 3" />

            {/* Bars */}
            {data.map((d, i) => {
              const barWidth = 44;
              const spacing = (width - 2 * padding) / data.length;
              const x = padding + i * spacing + (spacing - barWidth) / 2;
              const barHeight = (d.count * (height - 2 * padding)) / maxCount;
              const y = height - padding - barHeight;

              return (
                <g key={d.label}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={d.color}
                    rx="6"
                    className="chart-bar"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={height - 6}
                    textAnchor="middle"
                    fill="var(--color-text-muted)"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {d.label}
                  </text>
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    fill="var(--color-text-strong)"
                    fontSize="11"
                    fontWeight="700"
                  >
                    {d.count}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Chart 2: Module Resource Allocation Segmented Chart */}
      <div className="chart-box">
        <h4>Module Resource Allocation</h4>
        <div className="module-allocation-chart">
          {/* Segmented Progress Bar */}
          <div className="segmented-bar-track">
            {moduleAllocation.map((seg) => (
              <div
                key={seg.name}
                className="segmented-bar-fill"
                style={{
                  width: `${seg.percentage}%`,
                  backgroundColor: seg.color,
                }}
                title={`${seg.name}: ${seg.count} resources (${seg.percentage.toFixed(1)}%)`}
              />
            ))}
          </div>

          {/* Legend Details */}
          <ul className="module-allocation-legend">
            {moduleAllocation.map((seg) => (
              <li key={seg.name} className="legend-item">
                <span className="legend-indicator" style={{ backgroundColor: seg.color }} />
                <span className="legend-name" title={seg.name}>{seg.name}</span>
                <span className="legend-details">
                  <strong>{seg.count}</strong> ({seg.percentage.toFixed(0)}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
