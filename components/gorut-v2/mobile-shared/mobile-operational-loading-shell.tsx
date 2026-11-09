'use client';

import { HomeHeader, HomeSkeleton } from '../home/home-ui';

export function MobileOperationalLoadingShell({
  initials,
  name,
  assignmentLabel,
  contextLabel,
}: {
  initials: string;
  name: string;
  assignmentLabel: string;
  contextLabel?: string;
}) {
  return (
    <div className="plpk-scroll gh-home" aria-busy="true">
      <HomeHeader role="GORUT" name={name} initials={initials} assignment={`${assignmentLabel}${contextLabel ? ` · ${contextLabel}` : ''}`} />
      <HomeSkeleton />
    </div>
  );
}
