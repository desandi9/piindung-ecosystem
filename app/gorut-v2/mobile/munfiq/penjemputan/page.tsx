import { redirect } from 'next/navigation';
import { MunfiqPickupScreen } from '@/components/gorut-v2/munfiq-mobile/munfiq-pickup-screen';
import { MobileActorAccessUnavailable } from '@/components/gorut-v2/mobile-shared/mobile-actor-access-unavailable';
import { requireGorutMunfiqContext } from '@/lib/gorut-munfiq-identity-server';

export default async function MunfiqPickupPage({ searchParams }: { searchParams: Promise<{ collection?: string | string[] }> }) {
  const auth = await requireGorutMunfiqContext();
  if ('response' in auth) {
    if (auth.response.status === 401) redirect('/gorut-v2/mobile/login?next=/gorut-v2/mobile/munfiq/penjemputan');
    return <MobileActorAccessUnavailable actorType="MUNFIQ" reason={auth.response.status >= 500 ? 'unavailable' : 'forbidden'} />;
  }
  const query = await searchParams;
  return <MunfiqPickupScreen owner={{ userId: auth.context.userId, munfiqCode: auth.context.munfiqCode }} initialCollectionCode={typeof query.collection === 'string' ? query.collection : undefined} />;
}
