'use client';

import type { IconSvgElement } from '@hugeicons/react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

import type { CollectionStatus } from '@/features/gorut-v2/types';
import { collectionStatusLabels } from '@/features/gorut-v2/pengambilan-options';

import { MobileServiceIcon } from './mobile-service-icon';

export function MobilePageHeader({ title, subtitle, onBack, action }: { title: string; subtitle?: string; onBack?: () => void; action?: ReactNode }) {
  return (
    <header className="plpk-page-header">
      {onBack ? (
        <button type="button" className="plpk-icon-button" onClick={onBack} aria-label="Kembali">
          <ArrowLeft size={21} aria-hidden="true" />
        </button>
      ) : null}
      <div>
        <strong>{title}</strong>
        {subtitle ? <span>{subtitle}</span> : null}
      </div>
      {action ? <div className="plpk-page-action">{action}</div> : null}
    </header>
  );
}

export function MobileSectionHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="plpk-section-head">
      <div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>
      {action}
    </div>
  );
}

export function MobileStatusBadge({ status }: { status: CollectionStatus }) {
  return <span className={`plpk-badge is-${status}`}>{collectionStatusLabels[status]}</span>;
}

export function MobileStatCard({ icon, label, value }: { icon: IconSvgElement; label: string; value: string }) {
  return (
    <article className="plpk-mini-stat">
      <span className="plpk-mini-icon"><MobileServiceIcon icon={icon} label={label} size={19} /></span>
      <div><small>{label}</small><strong>{value}</strong></div>
    </article>
  );
}

export function MobileServiceTile({ icon, title, description, badge, onClick, compact = false }: { icon: IconSvgElement; title: string; description?: string; badge?: string; onClick: () => void; compact?: boolean }) {
  return (
    <button type="button" className={compact ? 'plpk-service-tile is-compact' : 'plpk-service-tile'} onClick={onClick} aria-label={`Buka ${title}`}>
      <span className="plpk-service-icon"><MobileServiceIcon icon={icon} label={title} /></span>
      <span className="plpk-service-copy"><strong>{title}</strong>{description ? <small>{description}</small> : null}</span>
      {badge ? <span className="plpk-service-badge">{badge}</span> : null}
      {!compact ? <ChevronRight size={18} aria-hidden="true" /> : null}
    </button>
  );
}

export function MobileEmptyState({ icon, title, description, action }: { icon: IconSvgElement; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="plpk-empty">
      <span className="plpk-empty-icon"><MobileServiceIcon icon={icon} label={title} size={26} /></span>
      <strong>{title}</strong>
      <p>{description}</p>
      {action}
    </div>
  );
}
