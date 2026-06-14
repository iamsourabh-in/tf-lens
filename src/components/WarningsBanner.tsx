interface WarningsBannerProps {
  warnings: string[];
  errored?: boolean;
  title?: string;
}

export function WarningsBanner({
  warnings,
  errored,
  title,
}: WarningsBannerProps) {
  if (warnings.length === 0 && !errored) return null;

  const heading =
    title ??
    (errored ? 'Plan has errors' : 'Warnings');

  return (
    <div className="warnings-banner" role="status">
      <strong>
        {heading}
        {warnings.length > 0 ? ` (${warnings.length})` : ''}
      </strong>
      {warnings.length > 0 && (
        <ul>
          {warnings.slice(0, 8).map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
          {warnings.length > 8 && (
            <li>…and {warnings.length - 8} more warnings</li>
          )}
        </ul>
      )}
      {errored && warnings.length === 0 && (
        <p>Terraform marked this plan as errored. Review resources carefully.</p>
      )}
    </div>
  );
}
