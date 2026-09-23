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
