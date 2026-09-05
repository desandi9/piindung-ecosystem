import { redirect } from 'next/navigation';

import { KordesMobileApp } from '@/components/gorut-v2/kordes-mobile/kordes-mobile-app';
import { MobileActorAccessUnavailable } from '@/components/gorut-v2/mobile-shared/mobile-actor-access-unavailable';
import { resolveCurrentKordesMobileAccess } from '../../../../lib/gorut/mobile-actor-access';
import { resolveMobileEntry } from '../../../../lib/gorut/mobile-actor-access-pure';

export default async function KordesMobilePage() {
  const access = await resolveCurrentKordesMobileAccess();
  const entry = resolveMobileEntry(access.kind, 'KORDES');
  if (entry.kind === 'redirect') redirect(entry.location);
  if (access.kind !== 'authorized') return <MobileActorAccessUnavailable actorType="KORDES" reason={access.kind === 'unavailable' ? 'unavailable' : 'forbidden'} />;
  return <KordesMobileApp profile={access.profile} />;
}
