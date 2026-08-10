import type { ReactNode } from 'react';

export type OperationPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  meta?: ReactNode;
  action?: ReactNode;
};

export function OperationPageHeader({ eyebrow, title, description, meta, action }: OperationPageHeaderProps) {
  return (
    <header className="gorut-operation-heading gorut-motion-enter">
      <div className="gorut-operation-heading-copy">
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {meta || action ? <div className="gorut-operation-heading-actions">{meta}{action}</div> : null}
    </header>
  );
}
