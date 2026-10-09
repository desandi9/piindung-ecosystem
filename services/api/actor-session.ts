// Client request ownership. A completed response may only update the session that started it.
let generation = 0
let actor: string | null | undefined
const controllers = new Set<AbortController>()
const listeners = new Set<() => void>()

export function actorGeneration() { return generation }
export function subscribeActorSession(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function invalidateActorSession() {
  generation += 1
  for (const controller of controllers) controller.abort()
  controllers.clear()
  for (const listener of listeners) listener()
}

export function setRequestActor(nextActor: string | null) {
  if (actor === nextActor) return
  actor = nextActor
  invalidateActorSession()
}

export function isAbortedRequest(error: unknown) {
  return error instanceof Error && error.name === "AbortError"
}

export async function runActorRequest<T>(operation: (signal: AbortSignal) => Promise<T>, signal?: AbortSignal | null) {
  const owner = generation
  const controller = new AbortController()
  controllers.add(controller)
  const abort = () => controller.abort()
  signal?.addEventListener("abort", abort, { once: true })
  if (signal?.aborted) controller.abort()
  try {
    controller.signal.throwIfAborted()
    const value = await operation(controller.signal)
    // A fetch implementation or a response body can finish after cancellation.
    if (owner !== generation) throw new DOMException("Session changed", "AbortError")
    controller.signal.throwIfAborted()
    return value
  } catch (error) {
    if (controller.signal.aborted || owner !== generation) throw new DOMException("Session changed", "AbortError")
    throw error
  } finally {
    controllers.delete(controller)
    signal?.removeEventListener("abort", abort)
  }
}
