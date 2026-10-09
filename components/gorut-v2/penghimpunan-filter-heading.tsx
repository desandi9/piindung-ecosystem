import type { ReactNode } from 'react';

type PenghimpunanFilterHeadingProps = {
  title?: string;
  description: string;
  action?: ReactNode;
};

export function PenghimpunanFilterHeading({ title = 'Filter data', description, action }: PenghimpunanFilterHeadingProps) {
  return (
    <header className="pjm-filter-panel-heading">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}
