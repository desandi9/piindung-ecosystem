'use client';

import { useEffect, useState } from 'react';

type DashboardCountUpProps = {
  value: number;
  format: (value: number) => string;
};

export function DashboardCountUp({ value, format }: DashboardCountUpProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animationsDisabled = document.documentElement.dataset.animations === 'off';

    if (reduceMotion || animationsDisabled) {
      setDisplayValue(value);
      return;
    }

    const duration = 240;
    const startedAt = performance.now();
    let frame = 0;

    const update = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.round(value * easedProgress));

      if (progress < 1) frame = window.requestAnimationFrame(update);
    };

    frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return format(displayValue);
}
