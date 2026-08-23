import { UpzisShell } from '@/components/gorut-v2/upzis/upzis-shell';
import { UpzisPackageShell } from '@/components/gorut-v2/upzis/upzis-package-shell';
import { resolvePackageFrontendMode } from '@/features/gorut-v2/package-api-client';

export default function PenghimpunanVerifikasiUpzisPage() {
  return resolvePackageFrontendMode() === 'demo' ? <UpzisShell /> : <UpzisPackageShell />;
}
