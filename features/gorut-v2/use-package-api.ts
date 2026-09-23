'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  GorutPackageApiClient,
  PackageApiError,
  executeWithCanonicalPackageRefetch,
  packageErrorBlockingReasons,
  packageErrorMessage,
  type GorutPackageDetail,
  type GorutPackageSummary,
  type PackageListFilters,
  type PackageSettlementCommand,
  type PackageTransitionCommand,
  type PackageValidationCommand,
  type GorutSettlementParticipant,
} from './package-api-client';
import { packageBlockingReasonLabel } from './package-api-view-model';

const sharedClient = new GorutPackageApiClient();

function presentationError(error: unknown) {
  const reasons = packageErrorBlockingReasons(error);
  return reasons.length ? reasons.map(packageBlockingReasonLabel).join(' ') : packageErrorMessage(error);
}

export function usePackageApi(filters: PackageListFilters = {}) {
  const [packages, setPackages] = useState<GorutPackageSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState<GorutPackageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [settlementParticipants, setSettlementParticipants] = useState<GorutSettlementParticipant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [pendingIntents, setPendingIntents] = useState<Set<string>>(() => new Set());
  const inFlight = useRef(new Map<string, Promise<unknown>>());
  const filterKey = JSON.stringify(filters);
  const stableFilters = useMemo(() => JSON.parse(filterKey) as PackageListFilters, [filterKey]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await sharedClient.list(stableFilters);
      setPackages(response.items);
      setTotal(response.total);
      return response.items;
    } catch (caught) {
      setError(presentationError(caught));
      throw caught;
    } finally {
      setLoading(false);
    }
  }, [stableFilters]);

  useEffect(() => {
    void reload().catch(() => undefined);
  }, [reload]);

  const loadDetail = useCallback(async (packageCode: string) => {
    setDetailLoading(true);
    setError('');
    try {
      const canonical = await sharedClient.detail(packageCode);
      setDetail(canonical);
      return canonical;
    } catch (caught) {
      setError(presentationError(caught));
      throw caught;
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const runMutation = useCallback(<T,>(intentId: string, command: () => Promise<T>) => {
    const existing = inFlight.current.get(intentId);
    if (existing) return existing as Promise<T>;
    const task = (async () => {
      setPendingIntents((current) => new Set(current).add(intentId));
      setError('');
      setNotice('');
      try {
        return await command();
      } catch (caught) {
        if (caught instanceof PackageApiError && caught.status === 409) {
          setNotice('Package berubah di server. Data canonical terbaru sudah dimuat; tinjau ulang sebelum membuat intent baru.');
          await reload().catch(() => undefined);
        }
        setError(presentationError(caught));
        throw caught;
      } finally {
        inFlight.current.delete(intentId);
        setPendingIntents((current) => {
          const next = new Set(current);
          next.delete(intentId);
          return next;
        });
      }
    })();
    inFlight.current.set(intentId, task);
    return task;
  }, [reload]);

  const executeTransition = useCallback(async (packageCode: string, command: PackageTransitionCommand) => {
    const intentId = `package:${packageCode}:${command.action}`;
    const canonical = await runMutation(intentId, () => executeWithCanonicalPackageRefetch(
      () => sharedClient.transition(packageCode, command, intentId),
      () => loadDetail(packageCode),
    ));
    await reload();
    return canonical;
  }, [loadDetail, reload, runMutation]);

  const loadSettlementParticipants = useCallback(async (packageCode: string) => {
    setParticipantsLoading(true);
    try {
      const response = await sharedClient.settlementParticipants(packageCode);
      setSettlementParticipants(response.items);
      return response.items;
    } catch (caught) {
      setError(presentationError(caught));
      throw caught;
    } finally {
      setParticipantsLoading(false);
    }
  }, []);

  const executeSettlement = useCallback(async (packageCode: string, command: PackageSettlementCommand) => {
    const intentId = `package:${packageCode}:settlement:${command.mode}`;
    const canonical = await runMutation(intentId, () => executeWithCanonicalPackageRefetch(
      () => sharedClient.settlement(packageCode, command, intentId),
      () => loadDetail(packageCode),
    ));
    await reload();
    return canonical;
  }, [loadDetail, reload, runMutation]);

  const executeValidation = useCallback(async (packageCode: string, command: PackageValidationCommand) => {
    const intentId = `package:${packageCode}:validation:${command.settlementEvidenceCode}`;
    const canonical = await runMutation(intentId, () => executeWithCanonicalPackageRefetch(
      () => sharedClient.validation(packageCode, command, intentId),
      () => loadDetail(packageCode),
    ));
    await reload();
    return canonical;
  }, [loadDetail, reload, runMutation]);

  const clearDetail = useCallback(() => setDetail(null), []);

  return {
    packages,
    total,
    detail,
    loading,
    detailLoading,
    error,
    notice,
    settlementParticipants,
    participantsLoading,
    reload,
    loadDetail,
    clearDetail,
    executeTransition,
    executeSettlement,
    executeValidation,
    loadSettlementParticipants,
    isPending: (intentId: string) => pendingIntents.has(intentId),
    hasPendingMutation: pendingIntents.size > 0,
  };
}
