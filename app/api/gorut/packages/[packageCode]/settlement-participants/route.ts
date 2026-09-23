import { GorutOperationalRole } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import { isGorutSettlementPublicCode } from '@/lib/gorut-package-settlement-api-pure';
import { json, requireGorutContext } from '@/lib/gorut/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ packageCode: string }> | { packageCode: string } },
) {
  const auth = await requireGorutContext();
  if ('response' in auth) return auth.response;
  if (auth.context.operationalRole !== GorutOperationalRole.PC) {
    return json({ error: 'Assignment PC diperlukan untuk membaca petugas handover.' }, 403);
  }

  const { packageCode: rawPackageCode } = await Promise.resolve(params);
  const packageCode = rawPackageCode.trim();
  if (!isGorutSettlementPublicCode(packageCode, 120)) {
    return json({ error: 'Kode package tidak valid.' }, 400);
  }

  const prisma = getPrismaClient();
  const packageRow = await prisma.gorutUpzisPackage.findUnique({
    where: { packageCode },
    select: { kecamatanId: true },
  });
  if (!packageRow) return json({ error: 'Package tidak tersedia atau tidak ditemukan.' }, 404);

  const assignments = await prisma.gorutOperationalAssignment.findMany({
    where: {
      role: GorutOperationalRole.UPZIS,
      kecamatanId: packageRow.kecamatanId,
      rantingId: null,
      plpkId: null,
      isActive: true,
      user: { status: 'Aktif' },
    },
    select: { user: { select: { memberId: true, name: true } } },
    orderBy: [{ user: { name: 'asc' } }, { id: 'asc' }],
  });

  const seen = new Set<string>();
  const items = assignments.flatMap(({ user }) => {
    if (seen.has(user.memberId)) return [];
    seen.add(user.memberId);
    return [{ memberId: user.memberId, name: user.name }];
  });
  return json({ packageCode, items });
}
