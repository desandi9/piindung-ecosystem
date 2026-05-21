export function matchesPathPrefix(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`)
}

export function matchesAnyPathPrefix(pathname: string, routes: string[]) {
  return routes.some((route) => matchesPathPrefix(pathname, route))
}
