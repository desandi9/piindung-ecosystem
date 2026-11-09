'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { isAbortedRequest, runActorRequest, subscribeActorSession } from '@/services/api/actor-session';
import type { MunfiqCollection, MunfiqCollectionsResponse } from './munfiq-presentation';

type Owned<T> = { actorId: string; value: T };

export function useMunfiqCollections(owner: { userId: string; munfiqCode: string }) {
  const { user, isLoading: authLoading } = useAuth();
  // The server-rendered owner is authoritative; portal role alone neither grants nor denies this presentation.
  const actorId = user?.id ?? null;
  const authorized = !authLoading && actorId === owner.userId;
  const [data, setData] = useState<Owned<MunfiqCollectionsResponse> | null>(null);
  const [detail, setDetail] = useState<Owned<MunfiqCollection> | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');
  const listRequest = useRef<AbortController | null>(null);
  const detailRequest = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (!authorized || !actorId) return;
    listRequest.current?.abort();
    const request = new AbortController();
    listRequest.current = request;
    setLoading(true);
    setError('');
    setData(null);
    try {
      const value = await runActorRequest(async (signal) => {
        const response = await fetch('/api/gorut/munfiq/me/collections', { cache: 'no-store', signal });
        if (!response.ok) throw new Error(response.status === 403 ? 'Akses riwayat tidak tersedia. Silakan masuk kembali.' : 'Riwayat penjemputan belum dapat dimuat.');
        const result = await response.json() as MunfiqCollectionsResponse;
        if (result.owner.munfiqCode !== owner.munfiqCode) throw new Error('Identitas akun berubah. Muat ulang halaman.');
        return result;
      }, request.signal);
      if (!request.signal.aborted) setData({ actorId, value });
    } catch (cause) {
      if (!isAbortedRequest(cause)) setError(cause instanceof Error ? cause.message : 'Riwayat belum dapat dimuat.');
    } finally {
      if (!request.signal.aborted) setLoading(false);
    }
  }, [actorId, authorized, owner.munfiqCode]);

  const closeDetail = useCallback(() => {
    detailRequest.current?.abort();
    setDetail(null);
    setDetailError('');
    setDetailLoading(false);
  }, []);

  const openDetail = useCallback(async (code: string) => {
    if (!authorized || !actorId) return;
    detailRequest.current?.abort();
    const request = new AbortController();
    detailRequest.current = request;
    setDetail(null);
    setDetailError('');
    setDetailLoading(true);
    try {
      const value = await runActorRequest(async (signal) => {
        const response = await fetch(`/api/gorut/munfiq/me/collections/${encodeURIComponent(code)}`, { cache: 'no-store', signal });
        if (!response.ok) throw new Error(response.status === 404 ? 'Riwayat ini tidak tersedia untuk akun Anda.' : 'Rincian penjemputan belum dapat dimuat.');
        const result = await response.json() as { owner: MunfiqCollectionsResponse['owner']; collection: MunfiqCollection };
        if (result.owner.munfiqCode !== owner.munfiqCode || result.collection.collectionCode !== code) throw new Error('Riwayat tidak sesuai dengan akun Anda.');
        return result.collection;
      }, request.signal);
      if (!request.signal.aborted) setDetail({ actorId, value });
    } catch (cause) {
      if (!isAbortedRequest(cause)) setDetailError(cause instanceof Error ? cause.message : 'Rincian belum dapat dimuat.');
    } finally {
      if (!request.signal.aborted) setDetailLoading(false);
    }
  }, [actorId, authorized, owner.munfiqCode]);

  useEffect(() => {
    const unsubscribe = subscribeActorSession(() => {
      listRequest.current?.abort();
      detailRequest.current?.abort();
      setData(null);
      setDetail(null);
      setError('Sesi berubah. Muat ulang riwayat untuk melanjutkan.');
      setDetailError('Sesi berubah. Tutup rincian dan muat ulang riwayat.');
      setLoading(false);
      setDetailLoading(false);
    });
    void load();
    return () => { unsubscribe(); listRequest.current?.abort(); detailRequest.current?.abort(); };
  }, [load]);

  return {
    authorized, authLoading, loading, error, detailLoading, detailError,
    data: authorized && data?.actorId === actorId ? data.value : null,
    detail: authorized && detail?.actorId === actorId ? detail.value : null,
    load, openDetail, closeDetail,
  };
}
