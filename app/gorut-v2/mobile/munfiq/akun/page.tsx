import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { MunfiqAccountScreen } from '@/components/gorut-v2/munfiq-mobile/munfiq-account-screen';
import { MobileActorAccessUnavailable } from '@/components/gorut-v2/mobile-shared/mobile-actor-access-unavailable';
import { requireGorutMunfiqContext } from '@/lib/gorut-munfiq-identity-server';
import { serializeGorutMunfiqSelfIdentity } from '@/lib/gorut-munfiq-identity-pure';

export const metadata: Metadata = { title: 'Akun | GORUT Munfiq' };
export default async function MunfiqAccountPage() {
  const auth = await requireGorutMunfiqContext();
  if ('response' in auth) {
    if (auth.response.status === 401) redirect('/gorut-v2/mobile/login?next=/gorut-v2/mobile/munfiq/akun');
    return <MobileActorAccessUnavailable actorType="MUNFIQ" reason={auth.response.status >= 500 ? 'unavailable' : 'forbidden'} />;
  }
  return <MunfiqAccountScreen owner={{ userId: auth.context.userId, munfiqCode: auth.context.munfiqCode }} identity={serializeGorutMunfiqSelfIdentity(auth.context)} />;
}
