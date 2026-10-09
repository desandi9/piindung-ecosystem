import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import bcrypt from "bcryptjs"
import ts from "typescript"

const require = createRequire(import.meta.url)
const password = "unit-test-only-password"
const account = {
  id: "unit-user", name: "Unit account", phone: "08123456789",
  email: null, passwordHash: await bcrypt.hash(password, 4),
  role: "admin_kordes", status: "Aktif", avatar: null,
}

// Execute the real route and pure auth helpers; never load Prisma or provisioning.
function loginHarness(user = account) {
  const calls = { provisioning: 0, reads: [], writes: [] }
  const prisma = {
    async $queryRaw(strings, ...values) {
      calls.reads.push({ sql: strings.join("?"), values })
      return user ? [{ ...user }] : []
    },
    async $executeRaw(strings, ...values) {
      calls.writes.push({ sql: strings.join("?"), values })
      return 1
    },
  }
  const cache = new Map()
  const pureHelpers = new Set(["@/lib/phone", "@/lib/session-token", "@/lib/safe-redirect", "@/lib/request-security"])
  function load(relativePath) {
    if (cache.has(relativePath)) return cache.get(relativePath)
    const filename = fileURLToPath(new URL(`../${relativePath}`, import.meta.url))
    const output = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText
    const loadedModule = { exports: {} }
    const dependency = (name) => {
      if (name === "@/lib/prisma") return { getPrismaClient: () => prisma }
      if (name === "@/lib/auth-server") return { ensureDefaultUsers: async () => { calls.provisioning += 1 } }
      if (pureHelpers.has(name)) return load(`${name.slice(2)}.ts`)
      if (name === "bcryptjs" || name === "next/server") return require(name)
      throw new Error(`Unexpected login dependency: ${name}`)
    }
    new Function("require", "module", "exports", "process", output)(dependency, loadedModule, loadedModule.exports, {
      env: { NODE_ENV: "production", AUTH_SECRET: "unit-test-only-secret" },
    })
    cache.set(relativePath, loadedModule.exports)
    return loadedModule.exports
  }
  return { POST: load("app/api/auth/login/route.ts").POST, session: load("lib/session-token.ts"), calls }
}

function request(body, headers = {}) {
  return new Request("https://auth.test/api/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

for (const [label, user, body, status] of [
  ["missing phone", account, { password }, 400],
  ["missing password", account, { phoneNumber: account.phone }, 400],
  ["unknown account", null, { phoneNumber: account.phone, password }, 401],
  ["wrong password", account, { phoneNumber: account.phone, password: "wrong-unit-password" }, 401],
  ["inactive account", { ...account, status: "Nonaktif" }, { phoneNumber: account.phone, password }, 401],
]) {
  test(`${label} is rejected without provisioning, audit writes or cookies`, async () => {
    const { POST, calls } = loginHarness(user)
    const response = await POST(request(body))
    assert.equal(response.status, status)
    assert.equal(response.headers.get("set-cookie"), null)
    assert.equal(typeof (await response.json()).error, "string")
    assert.equal(calls.provisioning, 0)
    assert.deepEqual(calls.writes, [])
  })
}

for (const [label, body, headers, status] of [
  ["malformed JSON", "{", {}, 400],
  ["foreign origin", { phoneNumber: account.phone, password }, { Origin: "https://foreign.test" }, 403],
  ["wrong content type", {}, { "Content-Type": "text/plain" }, 415],
]) {
  test(`${label} preserves request-security rejection before DB access`, async () => {
    const { POST, calls } = loginHarness()
    const response = await POST(request(body, headers))
    assert.equal(response.status, status)
    assert.equal(response.headers.get("set-cookie"), null)
    assert.deepEqual(calls, { provisioning: 0, reads: [], writes: [] })
  })
}

for (const remember of [undefined, false, true]) {
  test(`successful login (remember=${remember}) signs session and writes only authenticated lastLoginAt`, async () => {
    const { POST, calls, session } = loginHarness()
    const before = Date.now()
    const response = await POST(request({ phoneNumber: "+62 812-345-6789", password, remember }))
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), {
      user: { id: "unit-user", name: "Unit account", email: "", role: "admin_kordes" },
    })
    assert.equal(calls.provisioning, 0)
    assert.equal(calls.reads.length, 1)
    assert.match(calls.reads[0].sql, /FROM "User" WHERE phone = \? LIMIT 1$/)
    assert.deepEqual(calls.reads[0].values, ["08123456789"])
    assert.equal(calls.writes.length, 1)
    assert.deepEqual(calls.writes[0].sql, 'UPDATE "User" SET "lastLoginAt" = ? WHERE id = ?')
    const [lastLoginAt, id] = calls.writes[0].values
    assert.equal(id, "unit-user")
    assert.ok(lastLoginAt instanceof Date && lastLoginAt.getTime() >= before && lastLoginAt.getTime() <= Date.now())
    const cookie = response.cookies.get("piindung-session")
    assert.ok(cookie)
    assert.equal(cookie.httpOnly, true)
    assert.equal(cookie.secure, true)
    assert.equal(cookie.sameSite, "lax")
    assert.equal(cookie.path, "/")
    const persistent = remember ?? true
    assert.equal(cookie.maxAge, persistent ? 2592000 : undefined)
    assert.equal(cookie.expires instanceof Date, persistent)
    const payload = await session.verifySessionToken(cookie.value, "unit-test-only-secret")
    assert.ok(payload)
    assert.equal(payload.sub, "unit-user")
    assert.equal(payload.role, "admin_kordes")
    assert.equal(payload.remember, persistent)
    assert.equal(payload.exp - payload.iat, persistent ? 2592000000 : 43200000)
    assert.equal(await session.verifySessionToken(cookie.value, "wrong-unit-secret"), null)
  })
}
