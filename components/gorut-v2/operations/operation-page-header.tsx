'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useMemo, type ReactNode } from 'react';

import { gorutSectionEntranceVariants } from '@/features/gorut-v2/motion';

export type OperationPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  meta?: ReactNode;
  action?: ReactNode;
};

export function OperationPageHeader({ eyebrow, title, description, meta, action }: OperationPageHeaderProps) {
  const reduced = useReducedMotion();
  const variants = useMemo(() => gorutSectionEntranceVariants(Boolean(reduced)), [reduced]);
  return (
    <motion.header className="gorut-operation-heading" data-gorut-motion="motion" initial="hidden" animate="visible" variants={variants}>
      <div className="gorut-operation-heading-copy">
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {meta || action ? <div className="gorut-operation-heading-actions">{meta}{action}</div> : null}
    </motion.header>
  );
}
