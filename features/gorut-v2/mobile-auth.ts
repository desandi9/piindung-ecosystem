'use client';

import { useCallback, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { invalidateActorSession, setRequestActor } from '@/services/api/actor-session';

// @ts-expect-error Node's native strip-types test runner requires the explicit TypeScript extension.
import { gorutMobileLoginPath, type MobileActorType } from '../../lib/gorut/mobile-actor-access-pure.ts';

type LogoutFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export async function terminateMobileSession(fetcher: LogoutFetch = fetch) {
  invalidateActorSession();
  const response = await fetcher('/api/auth/logout', { method: 'POST', credentials: 'include' });
  if (!response.ok) throw new Error('LOGOUT_FAILED');
  setRequestActor(null);
}

export function redirectAfterMobileLogout(actorType: MobileActorType, location: Pick<Location, 'assign'> = window.location) {
  location.assign(gorutMobileLoginPath(actorType));
}

export function useMobileLogout(actorType: MobileActorType, onError: (message: string) => void) {
  const { logout: logoutSession } = useAuth();
  const [logoutPending, setLogoutPending] = useState(false);
  const logout = useCallback(async () => {
    setLogoutPending(true);
    try {
      if (!await logoutSession()) throw new Error('LOGOUT_FAILED');
      redirectAfterMobileLogout(actorType);
    } catch {
      setLogoutPending(false);
      onError('Gagal keluar. Sesi masih aktif; silakan coba lagi.');
    }
  }, [actorType, logoutSession, onError]);
  return { logout: () => void logout(), logoutPending };
}
