'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { actorGeneration, isAbortedRequest, subscribeActorSession } from '@/services/api/actor-session';
import { useAuth } from '@/lib/auth-context';

import {
  CollectionApiError,
  GorutCollectionApiClient,
  collectionErrorMessage,
  executeWithCanonicalRefetch,
  type CollectionActionCommand,
  type CollectionListFilters,
  type GorutCollection,
  type RecordCollectionEntryCommand,
} from './collection-api-client';

export function useCollectionApi(filters: CollectionListFilters = {}) {
  const { user, isLoading: authLoading } = useAuth();
  const client = useRef(new GorutCollectionApiClient());
  const [collections, setCollections] = useState<GorutCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pendingIntents, setPendingIntents] = useState<Set<string>>(() => new Set());
  const inFlight = useRef(new Map<string, Promise<unknown>>());
  const filterKey = JSON.stringify(filters);
  const stableFilters = useMemo(() => JSON.parse(filterKey) as CollectionListFilters, [filterKey]);

  const reload = useCallback(async () => {
    const owner = actorGeneration();
    setLoading(true);
    setError('');
    try {
      const response = await client.current.list(stableFilters);
      setCollections(response.data);
      return response.data;
    } catch (caught) {
      if (owner === actorGeneration() && !isAbortedRequest(caught)) setError(collectionErrorMessage(caught));
      throw caught;
    } finally {
      if (owner === actorGeneration()) setLoading(false);
    }
  }, [stableFilters]);

  useEffect(() => {
    const unsubscribe = subscribeActorSession(() => {
      client.current = new GorutCollectionApiClient();
      inFlight.current.clear();
      setCollections([]);
      setPendingIntents(new Set());
      setError('');
      setNotice('');
      setLoading(false);
    });
    if (!authLoading && user) void reload().catch(() => undefined);
    return unsubscribe;
  }, [reload, authLoading, user]);

  const refreshCollection = useCallback(async (collectionCode: string) => {
    const canonical = await client.current.detail(collectionCode);
    setCollections((current) => {
      const index = current.findIndex((item) => item.identity.collectionCode === collectionCode);
      if (index < 0) return [canonical, ...current];
      return current.map((item) => item.identity.collectionCode === collectionCode ? canonical : item);
    });
    return canonical;
  }, []);

  const runMutation = useCallback(<T,>(intentId: string, command: () => Promise<T>) => {
    const existing = inFlight.current.get(intentId);
    if (existing) return existing as Promise<T>;
    const task = (async () => {
      setPendingIntents((current) => new Set(current).add(intentId));
      setError('');
      setNotice('');
      const owner = actorGeneration();
      try {
        return await command();
      } catch (caught) {
        if (owner !== actorGeneration() || isAbortedRequest(caught)) throw caught;
        if (caught instanceof CollectionApiError && caught.status === 409) {
          setNotice('Data berubah di server. Data terbaru sudah dimuat; periksa kembali sebelum melanjutkan.');
        }
        setError(collectionErrorMessage(caught));
        throw caught;
      } finally {
        if (owner === actorGeneration()) {
          inFlight.current.delete(intentId);
          setPendingIntents((current) => {
            const next = new Set(current);
            next.delete(intentId);
            return next;
          });
        }
      }
    })();
    inFlight.current.set(intentId, task);
    return task;
  }, []);

  const createCollection = useCallback(async (period: string) => {
    const intentId = `create:${period}`;
    const result = await runMutation(intentId, () => client.current.create(period, intentId));
    const collectionCode = result.collection.collectionCode;
    await reload();
    return refreshCollection(collectionCode);
  }, [refreshCollection, reload, runMutation]);

  const recordEntry = useCallback(async (
    collectionCode: string,
    munfiqCode: string,
    command: RecordCollectionEntryCommand,
  ) => {
    const intentId = `entry:${collectionCode}:${munfiqCode}`;
    return runMutation(
      intentId,
      () => executeWithCanonicalRefetch(
        () => client.current.recordEntry(collectionCode, munfiqCode, command, intentId),
        () => refreshCollection(collectionCode),
      ),
    );
  }, [refreshCollection, runMutation]);

  const executeAction = useCallback(async (collectionCode: string, command: CollectionActionCommand) => {
    const intentId = `action:${collectionCode}:${command.action}`;
    return runMutation(intentId, () => executeWithCanonicalRefetch(
      () => client.current.action(collectionCode, command, intentId),
      () => refreshCollection(collectionCode),
    ));
  }, [refreshCollection, runMutation]);

  return {
    collections,
    loading,
    error,
    notice,
    reload,
    refreshCollection,
    createCollection,
    recordEntry,
    executeAction,
    isPending: (intentId: string) => pendingIntents.has(intentId),
    hasPendingMutation: pendingIntents.size > 0,
  };
}
