import { redirect } from 'next/navigation';

import { KordesVerificationShell } from '@/components/gorut-v2/kordes-verification-shell';
import { resolveCollectionFrontendMode } from '@/features/gorut-v2/collection-api-client';

export default function PenghimpunanVerifikasiKordesPage() {
  if (resolveCollectionFrontendMode() === 'server') redirect('/gorut-v2/mobile/kordes');
  return <KordesVerificationShell />;
}
