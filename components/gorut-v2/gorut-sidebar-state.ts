export const GORUT_SIDEBAR_STORAGE_KEY = 'gorut-v2-sidebar-collapsed';
export const GORUT_SIDEBAR_TABLET_QUERY = '(min-width: 901px) and (max-width: 1100px)';

export function resolveSidebarCollapsed(storedPreference: string | null, tabletViewport: boolean) {
  if (storedPreference === 'true') return true;
  if (storedPreference === 'false') return false;
  return tabletViewport;
}
