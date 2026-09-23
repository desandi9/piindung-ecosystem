import type { ReactNode } from 'react';

export function DataSurface({ desktop, mobile, label }: { desktop: ReactNode; mobile: ReactNode; label?: string }) {
  return (
    <section className="gorut-operation-data" aria-label={label}>
      <div className="gorut-operation-data-desktop">{desktop}</div>
      <div className="gorut-operation-data-mobile">{mobile}</div>
    </section>
  );
}
