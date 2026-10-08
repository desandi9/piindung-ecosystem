import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { runInNewContext } from "node:vm"
import ts from "typescript"

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, "..")

// 1. Check types/auth.ts - AppRole includes "plpk"
const authTypesContent = readFileSync(resolve(rootDir, "types/auth.ts"), "utf-8")
assert.match(
  authTypesContent,
  /export\s+type\s+AppRole\s*=\s*[^;\n]*"plpk"/,
  'AppRole union in types/auth.ts must include "plpk"',
)

// 2. Check lib/portal-user-management.ts - appRoles registry includes "plpk"
const portalUserContent = readFileSync(resolve(rootDir, "lib/portal-user-management.ts"), "utf-8")
assert.match(
  portalUserContent,
  /export\s+const\s+appRoles:\s*readonly\s+AppRole\[\]\s*=\s*\[[^\]]*"plpk"[^\]]*\]/,
  'appRoles registry in lib/portal-user-management.ts must include "plpk"',
)

// 3. Check features/auth/role-config.ts - roleDisplayNames & adminDashboardRoles
const roleConfigContent = readFileSync(resolve(rootDir, "features/auth/role-config.ts"), "utf-8")
assert.match(
  roleConfigContent,
  /plpk:\s*"Petugas Lapangan \(PLPK\)"/,
  'roleDisplayNames in features/auth/role-config.ts must map plpk to "Petugas Lapangan (PLPK)"',
)

// 4. SECURITY: PLPK must NOT be in adminDashboardRoles or operationalRoles
const adminRolesMatch = roleConfigContent.match(/export\s+const\s+adminDashboardRoles:\s*AppRole\[\]\s*=\s*\[([^\]]*)\]/)
assert.ok(adminRolesMatch, "adminDashboardRoles definition not found")
assert.ok(
  !adminRolesMatch[1].includes('"plpk"'),
  'SECURITY: plpk must NOT be present in adminDashboardRoles',
)

const opRolesMatch = roleConfigContent.match(/export\s+const\s+operationalRoles:\s*AppRole\[\]\s*=\s*\[([^\]]*)\]/)
assert.ok(opRolesMatch, "operationalRoles definition not found")
assert.ok(
  !opRolesMatch[1].includes('"plpk"'),
  'SECURITY: plpk must NOT be present in operationalRoles',
)
const routeAccessContent = readFileSync(resolve(rootDir, "features/auth/route-access.ts"), "utf-8")
const adminGateSource = routeAccessContent.match(/export function canAccessAdminDashboard\([^]*?\n}/)?.[0]
assert.ok(adminGateSource, "Admin dashboard role gate not found")
const canAccessAdminDashboard = runInNewContext(`
  ${adminRolesMatch[0].replace("export const adminDashboardRoles: AppRole[]", "const adminDashboardRoles")}
  ${ts.transpileModule(adminGateSource.replace("export function", "function"), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText}
  canAccessAdminDashboard
`)
assert.equal(canAccessAdminDashboard("plpk"), false, "PLPK cannot access /admin")
assert.equal(canAccessAdminDashboard("admin_upzis"), true, "Admin access remains unchanged")

// 5. Check lib/portal-access.ts - capabilities mapping & exclusion from operationalModuleEligibleRoles
const portalAccessContent = readFileSync(resolve(rootDir, "lib/portal-access.ts"), "utf-8")
assert.match(
  portalAccessContent,
  /plpk:\s*\[\s*"portal\.access",\s*"profile\.view",\s*"notifications\.view"\s*\]/,
  'capabilities in lib/portal-access.ts must define minimum plpk permissions ["portal.access", "profile.view", "notifications.view"]',
)

const opEligibleMatch = portalAccessContent.match(/const\s+operationalModuleEligibleRoles:\s*readonly\s+AppRole\[\]\s*=\s*\[([^\]]*)\]/)
assert.ok(opEligibleMatch, "operationalModuleEligibleRoles definition not found")
assert.ok(
  !opEligibleMatch[1].includes('"plpk"'),
  'SECURITY: plpk must NOT be present in operationalModuleEligibleRoles',
)

// 6. Check proxy.ts - route access control
const proxyContent = readFileSync(resolve(rootDir, "proxy.ts"), "utf-8")
assert.match(
  proxyContent,
  /const\s+gorutPlpkMobilePrefix\s*=\s*"\/gorut-v2\/mobile\/plpk"/,
  'proxy.ts must declare gorutPlpkMobilePrefix = "/gorut-v2/mobile/plpk"',
)
assert.match(
  proxyContent,
  /if\s*\(\s*pathname\s*===\s*gorutPlpkMobilePrefix\s*\|\|\s*pathname\.startsWith\(`\$\{gorutPlpkMobilePrefix\}\/`\)\s*\)\s*return\s+role\s*===\s*"plpk"/,
  'canAccessGorutV2Path in proxy.ts must allow role "plpk" exclusively on gorutPlpkMobilePrefix',
)

