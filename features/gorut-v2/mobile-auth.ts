'use client';

import { useCallback, useState } from 'react';

// @ts-expect-error Node's native strip-types test runner requires the explicit TypeScript extension.
import { gorutMobileLoginPath, type MobileActorType } from '../../lib/gorut/mobile-actor-access-pure.ts';

type LogoutFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export async function terminateMobileSession(fetcher: LogoutFetch = fetch) {
  const response = await fetcher('/api/auth/logout', { method: 'POST', credentials: 'include' });
  if (!response.ok) throw new Error('LOGOUT_FAILED');
}

export function redirectAfterMobileLogout(actorType: MobileActorType, location: Pick<Location, 'assign'> = window.location) {
  location.assign(gorutMobileLoginPath(actorType));
}

export function useMobileLogout(actorType: MobileActorType, onError: (message: string) => void) {
  const [logoutPending, setLogoutPending] = useState(false);
  const logout = useCallback(async () => {
    setLogoutPending(true);
    try {
      await terminateMobileSession();
      redirectAfterMobileLogout(actorType);
    } catch {
      setLogoutPending(false);
      onError('Gagal keluar. Sesi masih aktif; silakan coba lagi.');
    }
  }, [actorType, onError]);
  return { logout: () => void logout(), logoutPending };
}
