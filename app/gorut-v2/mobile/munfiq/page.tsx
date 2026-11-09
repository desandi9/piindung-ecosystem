import { redirect } from 'next/navigation';

import { MunfiqMobileApp } from '@/components/gorut-v2/munfiq-mobile/munfiq-mobile-app';
import { MunfiqNotificationsScreen } from '@/components/gorut-v2/munfiq-mobile/munfiq-notifications-screen';
import { MunfiqAccountScreen } from '@/components/gorut-v2/munfiq-mobile/munfiq-account-screen';
import { MobileActorAccessUnavailable } from '@/components/gorut-v2/mobile-shared/mobile-actor-access-unavailable';
import { requireGorutMunfiqContext } from '@/lib/gorut-munfiq-identity-server';
import { serializeGorutMunfiqSelfIdentity } from '@/lib/gorut-munfiq-identity-pure';

export default async function MunfiqMobilePage({ searchParams }: { searchParams: Promise<{ tab?: string | string[] }> }) {
  const auth = await requireGorutMunfiqContext();
  if ('response' in auth) {
    if (auth.response.status === 401) redirect('/gorut-v2/mobile/login?next=/gorut-v2/mobile/munfiq');
    return <MobileActorAccessUnavailable actorType="MUNFIQ" reason={auth.response.status >= 500 ? 'unavailable' : 'forbidden'} />;
  }
  const query = await searchParams;
  if (query.tab === 'notifications') return <MunfiqNotificationsScreen owner={{ userId: auth.context.userId, munfiqCode: auth.context.munfiqCode }} />;
  if (query.tab === 'account') return <MunfiqAccountScreen owner={{ userId: auth.context.userId, munfiqCode: auth.context.munfiqCode }} identity={serializeGorutMunfiqSelfIdentity(auth.context)} />;
  return <MunfiqMobileApp identity={serializeGorutMunfiqSelfIdentity(auth.context)} />;
}
