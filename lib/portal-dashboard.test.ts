import assert from "node:assert/strict"
import test from "node:test"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { resolveAccountLinks, resolveDashboardTasks, resolveGorutApp, type DashboardAccess } from "./portal-dashboard.ts"

const base: DashboardAccess = {
  role: "admin_pc",
  permissions: ["portal.access", "dashboard.view", "profile.view", "help.view", "notifications.view"],
  modules: [{ key: "gorut" }],
  operationalRole: null,
  munfiqLinked: null,
  adminDashboard: false,
}

const hrefs = (access: DashboardAccess) => resolveDashboardTasks(access).map((task) => task.href)

void test("PC assignment gets the live PC package workspaces in workflow order", () => {
  assert.deepEqual(hrefs({ ...base, operationalRole: "PC" }), ["/gorut-v2/setoran", "/gorut-v2/validasi", "/gorut-v2/approval"])
})

void test("UPZIS maker and checker share the live UPZIS package workspace", () => {
  assert.deepEqual(hrefs({ ...base, role: "admin_upzis", operationalRole: "UPZIS" }), ["/gorut-v2/penghimpunan/verifikasi-upzis"])
})

void test("Kordes (RANTING) verification uses the server-mode mobile route", () => {
  assert.deepEqual(hrefs({ ...base, role: "admin_kordes", operationalRole: "RANTING" }), ["/gorut-v2/mobile/kordes"])
})

void test("PLPK gets the pickup workspace only with an active PLPK assignment", () => {
  const plpk = { ...base, role: "plpk" as const, modules: [], permissions: ["portal.access", "profile.view", "notifications.view"] }
  assert.deepEqual(hrefs({ ...plpk, operationalRole: "PLPK" }), ["/gorut-v2/mobile/plpk"])
  assert.deepEqual(hrefs(plpk), [])
})

void test("Munfiq services appear only when the Munfiq identity is linked", () => {
  const munfiq = { ...base, role: "munfiq" as const, modules: [], permissions: ["portal.access", "profile.view", "notifications.view"] }
  assert.deepEqual(hrefs({ ...munfiq, munfiqLinked: true }), [
    "/gorut-v2/mobile/munfiq",
    "/gorut-v2/mobile/munfiq/penjemputan",
    "/gorut-v2/mobile/munfiq/program",
    "/gorut-v2/mobile/munfiq/notifikasi",
  ])
  assert.deepEqual(hrefs({ ...munfiq, munfiqLinked: false }), [])
})

void test("operational roles without the GORUT module grant get no GORUT tasks", () => {
  assert.deepEqual(hrefs({ ...base, modules: [], operationalRole: "PC" }), [])
})

void test("portal management tasks follow the existing permission rules", () => {
  assert.deepEqual(hrefs({ ...base, permissions: [...base.permissions, "articles.manage"] }), ["/dashboard/landing-page"])
  assert.deepEqual(hrefs({ ...base, adminDashboard: true }), ["/admin"])
  assert.deepEqual(hrefs({ ...base, permissions: [...base.permissions, "users.manage"] }), ["/admin"])
})

void test("GORUT app entry is open only when the destination will authorize the user", () => {
  assert.deepEqual(resolveGorutApp({ ...base, operationalRole: "UPZIS" }), { kind: "open", href: "/gorut-v2/dashboard" })
  assert.equal(resolveGorutApp({ ...base, operationalRole: null }).kind, "locked")
  assert.equal(resolveGorutApp({ ...base, modules: [], operationalRole: "PC" }).kind, "locked")
  assert.deepEqual(resolveGorutApp({ ...base, role: "munfiq", modules: [], munfiqLinked: true }), { kind: "open", href: "/gorut-v2/mobile/munfiq" })
  assert.deepEqual(resolveGorutApp({ ...base, role: "plpk", modules: [], operationalRole: "PLPK" }), { kind: "open", href: "/gorut-v2/mobile/plpk" })
})

void test("account links respect portal permissions", () => {
  const links = resolveAccountLinks({ ...base, permissions: [...base.permissions, "member_area.view"] }).map((link) => link.href)
  assert.deepEqual(links, ["/profil/identitas", "/pengaturan-profil", "/notifikasi", "/dashboard/bantuan"])
  const munfiqLinks = resolveAccountLinks({ ...base, role: "munfiq", permissions: ["portal.access", "profile.view", "notifications.view"] }).map((link) => link.href)
  assert.deepEqual(munfiqLinks, ["/pengaturan-profil", "/notifikasi", "/bantuan"])
})

void test("no dashboard destination ever points at legacy GORUT V1", () => {
  const roles = ["super_admin_pc", "admin_pc", "admin_upzis", "admin_kordes", "munfiq", "plpk"] as const
  const operational = ["PC", "UPZIS", "RANTING", "PLPK", null] as const
  for (const role of roles) {
    for (const operationalRole of operational) {
      const access: DashboardAccess = { ...base, role, operationalRole, munfiqLinked: true, adminDashboard: true, permissions: [...base.permissions, "articles.manage", "member_area.view"] }
      const app = resolveGorutApp(access)
      const all = [...resolveDashboardTasks(access).map((task) => task.href), ...resolveAccountLinks(access).map((link) => link.href), ...(app.kind === "open" ? [app.href] : [])]
      for (const href of all) assert.ok(!/^\/gorut(\/|$)/.test(href), `${role}/${operationalRole} -> ${href}`)
    }
  }
})
