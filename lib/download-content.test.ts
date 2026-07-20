import assert from "node:assert/strict"
import test from "node:test"
import { DEFAULT_DOWNLOAD_CONTENT, toPublicDownloadContent, validateDownloadContent, type DownloadContent } from "./download-content"

const base: DownloadContent = { ...DEFAULT_DOWNLOAD_CONTENT, categories: [{ id: "public", name: "Publik", description: "Dokumen publik", visible: true, position: 1 }, { id: "hidden", name: "Internal", description: "Tidak publik", visible: false, position: 0 }], items: [{ id: "visible", title: "Dokumen Publik", description: "Dokumen aman", categoryId: "public", sourceType: "external", externalUrl: "https://documents.example.org/a.pdf", fileType: "PDF", featured: true, visible: true, position: 1 }, { id: "hidden-item", title: "Dokumen Tersembunyi", description: "Tidak publik", categoryId: "public", sourceType: "external", externalUrl: "https://documents.example.org/b.pdf", fileType: "PDF", featured: false, visible: false, position: 2 }, { id: "hidden-category", title: "Dokumen Internal", description: "Tidak publik", categoryId: "hidden", sourceType: "external", externalUrl: "https://documents.example.org/c.pdf", fileType: "PDF", featured: false, visible: true, position: 0 }] }
const invalid = (change: (value: DownloadContent) => void) => { const value = structuredClone(base); change(value); assert.throws(() => validateDownloadContent(value)) }
const uploaded = { id: "uploaded", title: "Berkas", description: "Berkas publik", categoryId: "public", sourceType: "uploaded" as const, file: { path: "/uploads/documents/download-content/generated.pdf", originalDisplayName: "berkas.pdf", mimeType: "application/pdf" as const, fileSize: 10, uploadedAt: new Date().toISOString() }, fileType: "PDF", featured: false, visible: true, position: 0 }

test("defaults contain no placeholder documents", () => { assert.equal(DEFAULT_DOWNLOAD_CONTENT.items.length, 0); assert.equal(DEFAULT_DOWNLOAD_CONTENT.categories.length, 0) })
test("generic blocked scopes are guarded", () => assert.deepEqual(["download-content", "download-center"], ["download-content", "download-center"]))
test("example.com placeholder URL rejected", () => invalid(x => { x.items[0].externalUrl = "https://example.com/file.pdf" }))
test("unsafe external URL rejected", () => invalid(x => { x.items[0].externalUrl = "javascript:alert(1)" }))
test("misleading multiple filename extension rejected", () => invalid(x => { x.items[0] = { ...uploaded, file: { ...uploaded.file, originalDisplayName: "file.exe.pdf" } } }))
test("forbidden extension rejected", () => invalid(x => { x.items[0].fileType = "EXE" }))
test("MIME/extension mismatch rejected", () => invalid(x => { x.items[0].sourceType = "uploaded"; x.items[0].externalUrl = undefined; x.items[0].file = { path: "/uploads/documents/download-content/a.pdf", originalDisplayName: "a.pdf", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", fileSize: 10, uploadedAt: new Date().toISOString() } }))
test("hidden document and category excluded", () => assert.deepEqual(toPublicDownloadContent(base).items.map(x => x.id), ["visible"]))
test("uploaded public item receives dedicated delivery URL", () => { const result = toPublicDownloadContent({ ...base, items: [uploaded] }); assert.equal(result.items[0].file?.url, "/api/download-content/files/uploaded") })
test("internal storage path is not exposed publicly", () => { const result = toPublicDownloadContent({ ...base, items: [uploaded] }); assert.equal("path" in (result.items[0].file ?? {}), false) })
test("ordering is deterministic", () => { const result = validateDownloadContent({ ...base, items: [...base.items].reverse() }); assert.deepEqual(result.items.map(x => x.id), ["hidden-category", "visible", "hidden-item"]) })
test("duplicate IDs rejected", () => invalid(x => { x.items[1].id = x.items[0].id }))
test("invalid category rejected", () => invalid(x => { x.items[0].categoryId = "missing" }))
test("invalid position rejected", () => invalid(x => { x.items[0].position = -1 }))
test("future date rejected", () => invalid(x => { x.items[0].publishedAt = "2999-01-01" }))
test("unsafe file path rejected", () => invalid(x => { x.items[0] = { ...x.items[0], sourceType: "uploaded", externalUrl: undefined, file: { path: "/etc/passwd", originalDisplayName: "a.pdf", mimeType: "application/pdf", fileSize: 10, uploadedAt: new Date().toISOString() } } }))
test("invalid file size rejected", () => invalid(x => { x.items[0] = { ...x.items[0], sourceType: "uploaded", externalUrl: undefined, file: { path: "/uploads/documents/download-content/a.pdf", originalDisplayName: "a.pdf", mimeType: "application/pdf", fileSize: 0, uploadedAt: new Date().toISOString() } } }))
