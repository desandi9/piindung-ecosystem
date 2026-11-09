import assert from 'node:assert/strict'
import test from 'node:test'
import { actorGeneration, invalidateActorSession, runActorRequest, setRequestActor } from './actor-session'

void test('switching aborts every outstanding actor request, including a late successful body', async () => {
  setRequestActor('munfiq')
  let release!: () => void
  let signal!: AbortSignal
  const pending = runActorRequest(async (requestSignal) => {
    signal = requestSignal
    await new Promise<void>((resolve) => { release = resolve })
    return { owner: 'munfiq' }
  })
  const rejected = assert.rejects(pending, { name: 'AbortError' })
  setRequestActor('plpk')
  assert.equal(signal.aborted, true)
  release()
  await rejected
  assert.deepEqual(await runActorRequest(async () => ({ owner: 'plpk' })), { owner: 'plpk' })
})

void test('logout invalidates pending errors; unchanged identity does not cancel current requests', async () => {
  setRequestActor('munfiq')
  const owner = actorGeneration()
  setRequestActor('munfiq')
  assert.equal(actorGeneration(), owner)
  let reject!: (error: Error) => void
  const pending = runActorRequest(() => new Promise((_, no) => { reject = no }))
  const rejected = assert.rejects(pending, { name: 'AbortError' })
  invalidateActorSession()
  reject(new Error('old actor network failure'))
  await rejected
})

void test('component unmount cancels its request without changing another request owner', async () => {
  const controller = new AbortController()
  let release!: () => void
  const pending = runActorRequest(() => new Promise<void>(resolve => { release = resolve }), controller.signal)
  const rejected = assert.rejects(pending, { name: 'AbortError' })
  controller.abort()
  release()
  await rejected
  assert.equal(await runActorRequest(async () => 'current actor'), 'current actor')
})

void test('actor switch A to B rejects stale Munfiq data before it can replace B data', async () => {
  setRequestActor('user-a:admin_kordes')
  let releaseA!: () => void
  const requestA = runActorRequest(async () => {
    await new Promise<void>((resolve) => { releaseA = resolve })
    return { owner: { munfiqCode: 'MUN-A' }, collections: ['A-only'] }
  })
  const staleA = assert.rejects(requestA, { name: 'AbortError' })

  setRequestActor('user-b:admin_upzis')
  releaseA()
  await staleA

  const dataB = await runActorRequest(async () => ({
    owner: { munfiqCode: 'MUN-B' },
    collections: ['B-only'],
  }))
  assert.deepEqual(dataB, { owner: { munfiqCode: 'MUN-B' }, collections: ['B-only'] })
  assert.equal(JSON.stringify(dataB).includes('MUN-A'), false)
  assert.equal(JSON.stringify(dataB).includes('A-only'), false)
})