// Exercise the actual proxy gate without importing Next's runtime into this focused assertion.
const gateSource = proxyContent.match(/export function canAccessGorutV2Path\([^]*?\n}/)?.[0]
assert.ok(gateSource, "Proxy gate definition not found")
const allowedRolesSource = proxyContent.match(/const gorutV2AllowedRoles = new Set\([^\n]+\)/)?.[0]
assert.ok(allowedRolesSource, "Proxy admin role allowlist not found")
const canAccessGorutV2Path = runInNewContext(`
  ${allowedRolesSource}
  const gorutMunfiqMobilePrefix = "/gorut-v2/mobile/munfiq"
  const gorutPlpkMobilePrefix = "/gorut-v2/mobile/plpk"
  ${ts.transpileModule(gateSource.replace("export function", "function"), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText}
  canAccessGorutV2Path
`)

// Allowed for plpk
assert.equal(canAccessGorutV2Path("plpk", "/gorut-v2/mobile/plpk"), true, "PLPK mobile root path must be allowed for plpk")
assert.equal(canAccessGorutV2Path("plpk", "/gorut-v2/mobile/plpk/scanner"), true, "PLPK mobile subpath must be allowed for plpk")

// Denied for plpk (unrelated / admin routes)
assert.equal(canAccessGorutV2Path("plpk", "/gorut-v2"), false, "GORUT V2 root must be denied for plpk")
assert.equal(canAccessGorutV2Path("plpk", "/gorut-v2/dashboard"), false, "GORUT V2 dashboard must be denied for plpk")
assert.equal(canAccessGorutV2Path("plpk", "/gorut-v2/pc"), false, "GORUT V2 PC command route must be denied for plpk")
assert.equal(canAccessGorutV2Path("plpk", "/gorut-v2/kordes"), false, "GORUT V2 Kordes route must be denied for plpk")
assert.equal(canAccessGorutV2Path("plpk", "/gorut-v2/upzis"), false, "GORUT V2 UPZIS route must be denied for plpk")
assert.equal(canAccessGorutV2Path("plpk", "/gorut-v2/mobile/munfiq"), false, "Munfiq mobile route must be denied for plpk")

// Denied for munfiq on plpk route
assert.equal(canAccessGorutV2Path("munfiq", "/gorut-v2/mobile/plpk"), false, "PLPK mobile route must be denied for munfiq")

// 7. Check scripts/seed-gorut-v2-uat.mjs - canonical appRole "plpk" for UAT PLPK fixtures
const seedContent = readFileSync(resolve(rootDir, "scripts/seed-gorut-v2-uat.mjs"), "utf-8")
assert.match(seedContent, /where: \{ role: "PLPK", isActive: true, user: \{ memberId: \{ in: plpkMemberIds \}, role: "plpk", status: "Aktif" \} \}/,
  "Fixture verification must require active PLPK assignment and canonical active User.role in the same count")
const expectedPlpkMembers = [
  "PID-CCCCCCCCA234",
  "PID-CCCCCCCCB234",
  "PID-CCCCCCCCD234",
  "PID-CCCCCCCCE234",
]

for (const memberId of expectedPlpkMembers) {
  const memberRegex = new RegExp(`memberId:\\s*"${memberId}"[^}]*appRole:\\s*"plpk"[^}]*role:\\s*"PLPK"`)
  assert.match(
    seedContent,
    memberRegex,
    `UAT fixture ${memberId} must have appRole "plpk" and operational role "PLPK"`,
  )
  assert.doesNotMatch(
    seedContent,
    new RegExp(`memberId:\\s*"${memberId}"[^}]*appRole:\\s*"admin_upzis"`),
    `UAT fixture ${memberId} must NOT retain legacy "admin_upzis" appRole`,
  )
}

// Ensure non-PLPK UAT actors remain unchanged
assert.match(
  seedContent,
  /memberId:\s*"PID-AAAAAAAAB234"[^}]*appRole:\s*"admin_upzis"[^}]*role:\s*"UPZIS"/,
  'UPZIS fixture PID-AAAAAAAAB234 must keep appRole "admin_upzis"',
)
assert.match(
  seedContent,
  /memberId:\s*"PID-BBBBBBBBA234"[^}]*appRole:\s*"admin_kordes"[^}]*role:\s*"RANTING"/,
  'Kordes fixture PID-BBBBBBBBA234 must keep appRole "admin_kordes"',
)
assert.match(
  seedContent,
  /memberId:\s*"PID-DDDDDDDDA234"[^}]*appRole:\s*"super_admin_pc"[^}]*role:\s*"PC"/,
  'PC fixture PID-DDDDDDDDA234 must keep appRole "super_admin_pc"',
)
assert.match(
  seedContent,
  /memberId:\s*"PID-EEEEEEEEA234"[^}]*appRole:\s*"munfiq"/,
  'Munfiq fixture PID-EEEEEEEEA234 must keep appRole "munfiq"',
)

console.log("PASS: Backend canonical AppRole 'plpk' contracts, registry, capabilities, proxy routing, and UAT seed fixtures verified.")
