import assert from "node:assert/strict"
import test from "node:test"
import { readJsonMutation, validateMutationRequest } from "./request-security"

const request = (headers: HeadersInit, body = "{}") => new Request("https://piindung.test/api/account/profile", { method: "PATCH", headers, body })

void test("validateMutationRequest", () => {
  assert.equal(validateMutationRequest(request({ "content-type": "application/json", origin: "https://piindung.test" })), null)
  assert.equal(validateMutationRequest(request({ "content-type": "text/plain" }))?.status, 415)
  assert.equal(validateMutationRequest(request({ "content-type": "application/json", origin: "https://evil.test" }))?.status, 403)
  assert.equal(validateMutationRequest(request({ "content-type": "application/json", "content-length": "1048577" }))?.status, 413)
})

void test("readJsonMutation", async () => {
  assert.equal((await readJsonMutation(request({ "content-type": "application/json" }, "{"))).failure?.status, 400)
})

