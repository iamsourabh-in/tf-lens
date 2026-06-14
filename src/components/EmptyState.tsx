import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  children: ReactNode;
}

export function EmptyState({ children }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <Inbox size={32} strokeWidth={1.5} aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
