import { redirect } from 'next/navigation';

import { PlpkMobileApp } from '@/components/gorut-v2/plpk-mobile/plpk-mobile-app';
import { MobileActorAccessUnavailable } from '@/components/gorut-v2/mobile-shared/mobile-actor-access-unavailable';
import { resolveCurrentPlpkMobileAccess } from '../../../../lib/gorut/mobile-actor-access';
import { resolveMobileEntry } from '../../../../lib/gorut/mobile-actor-access-pure';

export default async function PlpkMobilePage() {
  const access = await resolveCurrentPlpkMobileAccess();
  const entry = resolveMobileEntry(access.kind, 'PLPK');
  if (entry.kind === 'redirect') redirect(entry.location);
  if (access.kind !== 'authorized') return <MobileActorAccessUnavailable actorType="PLPK" reason={access.kind === 'unavailable' ? 'unavailable' : 'forbidden'} />;
  return <PlpkMobileApp profile={access.profile} />;
}
