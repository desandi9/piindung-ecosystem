import { spawnSync } from "node:child_process"
import { createRequire } from "node:module"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

export function validateGorutStagingMigrationEnvironment(env = {}) {
  const deploymentEnvironment = env.GORUT_DEPLOYMENT_ENV?.trim().toUpperCase()
  const vercelEnvironment = env.VERCEL_ENV?.trim().toLowerCase()

  if (vercelEnvironment === "production") {
    return { ok: false, error: "Vercel production migrations are forbidden by the GORUT staging guard." }
  }
  if (deploymentEnvironment !== "STAGING" && deploymentEnvironment !== "UAT") {
    return { ok: false, error: "GORUT_DEPLOYMENT_ENV must be explicitly set to STAGING or UAT." }
  }
  if (!env.DATABASE_URL?.trim()) {
    return { ok: false, error: "DATABASE_URL must be configured through the deployment environment." }
  }
  if (env.GORUT_NON_PRODUCTION_DB_CONFIRMED !== "true") {
    return {
      ok: false,
      error: "Set GORUT_NON_PRODUCTION_DB_CONFIRMED=true only after a human verifies the database is dedicated non-production infrastructure.",
    }
  }

  return { ok: true, deploymentEnvironment }
}

export function parseMigrationAction(args = []) {
  if (args.length !== 1 || (args[0] !== "deploy" && args[0] !== "status")) {
    return { ok: false, error: "Expected exactly one migration action: deploy or status." }
  }
  return { ok: true, action: args[0] }
}

export function runGorutStagingMigration({ args = process.argv.slice(2), env = process.env } = {}) {
  const action = parseMigrationAction(args)
  if (!action.ok) return action

  const guard = validateGorutStagingMigrationEnvironment(env)
  if (!guard.ok) return guard

  const require = createRequire(import.meta.url)
  const prismaCli = require.resolve("prisma/build/index.js")
  const prismaArgs = action.action === "deploy" ? ["migrate", "deploy"] : ["migrate", "status"]

  console.log(`GORUT ${guard.deploymentEnvironment} migration guard passed.`)
  if (env.GORUT_ENABLE_PROVISIONAL_FEE_POLICY !== "true") {
    console.warn("Warning: GORUT_ENABLE_PROVISIONAL_FEE_POLICY=true is required by the RC runtime contract, but it is intentionally not a migration permission gate.")
  }
  console.log("DATABASE_URL is configured and intentionally not printed; target identity must be recorded in the deployment evidence.")

  const result = spawnSync(process.execPath, [prismaCli, ...prismaArgs], {
    env,
    stdio: "inherit",
  })

  if (result.error) return { ok: false, error: result.error.message }
  if (result.status !== 0) return { ok: false, error: `Prisma migrate ${action.action} exited with status ${result.status}.` }
  return { ok: true, action: action.action, deploymentEnvironment: guard.deploymentEnvironment }
}

const isDirectExecution = process.argv[1]
  ? import.meta.url === pathToFileURL(resolve(process.argv[1])).href
  : false

if (isDirectExecution) {
  const result = runGorutStagingMigration()
  if (!result.ok) {
    console.error(`GORUT staging migration blocked: ${result.error}`)
    process.exitCode = 1
  }
}
