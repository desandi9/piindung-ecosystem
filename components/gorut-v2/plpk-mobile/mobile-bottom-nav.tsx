'use client';

import type { IconSvgElement } from '@hugeicons/react';

import { MobileServiceIcon } from './mobile-service-icon';

export type MobileBottomNavItem<T extends string = string> = {
  key: T;
  label: string;
  icon: IconSvgElement;
  badge?: number;
  badgeLabel?: string;
};

function formatBadge(count: number) {
  return count > 99 ? '99+' : String(count);
}

export function MobileBottomNav<T extends string>({
  items,
  activeKey,
  ariaLabel,
  onSelect,
}: {
  items: MobileBottomNavItem<T>[];
  activeKey: T;
  ariaLabel: string;
  onSelect: (key: T) => void;
}) {
  return (
    <nav className="plpk-nav" aria-label={ariaLabel}>
      {items.map(({ key, label, icon, badge, badgeLabel }) => {
        const active = activeKey === key;
        const showBadge = typeof badge === 'number' && badge > 0;

        return (
          <button
            key={key}
            type="button"
            className={active ? 'is-active' : undefined}
            aria-current={active ? 'page' : undefined}
            aria-label={label}
            onClick={() => onSelect(key)}
          >
            <span className="plpk-nav-icon">
              <MobileServiceIcon icon={icon} label={label} size={22} />
              {showBadge ? (
                <span className="plpk-nav-badge" aria-label={badgeLabel ?? `${badge} notifikasi`}>
                  {formatBadge(badge)}
                </span>
              ) : null}
            </span>
            <span className="plpk-nav-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
