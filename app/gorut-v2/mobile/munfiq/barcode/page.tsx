import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { MunfiqBarcodeScreen } from '@/components/gorut-v2/munfiq-mobile/munfiq-barcode-screen';
import { MobileActorAccessUnavailable } from '@/components/gorut-v2/mobile-shared/mobile-actor-access-unavailable';
import { requireGorutMunfiqContext } from '@/lib/gorut-munfiq-identity-server';

export const metadata: Metadata = { title: 'Barcode Saya | GORUT Munfiq' };

export default async function MunfiqBarcodePage({ searchParams }: { searchParams: Promise<{ from?: string | string[] }> }) {
  const auth = await requireGorutMunfiqContext();
  if ('response' in auth) {
    if (auth.response.status === 401) redirect('/gorut-v2/mobile/login?next=/gorut-v2/mobile/munfiq/barcode');
    return <MobileActorAccessUnavailable actorType="MUNFIQ" reason={auth.response.status >= 500 ? 'unavailable' : 'forbidden'} />;
  }
  const query = await searchParams;
  return <MunfiqBarcodeScreen ownerUserId={auth.context.userId} fromPickup={query.from === 'penjemputan'} fromProgram={query.from === 'program'} fromAccount={query.from === 'akun'} />;
}
