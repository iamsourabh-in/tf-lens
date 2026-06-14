import type { ActionCounts } from '../types/plan';
import type { StatusCounts } from '../types/state';

interface SummaryChartsProps {
  type: 'plan' | 'state';
  counts: ActionCounts | StatusCounts;
}

export function SummaryCharts({ type, counts }: SummaryChartsProps) {
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

  // Generate 8 data points that trend nicely based on the counts
  const total = data.reduce((acc, curr) => acc + curr.count, 0);
  const splinePoints = [
    total * 0.1,
    total * 0.3,
    total * 0.25,
    total * 0.5,
    total * 0.45,
    total * 0.7,
    total * 0.65,
    total * 0.85,
  ].map(v => Math.max(Math.round(v), 2));
  
  const maxSplineVal = Math.max(...splinePoints, 10);
  const height = 150;
  const width = 450;
  const padding = 24;
  
  // Create path for the Area Chart
  const points = splinePoints.map((val, i) => {
    const x = padding + (i * (width - 2 * padding)) / (splinePoints.length - 1);
    const y = height - padding - (val * (height - 2 * padding)) / maxSplineVal;
    return { x, y };
  });

  let pathData = '';
  if (points.length > 0) {
    pathData = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      pathData += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
  }

  const fillPath = pathData + ` L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="charts-container">
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

      <div className="chart-box">
        <h4>Resource Changes Over Time (Mock)</h4>
        <div className="chart-wrapper">
          <svg viewBox={`0 0 ${width} ${height}`} className="svg-chart">
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--color-border)" />
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--color-border)" strokeDasharray="3 3" />
            <line x1={padding} y1={(height) / 2} x2={width - padding} y2={(height) / 2} stroke="var(--color-border)" strokeDasharray="3 3" />

            {/* Area and Line */}
            {pathData && (
              <>
                <path d={fillPath} fill="url(#areaGrad)" />
                <path d={pathData} fill="none" stroke="var(--color-accent)" strokeWidth="3.5" strokeLinecap="round" />
              </>
            )}

            {/* Points */}
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="4.5" fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth="3" />
            ))}

            {/* X Axis Labels */}
            {points.map((p, i) => (
              <text
                key={i}
                x={p.x}
                y={height - 6}
                textAnchor="middle"
                fill="var(--color-text-muted)"
                fontSize="9"
                fontWeight="500"
              >
                {String(i * 2).padStart(2, '0')}
              </text>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
