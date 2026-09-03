// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { gorutMobilePaths, type MobileActorType } from "./gorut/mobile-actor-access-pure.ts"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { safeRedirectPath } from "./safe-redirect.ts"

const gorutMobileActorByDestination = new Map<string, MobileActorType>(
  Object.entries(gorutMobilePaths).map(([actorType, destination]) => [destination, actorType as MobileActorType]),
)

const actorLabels: Record<MobileActorType, string> = {
  MUNFIQ: "Munfiq",
  PLPK: "PLPK",
  KORDES: "Kordes",
}

export type LoginPresentation =
  | { kind: "standard"; safeDestination: string }
  | { kind: "gorut-mobile"; safeDestination: string; actorType: MobileActorType; actorLabel: string }

export type PostLoginNavigation = {
  destination: string
  method: "push" | "replace"
  showDashboardTransition: boolean
}

export function isGorutMobileDestination(safeDestination: string) {
  return gorutMobileActorByDestination.has(safeDestination)
}

export function resolveLoginPresentation(rawNext: string | null | undefined): LoginPresentation {
  const safeDestination = safeRedirectPath(rawNext)
  const actorType = gorutMobileActorByDestination.get(safeDestination)

  return actorType
    ? { kind: "gorut-mobile", safeDestination, actorType, actorLabel: actorLabels[actorType] }
    : { kind: "standard", safeDestination }
}

export function resolvePostLoginNavigation(presentation: LoginPresentation): PostLoginNavigation {
  return presentation.kind === "gorut-mobile"
    ? { destination: presentation.safeDestination, method: "replace", showDashboardTransition: false }
    : { destination: presentation.safeDestination, method: "push", showDashboardTransition: true }
}

export function shouldPrefetchPostLoginDestination(presentation: LoginPresentation) {
  return presentation.kind !== "gorut-mobile"
}

export function resolveAuthenticatedLoginDestination(
  rawNext: string | null | undefined,
  defaultDestination: string,
) {
  const presentation = resolveLoginPresentation(rawNext)
  return presentation.kind === "gorut-mobile" ? presentation.safeDestination : defaultDestination
}
