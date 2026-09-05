'use client';

import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';

export function MobileServiceIcon({ icon, label, size = 23 }: { icon: IconSvgElement; label: string; size?: number }) {
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={1.8} aria-label={label} />;
}
