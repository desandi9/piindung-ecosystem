import { PrismaClient } from "@prisma/client"
import { backfill, validateBackfillOptions } from "../lib/gorut/legacy-backfill.mjs"

const checked = validateBackfillOptions({ flags: process.argv.slice(2), env: process.env })
if (!checked.ok) throw new Error(checked.error)
const prisma = new PrismaClient()
try { const summary = await backfill({ apply: checked.apply, prisma }); console.log(JSON.stringify({ mode: checked.apply ? "apply" : "dry-run", scopes: summary })) } finally { await prisma.$disconnect() }
