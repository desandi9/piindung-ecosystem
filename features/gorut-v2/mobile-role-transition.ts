// @ts-expect-error Native Node tests require the TypeScript extension.
import { invalidateActorSession } from "../../services/api/actor-session.ts"

/** Presentation changes must invalidate every request owned by the previous UI tree. */
export function beginMobileRoleSpaceTransition() {
  invalidateActorSession()
}
