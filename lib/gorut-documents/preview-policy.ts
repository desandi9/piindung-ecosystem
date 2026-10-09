export function previewFailureMode(
  response: { fallbackAllowed?: boolean },
  hasFallback: boolean,
): 'fallback' | 'error' {
  return response.fallbackAllowed === true && hasFallback ? 'fallback' : 'error';
}

export function canonicalPreviewMode(
  enabled: string | undefined,
  hasFallback: boolean,
): 'canonical' | 'fallback' | 'unavailable' {
  if (enabled === 'true') return 'canonical';
  return hasFallback ? 'fallback' : 'unavailable';
}
