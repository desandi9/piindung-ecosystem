import type { ReactNode } from 'react';

import { OperationPageHeader } from './operations/operation-page-header';

type PenghimpunanPageHeaderProps = {
  title: string;
  description: string;
  meta?: ReactNode;
};

export function PenghimpunanPageHeader({ title, description, meta }: PenghimpunanPageHeaderProps) {
  return (
    <div className="gorut-collection-page-header">
      <OperationPageHeader eyebrow="Penghimpunan" title={title} description={description} meta={meta} />
    </div>
  );
}
