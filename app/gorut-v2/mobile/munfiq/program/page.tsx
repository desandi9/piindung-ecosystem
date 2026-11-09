import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { MunfiqProgramScreen } from '@/components/gorut-v2/munfiq-mobile/munfiq-program-screen';
import { MobileActorAccessUnavailable } from '@/components/gorut-v2/mobile-shared/mobile-actor-access-unavailable';
import { requireGorutMunfiqContext } from '@/lib/gorut-munfiq-identity-server';
import { serializeGorutMunfiqSelfIdentity } from '@/lib/gorut-munfiq-identity-pure';

export const metadata: Metadata = { title: 'Program | GORUT Munfiq' };

export default async function MunfiqProgramPage({ searchParams }: { searchParams: Promise<{ content?: string | string[]; filter?: string | string[] }> }) {
  const auth = await requireGorutMunfiqContext();
  if ('response' in auth) {
    if (auth.response.status === 401) redirect('/gorut-v2/mobile/login?next=/gorut-v2/mobile/munfiq/program');
    return <MobileActorAccessUnavailable actorType="MUNFIQ" reason={auth.response.status >= 500 ? 'unavailable' : 'forbidden'} />;
  }
  const query = await searchParams;
  return <MunfiqProgramScreen owner={{ userId: auth.context.userId, ...serializeGorutMunfiqSelfIdentity(auth.context) }} initialContent={typeof query.content === 'string' ? query.content : undefined} initialFilter={query.filter === 'artikel' || query.filter === 'berita' || query.filter === 'dampak' ? query.filter : 'all'} />;
}
