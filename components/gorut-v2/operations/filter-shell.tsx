import { RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';

export type FilterShellProps = {
  activeCount: number;
  resultSummary: string;
  onReset: () => void;
  children: ReactNode;
};

export function FilterShell({ activeCount, resultSummary, onReset, children }: FilterShellProps) {
  return (
    <section className="gorut-operation-filters" aria-label="Filter data">
      <div className="gorut-operation-filter-controls">{children}</div>
      <footer>
        <p aria-live="polite">{resultSummary}</p>
        {activeCount > 0 ? (
          <button type="button" onClick={onReset}><RotateCcw size={14} aria-hidden="true" />Reset {activeCount} filter</button>
        ) : <span>Belum ada filter aktif</span>}
      </footer>
    </section>
  );
}
