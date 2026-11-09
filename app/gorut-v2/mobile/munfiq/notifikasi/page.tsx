import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireGorutMunfiqContext } from '@/lib/gorut-munfiq-identity-server';
import { MobileActorAccessUnavailable } from '@/components/gorut-v2/mobile-shared/mobile-actor-access-unavailable';
import { MunfiqNotificationsScreen } from '@/components/gorut-v2/munfiq-mobile/munfiq-notifications-screen';

export const metadata: Metadata = { title: 'Notifikasi | GORUT Munfiq' };
export default async function MunfiqNotificationsPage() {
  const auth = await requireGorutMunfiqContext();
  if ('response' in auth) {
    if (auth.response.status === 401) redirect('/gorut-v2/mobile/login?next=/gorut-v2/mobile/munfiq/notifikasi');
    return <MobileActorAccessUnavailable actorType="MUNFIQ" reason={auth.response.status >= 500 ? 'unavailable' : 'forbidden'} />;
  }
  return <MunfiqNotificationsScreen owner={{ userId: auth.context.userId, munfiqCode: auth.context.munfiqCode }} />;
}
