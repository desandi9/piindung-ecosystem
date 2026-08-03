import assert from "node:assert/strict"
import { test } from "node:test"
import { createPublicProduct, isValidPublicProductRoute, normalizePublicProductId } from "./public-products-data"

test("normalizePublicProductId creates safe slug from name", () => {
  assert.equal(normalizePublicProductId("GORUT Koin"), "gorut-koin")
  assert.equal(normalizePublicProductId("  E-Tasyaruf  "), "e-tasyaruf")
  assert.equal(normalizePublicProductId("!!!"), null)
})

test("isValidPublicProductRoute allows empty, internal path, and http(s)", () => {
  assert.equal(isValidPublicProductRoute(""), true)
  assert.equal(isValidPublicProductRoute("/gorut"), true)
  assert.equal(isValidPublicProductRoute("https://example.com/x"), true)
  assert.equal(isValidPublicProductRoute("http://example.com"), true)
  assert.equal(isValidPublicProductRoute("//evil"), false)
  assert.equal(isValidPublicProductRoute("/a/../b"), false)
  assert.equal(isValidPublicProductRoute("ftp://x"), false)
  assert.equal(isValidPublicProductRoute("not-a-url"), false)
})

test("createPublicProduct builds id and trims fields", () => {
  const product = createPublicProduct({
    name: "  Produk Baru  ",
    shortName: " PB ",
    description: " Deskripsi produk ",
    iconUrl: " /icon.png ",
    category: "Tata Kelola",
    status: "Segera Hadir",
    publicHref: " /produk ",
    visible: true,
    featured: false,
    position: 6,
  })
  assert.ok(product)
  assert.equal(product!.id, "produk-baru")
  assert.equal(product!.name, "Produk Baru")
  assert.equal(product!.shortName, "PB")
  assert.equal(product!.description, "Deskripsi produk")
  assert.equal(product!.iconUrl, "/icon.png")
  assert.equal(product!.publicHref, "/produk")
  assert.equal(product!.position, 6)
})

test("createPublicProduct rejects names that cannot become safe ids", () => {
  assert.equal(createPublicProduct({
    name: "!!!",
    shortName: "",
    description: "x",
    iconUrl: "",
    category: "Tata Kelola",
    status: "Aktif",
    publicHref: "",
    visible: true,
    featured: false,
    position: 1,
  }), null)
})
