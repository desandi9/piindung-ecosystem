import assert from "node:assert/strict"
import test from "node:test"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { getPrismaClient } from "./prisma.ts"

void test("production reuses one PrismaClient instead of opening a new pool per call", () => {
  const previous = process.env.NODE_ENV
  Object.assign(process.env, { NODE_ENV: "production" })
  try {
    assert.equal(getPrismaClient(), getPrismaClient())
  } finally {
    Object.assign(process.env, { NODE_ENV: previous })
  }
})
