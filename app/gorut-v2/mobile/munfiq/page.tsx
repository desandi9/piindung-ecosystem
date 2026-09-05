import { redirect } from 'next/navigation';

import { MunfiqMobileApp } from '@/components/gorut-v2/munfiq-mobile/munfiq-mobile-app';
import { MobileActorAccessUnavailable } from '@/components/gorut-v2/mobile-shared/mobile-actor-access-unavailable';
import { requireGorutMunfiqContext } from '@/lib/gorut-munfiq-identity-server';
import { serializeGorutMunfiqSelfIdentity } from '@/lib/gorut-munfiq-identity-pure';

export default async function MunfiqMobilePage() {
  const auth = await requireGorutMunfiqContext();
  if ('response' in auth) {
    if (auth.response.status === 401) redirect('/login?next=/gorut-v2/mobile/munfiq');
    return <MobileActorAccessUnavailable actorType="MUNFIQ" reason={auth.response.status >= 500 ? 'unavailable' : 'forbidden'} />;
  }
  return <MunfiqMobileApp identity={serializeGorutMunfiqSelfIdentity(auth.context)} />;
}
