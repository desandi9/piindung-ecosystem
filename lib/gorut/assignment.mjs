import { activeUserStatus } from "../portal-user-management.ts"

export const ACTIVE_ACCOUNT_STATUS = activeUserStatus

export function isLocalDatabase(value) {
  try {
    const url = new URL(value)
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname)
  } catch {
    return false
  }
}

export function validateAssignmentOptions({ flags, env }) {
  if (env.NODE_ENV === "production") return { ok: false, error: "Refusing production execution" }
  const options = { apply: false }
  const values = new Map([
    ["--user-id", "userId"], ["--member-id", "memberId"], ["--role", "role"],
    ["--kecamatan-code", "kecamatanCode"], ["--ranting-code", "rantingCode"], ["--plpk-code", "plpkCode"],
  ])
  for (let index = 0; index < flags.length; index++) {
    const flag = flags[index]
    if (flag === "--apply") {
      if (options.apply) return { ok: false, error: "Duplicate flag: --apply" }
      options.apply = true
      continue
    }
    if (["--kecamatan-id", "--ranting-id", "--plpk-id"].includes(flag)) {
      return { ok: false, error: `Flag ${flag} is forbidden. Use --kecamatan-code, --ranting-code, or --plpk-code instead.` }
    }
    const key = values.get(flag)
    if (!key) return { ok: false, error: `Unknown flag: ${flag}` }
    const value = flags[++index]
    if (!value || value.startsWith("--")) return { ok: false, error: `Missing value for ${flag}` }
    if (options[key]) return { ok: false, error: `Duplicate flag: ${flag}` }
    options[key] = value
  }
  if (options.apply && env.GORUT_ASSIGNMENT_ACK !== "local-development") return { ok: false, error: "--apply requires GORUT_ASSIGNMENT_ACK=local-development" }
  if (options.apply && !isLocalDatabase(env.DATABASE_URL)) return { ok: false, error: "Refusing non-local database execution" }
  if (!!options.userId === !!options.memberId) return { ok: false, error: "Specify exactly one of --user-id or --member-id" }
  const scopes = { PC: [], UPZIS: ["kecamatanCode"], RANTING: ["kecamatanCode", "rantingCode"], PLPK: ["plpkCode"] }
  if (!Object.hasOwn(scopes, options.role)) return { ok: false, error: "Unknown or missing role" }
  const supplied = ["kecamatanCode", "rantingCode", "plpkCode"].filter(key => options[key])
  if (supplied.length !== scopes[options.role].length || supplied.some((key, index) => key !== scopes[options.role][index])) return { ok: false, error: `Invalid scope for role ${options.role}` }
  return { ok: true, options }
}

export async function createAssignment({ options, prisma }) {
  const user = await prisma.user.findUnique({ where: options.userId ? { id: options.userId } : { memberId: options.memberId }, select: { id: true, status: true } })
  if (!user || user.status !== ACTIVE_ACCOUNT_STATUS) throw new Error("Selected user is not active")
  let kecamatanId = null
  let rantingId = null
  let plpkId = null
  if (options.kecamatanCode) {
    const scope = await prisma.gorutKecamatan.findUnique({ where: { code: options.kecamatanCode }, select: { id: true, isActive: true } })
    if (!scope?.isActive) throw new Error("Selected scope is not active")
    kecamatanId = scope.id
  }
  if (options.rantingCode) {
    const scope = await prisma.gorutRanting.findFirst({ where: { code: options.rantingCode, kecamatan: { code: options.kecamatanCode }, }, select: { id: true, isActive: true, kecamatan: { select: { isActive: true } } } })
    if (!scope?.isActive || !scope.kecamatan.isActive) throw new Error("Selected scope is not active")
    rantingId = scope.id
  }
  if (options.plpkCode) {
    const scope = await prisma.gorutPlpk.findUnique({ where: { code: options.plpkCode }, select: { id: true, isActive: true, ranting: { select: { isActive: true, kecamatan: { select: { isActive: true } } } } } })
    if (!scope?.isActive || !scope.ranting.isActive || !scope.ranting.kecamatan.isActive) throw new Error("Selected scope is not active")
    plpkId = scope.id
  }
  const data = { userId: user.id, role: options.role, kecamatanId, rantingId, plpkId }
  const where = { ...data, isActive: true }
  if (await prisma.gorutOperationalAssignment.findFirst({ where, select: { id: true } })) return { mode: options.apply ? "apply" : "dry-run", status: "unchanged", role: options.role }
  if (!options.apply) return { mode: "dry-run", status: "would-create", role: options.role }
  try {
    await prisma.gorutOperationalAssignment.create({ data, select: { id: true } })
    return { mode: "apply", status: "created", role: options.role }
  } catch (error) {
    if (error?.code === "P2002" && await prisma.gorutOperationalAssignment.findFirst({ where, select: { id: true } })) return { mode: "apply", status: "unchanged", role: options.role }
    throw error
  }
}
