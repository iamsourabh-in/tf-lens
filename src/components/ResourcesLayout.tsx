import type { ReactNode } from 'react';

interface ResourcesLayoutProps {
  hasDetail: boolean;
  main: ReactNode;
  detail: ReactNode;
}

export function ResourcesLayout({
  hasDetail,
  main,
  detail,
}: ResourcesLayoutProps) {
  return (
    <div
      className={`resources-layout${
        hasDetail ? ' resources-layout--with-detail' : ''
      }`}
    >
      <div className="resources-main">{main}</div>
      {hasDetail && <div className="resources-aside">{detail}</div>}
    </div>
  );
}
