import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()
try {
  const checks = {
    kecamatanOrphans: (await p.$queryRaw`SELECT count(*)::int AS count FROM "GorutRanting" r LEFT JOIN "GorutKecamatan" k ON k.id = r."kecamatanId" WHERE k.id IS NULL`)[0].count,
    rantingOrphans: (await p.$queryRaw`SELECT count(*)::int AS count FROM "GorutPlpk" p LEFT JOIN "GorutRanting" r ON r.id = p."rantingId" WHERE r.id IS NULL`)[0].count,
    munfiqOrphans: (await p.$queryRaw`SELECT count(*)::int AS count FROM "GorutMunfiq" m LEFT JOIN "GorutPlpk" p ON p.id = m."plpkId" LEFT JOIN "GorutRanting" r ON r.id = m."rantingId" WHERE p.id IS NULL OR r.id IS NULL`)[0].count,
    transactionOrphans: (await p.$queryRaw`SELECT count(*)::int AS count FROM "GorutTransaction" t LEFT JOIN "GorutPlpk" p ON p.id = t."plpkId" LEFT JOIN "GorutRanting" r ON r.id = t."rantingId" LEFT JOIN "GorutKecamatan" k ON k.id = t."kecamatanId" LEFT JOIN "User" u ON u.id = t."createdByUserId" WHERE p.id IS NULL OR r.id IS NULL OR k.id IS NULL OR u.id IS NULL`)[0].count,
    itemOrphans: (await p.$queryRaw`SELECT count(*)::int AS count FROM "GorutTransactionItem" i LEFT JOIN "GorutTransaction" t ON t.id = i."transactionId" LEFT JOIN "GorutMunfiq" m ON m.id = i."munfiqId" WHERE t.id IS NULL OR m.id IS NULL`)[0].count,
    workflowOrphans: (await p.$queryRaw`SELECT count(*)::int AS count FROM "GorutWorkflowEvent" e LEFT JOIN "GorutTransaction" t ON t.id = e."transactionId" LEFT JOIN "User" u ON u.id = e."actorUserId" WHERE t.id IS NULL OR u.id IS NULL`)[0].count,
    duplicateCodes: (await p.$queryRaw`SELECT count(*)::int AS count FROM (SELECT code FROM "GorutTransaction" GROUP BY code HAVING count(*) > 1) d`)[0].count,
    assignments: (await p.$queryRaw`SELECT count(*)::int AS count FROM "GorutOperationalAssignment"`)[0].count,
  }
  console.log(JSON.stringify(checks))
} finally { await p.$disconnect() }
