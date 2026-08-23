import { redirect } from 'next/navigation';

import { MobileActorAccessUnavailable } from '@/components/gorut-v2/mobile-shared/mobile-actor-access-unavailable';
import { resolveCurrentMunfiqMobileAccess } from '../../../../lib/gorut/mobile-actor-access';
import { resolveMobileEntry } from '../../../../lib/gorut/mobile-actor-access-pure';

export default async function MunfiqMobilePage() {
  const access = await resolveCurrentMunfiqMobileAccess();
  const entry = resolveMobileEntry(access.kind, 'MUNFIQ');
  if (entry.kind === 'redirect') redirect(entry.location);
  const reason = access.kind === 'unavailable' ? 'unavailable' : access.kind === 'contract-gap' ? 'contract-gap' : 'forbidden';
  return <MobileActorAccessUnavailable actorType="MUNFIQ" reason={reason} />;
}
