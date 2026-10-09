import assert from 'node:assert/strict'
import test from 'node:test'
import { createCollectionClient, createSingletonClient, RecordRequestError } from './record-client'
import { setRequestActor } from './actor-session'

void test('empty settings and collection reads never seed or mutate records', async (t) => {
  const methods: string[] = []
  t.mock.method(globalThis, 'fetch', async (_input: unknown, init?: RequestInit) => {
    methods.push(init?.method ?? 'GET')
    return Response.json({ records: [] })
  })
  const singleton = createSingletonClient({ scope: 'maintenance-mode', defaultValue: { enabled: false }, eventName: 'test-settings' })
  const collection = createCollectionClient({ scope: 'activity-log', defaultItems: [{ id: 'example' }], eventName: 'test-items' })
  assert.deepEqual(await singleton.readValue(), { enabled: false })
  await collection.readItems()
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.deepEqual(methods, ['GET', 'GET'])
})

void test('401/403 remain typed rejected mutations and cannot populate the cache', async (t) => {
  for (const status of [401, 403]) {
    t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'Denied' }, { status }))
    const client = createSingletonClient({ scope: 'maintenance-mode', defaultValue: { enabled: false }, eventName: 'test-settings' })
    await assert.rejects(client.writeValue({ enabled: true }), (error: unknown) => error instanceof RecordRequestError && error.status === status && error.endpoint.endsWith('/singleton'))
    assert.deepEqual(client.readValueSync(), { enabled: false })
    t.mock.restoreAll()
  }
})

void test('a delayed previous-actor read cannot replace the new actor cache', async (t) => {
  setRequestActor('actor-a')
  let complete!: (response: Response) => void
  let requests = 0
  t.mock.method(globalThis, 'fetch', async () => {
    if (++requests === 1) return new Promise<Response>(resolve => { complete = resolve })
    return Response.json({ records: [{ data: { id: 'actor-b-data' } }] })
  })
  const client = createCollectionClient<{ id: string }>({ scope: 'test', defaultItems: [], eventName: 'test-items' })
  const oldRead = client.readItems()
  setRequestActor('actor-b')
  assert.deepEqual(client.readItemsSync(), [])
  await client.readItems()
  complete(Response.json({ records: [{ data: { id: 'actor-a-secret' } }] }))
  await oldRead
  assert.deepEqual(client.readItemsSync(), [{ id: 'actor-b-data' }])
})

void test('late failed optimistic write never rolls the new actor cache back', async (t) => {
  setRequestActor('actor-a')
  let complete!: (response: Response) => void
  t.mock.method(globalThis, 'fetch', async (_input: unknown, init?: RequestInit) => {
    if (init?.method === 'PATCH') return new Promise<Response>(resolve => { complete = resolve })
    return Response.json({ records: [{ data: { id: 'actor-b-data' } }] })
  })
  const client = createCollectionClient({ scope: 'test', defaultItems: [{ id: 'actor-a-data' }], eventName: 'test-items' })
  const write = client.writeItems([{ id: 'actor-a-data' }])
  const rejected = assert.rejects(write, { name: 'AbortError' })
  setRequestActor('actor-b')
  await client.readItems()
  complete(Response.json({ error: 'Denied' }, { status: 403 }))
  await rejected
  assert.deepEqual(client.readItemsSync(), [{ id: 'actor-b-data' }])
})

void test('public site settings survive actor changes but settings writes are still canceled', async (t) => {
  let complete!: (response: Response) => void
  t.mock.method(globalThis, 'fetch', async (_input: unknown, init?: RequestInit) => {
    if (init?.method === 'PATCH') return new Promise<Response>(resolve => { complete = resolve })
    return Response.json({ records: [{ data: { enabled: true } }] })
  })
  const client = createSingletonClient({ scope: 'maintenance-mode', publicRead: true, defaultValue: { enabled: false }, eventName: 'test-settings' })
  await client.readValue()
  const pending = client.writeValue({ enabled: false })
  const rejected = assert.rejects(pending, { name: 'AbortError' })
  setRequestActor('next-actor')
  complete(Response.json({ record: {} }))
  await rejected
  assert.deepEqual(client.readValueSync(), { enabled: true })
})
