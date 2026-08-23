import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"

const deploymentEnvironment = process.env.GORUT_DEPLOYMENT_ENV?.trim().toUpperCase()
const platformProduction = process.env.VERCEL_ENV?.trim().toLowerCase() === "production"
const feeEnabled = process.env.GORUT_ENABLE_PROVISIONAL_FEE_POLICY === "true"
const fixtureConfirmed = process.env.GORUT_UAT_FIXTURE_CONFIRM === "NON_PRODUCTION_ONLY"
const fixturePassword = process.env.GORUT_UAT_FIXTURE_PASSWORD ?? ""

if (platformProduction || (deploymentEnvironment !== "STAGING" && deploymentEnvironment !== "UAT")) {
  throw new Error("GORUT UAT fixture is disabled outside explicit STAGING/UAT and on Vercel production.")
}
if (!feeEnabled) throw new Error("GORUT_ENABLE_PROVISIONAL_FEE_POLICY=true is required for this UAT fixture.")
if (!fixtureConfirmed) throw new Error("Set GORUT_UAT_FIXTURE_CONFIRM=NON_PRODUCTION_ONLY after confirming the database is non-production.")
if (fixturePassword.length < 12) throw new Error("GORUT_UAT_FIXTURE_PASSWORD must contain at least 12 characters.")

const prisma = new PrismaClient()
const passwordHash = await bcrypt.hash(fixturePassword, 10)

const rantingFixtures = [
  { code: "UAT-R01", name: "[UAT] Ranting Boundary" },
  { code: "UAT-R02", name: "[UAT] Ranting Correction" },
  { code: "UAT-R03", name: "[UAT] Ranting Scope" },
]

const plpkFixtures = [
  { code: "UAT-P01", name: "[UAT] PLPK Financial", rantingCode: "UAT-R01" },
  { code: "UAT-P02", name: "[UAT] PLPK Boundary", rantingCode: "UAT-R01" },
  { code: "UAT-P03", name: "[UAT] PLPK Correction", rantingCode: "UAT-R02" },
  { code: "UAT-P04", name: "[UAT] PLPK Scope", rantingCode: "UAT-R03" },
]

const munfiqFixtures = [
  { code: "UAT-M001", name: "[UAT] Munfiq Gross 15000", plannedAmount: "15000", plpkCode: "UAT-P01" },
  { code: "UAT-M002", name: "[UAT] Munfiq Gross 12500", plannedAmount: "12500", plpkCode: "UAT-P01" },
  { code: "UAT-M003", name: "[UAT] Munfiq Gross 5000", plannedAmount: "5000", plpkCode: "UAT-P01" },
  { code: "UAT-M004", name: "[UAT] Munfiq Boundary 7000", plannedAmount: "7000", plpkCode: "UAT-P02" },
  { code: "UAT-M005", name: "[UAT] Munfiq Boundary 7001", plannedAmount: "7001", plpkCode: "UAT-P02" },
  { code: "UAT-M006", name: "[UAT] Munfiq Above 9000", plannedAmount: "9000", plpkCode: "UAT-P02" },
  { code: "UAT-M007", name: "[UAT] Munfiq Correction 8000", plannedAmount: "8000", plpkCode: "UAT-P03" },
  { code: "UAT-M008", name: "[UAT] Munfiq Correction 6000", plannedAmount: "6000", plpkCode: "UAT-P03" },
  { code: "UAT-M009", name: "[UAT] Munfiq Correction 10000", plannedAmount: "10000", plpkCode: "UAT-P03" },
  { code: "UAT-M010", name: "[UAT] Munfiq Scope 4000", plannedAmount: "4000", plpkCode: "UAT-P04" },
  { code: "UAT-M011", name: "[UAT] Munfiq Scope 7500", plannedAmount: "7500", plpkCode: "UAT-P04" },
  { code: "UAT-M012", name: "[UAT] Munfiq Scope 11000", plannedAmount: "11000", plpkCode: "UAT-P04" },
]

const actorFixtures = [
  { memberId: "PID-AAAAAAAAB234", name: "[UAT] UPZIS Maker", phone: "628990010001", appRole: "admin_upzis", role: "UPZIS", scopeCode: "UAT-KEC-01" },
  { memberId: "PID-AAAAAAAAC234", name: "[UAT] UPZIS Checker", phone: "628990010002", appRole: "admin_upzis", role: "UPZIS", scopeCode: "UAT-KEC-01" },
  { memberId: "PID-BBBBBBBBA234", name: "[UAT] Kordes Boundary", phone: "628990010003", appRole: "admin_kordes", role: "RANTING", scopeCode: "UAT-R01" },
  { memberId: "PID-BBBBBBBBC234", name: "[UAT] Kordes Correction", phone: "628990010004", appRole: "admin_kordes", role: "RANTING", scopeCode: "UAT-R02" },
  { memberId: "PID-BBBBBBBBD234", name: "[UAT] Kordes Scope", phone: "628990010005", appRole: "admin_kordes", role: "RANTING", scopeCode: "UAT-R03" },
  { memberId: "PID-CCCCCCCCA234", name: "[UAT] PLPK Financial", phone: "628990010006", appRole: "admin_upzis", role: "PLPK", scopeCode: "UAT-P01" },
  { memberId: "PID-CCCCCCCCB234", name: "[UAT] PLPK Boundary", phone: "628990010007", appRole: "admin_upzis", role: "PLPK", scopeCode: "UAT-P02" },
  { memberId: "PID-CCCCCCCCD234", name: "[UAT] PLPK Correction", phone: "628990010008", appRole: "admin_upzis", role: "PLPK", scopeCode: "UAT-P03" },
  { memberId: "PID-CCCCCCCCE234", name: "[UAT] PLPK Scope", phone: "628990010009", appRole: "admin_upzis", role: "PLPK", scopeCode: "UAT-P04" },
]

