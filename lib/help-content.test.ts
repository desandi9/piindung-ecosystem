import assert from "node:assert/strict"
import { test } from "node:test"
import { buildInitialHelpContent, toPublicHelpContent, validateHelpContent } from "./help-content"

test("help content initial dataset is valid and public projection excludes drafts and hidden categories", () => {
  const migration = buildInitialHelpContent("2026-01-01T00:00:00.000Z")
  const content = migration.content
  assert.ok(content.categories.length > 0)
  assert.doesNotThrow(() => validateHelpContent(content))

  const hidden = { ...content.categories[0], visible: false }
  const draft = { ...content.categories[1].questions[0], id: "draft-question", status: "draft" as const }
  const withPrivate = validateHelpContent({ ...content, categories: [hidden, { ...content.categories[1], questions: [...content.categories[1].questions, draft] }] })
  const publicContent = toPublicHelpContent(withPrivate)
  assert.equal(publicContent.categories.some((category) => category.id === hidden.id), false)
  assert.equal(publicContent.categories.flatMap((category) => category.questions).some((question) => question.id === "draft-question"), false)
})

test("help content validation rejects invalid product, status, position, control characters, and unsafe support link", () => {
  const migration = buildInitialHelpContent()
  const content = migration.content
  const question = content.categories[0].questions[0]
  assert.throws(() => validateHelpContent({ ...content, support: { ...content.support, href: "https://evil.example" } }))
  assert.throws(() => validateHelpContent({ ...content, categories: [{ ...content.categories[0], questions: [{ ...question, productId: "unknown" }] }] }))
  assert.throws(() => validateHelpContent({ ...content, categories: [{ ...content.categories[0], questions: [{ ...question, status: "published<script>" }] }] }))
  assert.throws(() => validateHelpContent({ ...content, categories: [{ ...content.categories[0], position: 0 }] }))
  assert.throws(() => validateHelpContent({ ...content, support: { ...content.support, title: "bad\u0000text" } }))
})

test("buildInitialHelpContent normalizes legacy category/questions and skips invalid records", () => {
  const legacy = [
    {
      key: "faq-manager-1",
      data: {
        id: "legacy-cat",
        title: "Legacy Title",
        iconKey: "users",
        questions: [
          { id: "legacy-q-1", q: "Valid Q?", a: "Valid A." },
          { id: "legacy-q-2", q: "", a: "Empty Q." },
          { id: "legacy-q-3", q: "Empty A.", a: "" },
          { id: "legacy-q-4", q: "Valid Q?", a: "Duplicate text." },
        ],
      },
    },
    {
      key: "faq-manager-invalid",
      data: {
        id: "bad-cat",
        title: 123 as unknown as string,
        iconKey: "users",
        questions: [],
      },
    },
  ]
  const migration = buildInitialHelpContent("2026-01-01T00:00:00.000Z", legacy)
  assert.equal(migration.skippedCount, 3) // 2 bad questions + 1 bad category
  const category = migration.content.categories.find((c) => c.id === "legacy-cat")
  assert.ok(category)
  assert.equal(category.title, "Legacy Title")
  assert.equal(category.iconKey, "users")
  assert.equal(category.questions.length, 1)
  assert.equal(category.questions[0].question, "Valid Q?")
})