async function upsertAssignment(tx, userId, actor, kecamatan, rantings, plpks) {
  const scope = actor.role === "UPZIS"
    ? { kecamatanId: kecamatan.id, rantingId: null, plpkId: null }
    : actor.role === "RANTING"
      ? { kecamatanId: null, rantingId: rantings.get(actor.scopeCode).id, plpkId: null }
      : { kecamatanId: null, rantingId: null, plpkId: plpks.get(actor.scopeCode).id }
  const existing = await tx.gorutOperationalAssignment.findFirst({
    where: { userId, role: actor.role, ...scope },
    select: { id: true },
  })
  if (existing) {
    await tx.gorutOperationalAssignment.update({ where: { id: existing.id }, data: { isActive: true } })
    return
  }
  await tx.gorutOperationalAssignment.create({ data: { userId, role: actor.role, ...scope } })
}

try {
  const result = await prisma.$transaction(async (tx) => {
    const kecamatan = await tx.gorutKecamatan.upsert({
      where: { code: "UAT-KEC-01" },
      create: { code: "UAT-KEC-01", name: "[UAT] Kecamatan Release Candidate" },
      update: { name: "[UAT] Kecamatan Release Candidate", isActive: true },
    })

    const rantings = new Map()
    for (const fixture of rantingFixtures) {
      const row = await tx.gorutRanting.upsert({
        where: { kecamatanId_code: { kecamatanId: kecamatan.id, code: fixture.code } },
        create: { ...fixture, kecamatanId: kecamatan.id },
        update: { name: fixture.name, isActive: true },
      })
      rantings.set(fixture.code, row)
    }

    const plpks = new Map()
    for (const fixture of plpkFixtures) {
      const row = await tx.gorutPlpk.upsert({
        where: { code: fixture.code },
        create: { code: fixture.code, name: fixture.name, rantingId: rantings.get(fixture.rantingCode).id },
        update: { name: fixture.name, rantingId: rantings.get(fixture.rantingCode).id, isActive: true },
      })
      plpks.set(fixture.code, row)
    }

    for (const [index, fixture] of munfiqFixtures.entries()) {
      const plpk = plpks.get(fixture.plpkCode)
      await tx.gorutMunfiq.upsert({
        where: { code: fixture.code },
        create: {
          code: fixture.code,
          nik: `327301010101${String(index + 1).padStart(4, "0")}`,
          name: fixture.name,
          address: `[UAT] nominal rencana Rp${fixture.plannedAmount}`,
          rantingId: plpk.rantingId,
          plpkId: plpk.id,
          joinedAt: new Date("2026-08-01T00:00:00.000Z"),
        },
        update: { name: fixture.name, address: `[UAT] nominal rencana Rp${fixture.plannedAmount}`, rantingId: plpk.rantingId, plpkId: plpk.id, isActive: true },
      })
    }

    for (const actor of actorFixtures) {
      const user = await tx.user.upsert({
        where: { memberId: actor.memberId },
        create: { memberId: actor.memberId, name: actor.name, phone: actor.phone, email: `${actor.memberId.slice(4).toLowerCase()}@gorut-uat.invalid`, passwordHash, role: actor.appRole },
        update: { name: actor.name, phone: actor.phone, passwordHash, role: actor.appRole, status: "Aktif" },
      })
      await tx.appRecord.upsert({
        where: { scope_key: { scope: "portal-module-grants", key: user.id } },
        create: { scope: "portal-module-grants", key: user.id, data: { grants: [{ userId: user.id, moduleKey: "gorut", enabled: true, actorId: "GORUT_UAT_FIXTURE" }] } },
        update: { data: { grants: [{ userId: user.id, moduleKey: "gorut", enabled: true, actorId: "GORUT_UAT_FIXTURE" }] } },
      })
      await upsertAssignment(tx, user.id, actor, kecamatan, rantings, plpks)
    }

    return { kecamatan: kecamatan.code, rantings: rantings.size, plpks: plpks.size, munfiqs: munfiqFixtures.length, actors: actorFixtures.length }
  })

  console.log("GORUT V2 NON-PRODUCTION UAT fixture ready:", result)
  console.log("Synthetic login phones:", actorFixtures.map((actor) => `${actor.name}: ${actor.phone}`).join(" | "))
  console.log("Password was read from GORUT_UAT_FIXTURE_PASSWORD and was not printed.")
} finally {
  await prisma.$disconnect()
}
