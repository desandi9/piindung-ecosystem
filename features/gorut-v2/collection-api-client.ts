export type GorutCollectionStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'COLLECTING'
  | 'COLLECTION_COMPLETED'
  | 'WAITING_KORDES_VERIFICATION'
  | 'VERIFIED_BY_KORDES'
  | 'NEEDS_CORRECTION';

export type GorutCollectionVisitStatus =
  | 'PENDING'
  | 'COLLECTED'
  | 'NOT_AROUND'
  | 'NOT_READY'
  | 'DECLINED'
  | 'DAMAGED_LOST';

export type GorutCollectionAction =
  | 'RECORD_ENTRY'
  | 'CONFIRM_AND_SUBMIT'
  | 'VERIFY_BY_KORDES'
  | 'RETURN_FOR_CORRECTION';

type PublicActor = { memberCode: string; name: string } | null;

export interface GorutCollectionEntry {
  munfiq: { code: string; name: string };
  visitStatus: GorutCollectionVisitStatus;
  amount: string;
  collectedAt: string | null;
  note: string | null;
  fee: {
    eligible: boolean | null;
    amount: string | null;
    policyVersion: string | null;
  };
  provenance: {
    sourceType: string;
    sourceKey: string;
    sourceHash: string;
  };
  availableActions: GorutCollectionAction[];
}

export interface GorutCollectionCorrection {
  target: { type: 'MUNFIQ'; code: string; name: string };
  reason: string;
  requestedAt: string;
  requestRevision: number;
  requestedBy: PublicActor;
  resolvedAt: string | null;
  resolutionRevision: number | null;
  resolvedBy: PublicActor;
}

export interface GorutCollection {
  identity: {
    collectionCode: string;
    origin: string;
    status: GorutCollectionStatus;
    version: number;
    revision: number;
    sourceHash: string;
    createdAt: string;
    updatedAt: string;
    createdBy: PublicActor;
  };
  period: { key: string; start: string; label: string };
  region: {
    kecamatan: { code: string; name: string };
    ranting: { code: string; name: string };
  };
  plpk: { code: string; name: string };
  entries: GorutCollectionEntry[];
  financial: {
    amountAuthorityStatus: string;
    feeAuthorityStatus: string;
    status: 'READY' | 'BLOCKED';
    blockingReasons: string[];
    grossAmount: string | null;
    totalPlpkFee: string | null;
    netAmount: string | null;
    calculatedAt: string | null;
    calculationPolicyVersion: string | null;
    policyAuthority: string | null;
    sourceHash: string | null;
  };
  confirmation: {
    confirmedByPlpkAt: string | null;
    confirmedBy: PublicActor;
    submittedToKordesAt: string | null;
    submittedBy: PublicActor;
  };
  kordesVerification: {
    verifiedByKordesAt: string | null;
    returnedForCorrectionAt: string | null;
    decisionBy: PublicActor;
    moneyMatches: boolean | null;
    hasDamagedMoney: boolean | null;
    cashReceived: boolean | null;
    note: string | null;
  };
  corrections: GorutCollectionCorrection[];
  bridgeReadiness: {
    ready: boolean;
    blockingReasons: string[];
    sourceHashClean: boolean;
    transaction: null | {
      transactionCode: string;
      state: string;
      status: 'READY' | 'PENDING' | 'BLOCKED' | 'STALE';
      sourceRevision: number | null;
      sourceHash: string | null;
      bridgedAt: string | null;
    };
    package: null | {
      packageCode: string;
      state: string;
      financialStatus: 'READY' | 'BLOCKED' | 'UNVERIFIED';
      reconciliationStatus: 'READY' | 'BLOCKED';
      blockingReasons: string[];
    };
  };
  version: number;
  availableActions: GorutCollectionAction[];
  blockingReasons: string[];
  history?: Array<{
    revision: number;
    action: string;
    reason: string | null;
    actor: PublicActor;
    timestamp: string;
  }>;
}

export interface GorutCollectionListResponse {
  data: GorutCollection[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export type CollectionListFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
  period?: string;
  status?: GorutCollectionStatus;
};

export type RecordCollectionEntryCommand = {
  visitStatus: GorutCollectionVisitStatus;
  amount: string;
  note?: string | null;
  reason?: string | null;
  expectedVersion: number;
};

export type CollectionActionCommand =
  | { action: 'CONFIRM_AND_SUBMIT'; expectedVersion: number }
  | {
      action: 'VERIFY_BY_KORDES';
      expectedVersion: number;
      moneyMatches: boolean;
      hasDamagedMoney: boolean;
      cashReceived: boolean;
      note: string | null;
    }
  | {
      action: 'RETURN_FOR_CORRECTION';
      expectedVersion: number;
      moneyMatches: boolean;
      hasDamagedMoney: boolean;
      cashReceived: boolean;
      reason: string;
      correctionMunfiqCodes: string[];
    };

export type CollectionMutationResult = {
  collection: { collectionCode: string };
  idempotentReplay?: boolean;
  created?: boolean;
  reconciliation?: {
    collectionCode: string;
    transactionCode: string | null;
    packageCode: string | null;
    bridgeStatus: 'CREATED' | 'EXISTING' | 'RECONCILED' | 'BLOCKED' | 'RETRYABLE';
    packageStatus: 'CREATED' | 'UPDATED' | 'EXISTING' | 'BLOCKED' | 'RETRYABLE' | 'NOT_RUN';
    financialStatus: 'READY' | 'BLOCKED' | 'NOT_RUN';
    blockingReasons: string[];
    idempotentReplay: boolean;
  };
};

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type UuidFactory = () => string;

export class CollectionApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    message: string,
    status: number,
    code: string,
    details?: unknown,
  ) {
    super(message);
    this.name = 'CollectionApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get isNetworkFailure() {
    return this.status === 0;
  }
}

type ActiveIntent = { fingerprint: string; idempotencyKey: string };

export class CollectionIntentRegistry {
  private readonly intents = new Map<string, ActiveIntent>();
  private readonly uuid: UuidFactory;

  constructor(uuid: UuidFactory = browserUuid) {
    this.uuid = uuid;
  }

  acquire(intentId: string, command: unknown) {
    const fingerprint = JSON.stringify(command);
    const existing = this.intents.get(intentId);
    if (existing?.fingerprint === fingerprint) return existing.idempotencyKey;
    const idempotencyKey = this.uuid();
    this.intents.set(intentId, { fingerprint, idempotencyKey });
    return idempotencyKey;
  }

  complete(intentId: string) {
    this.intents.delete(intentId);
  }

  peek(intentId: string) {
    return this.intents.get(intentId)?.idempotencyKey ?? null;
  }
}

function browserUuid() {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === 'function') return cryptoApi.randomUUID();
  if (!cryptoApi?.getRandomValues) throw new Error('Secure UUID generation is unavailable.');
  const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
}

function collectionUrl(collectionCode: string, suffix = '') {
  return `/api/gorut/collections/${encodeURIComponent(collectionCode)}${suffix}`;
}

async function responseBody(response: Response) {
  try {
    return await response.json() as unknown;
  } catch {
    return null;
  }
}

function errorFromResponse(response: Response, body: unknown) {
  const payload = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  return new CollectionApiError(
    typeof payload.error === 'string' ? payload.error : 'Data collection tidak dapat diproses.',
    response.status,
    typeof payload.code === 'string' ? payload.code : `HTTP_${response.status}`,
    payload.details,
  );
}

export function collectionErrorMessage(error: unknown) {
  if (!(error instanceof CollectionApiError)) return 'Terjadi kesalahan. Silakan coba lagi.';
  if (error.status === 0) return 'Koneksi ke server terputus. Periksa jaringan lalu coba lagi.';
  if (error.status === 403) return 'Anda tidak memiliki akses untuk tindakan ini.';
  if (error.status === 404) return 'Data collection tidak tersedia atau tidak ditemukan.';
  if (error.status === 409) return 'Data berubah di server. Data terbaru sudah dimuat; periksa kembali sebelum melanjutkan.';
  if (error.status === 422) return error.message || 'Tindakan diblokir oleh aturan server.';
  return error.message || 'Data collection tidak dapat diproses.';
}

export async function executeWithCanonicalRefetch<T>(
  mutation: () => Promise<T>,
  refetch: () => Promise<GorutCollection>,
) {
  try {
    await mutation();
  } catch (error) {
    if (error instanceof CollectionApiError && error.status === 409) await refetch();
    throw error;
  }
  return refetch();
}

export class GorutCollectionApiClient {
  readonly intents: CollectionIntentRegistry;
  private readonly fetcher: FetchLike;

  constructor(
    fetcher: FetchLike = globalThis.fetch.bind(globalThis),
    uuid?: UuidFactory,
  ) {
    this.fetcher = fetcher;
    this.intents = new CollectionIntentRegistry(uuid);
  }

  async list(filters: CollectionListFilters = {}) {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
    if (filters.search) params.set('search', filters.search);
    if (filters.period) params.set('period', filters.period);
    if (filters.status) params.set('status', filters.status);
    const query = params.toString();
    return this.request<GorutCollectionListResponse>(`/api/gorut/collections${query ? `?${query}` : ''}`);
  }

  detail(collectionCode: string) {
    return this.request<GorutCollection>(collectionUrl(collectionCode));
  }

  create(period: string, intentId: string) {
    return this.mutate<CollectionMutationResult>('/api/gorut/collections', 'POST', intentId, {
      period,
      expectedVersion: 0,
    });
  }

  recordEntry(collectionCode: string, munfiqCode: string, command: RecordCollectionEntryCommand, intentId: string) {
    return this.mutate<CollectionMutationResult>(
      collectionUrl(collectionCode, `/entries/${encodeURIComponent(munfiqCode)}`),
      'PUT',
      intentId,
      command,
    );
  }

  action(collectionCode: string, command: CollectionActionCommand, intentId: string) {
    return this.mutate<CollectionMutationResult>(collectionUrl(collectionCode, '/actions'), 'POST', intentId, command);
  }

  private async mutate<T>(url: string, method: 'POST' | 'PUT', intentId: string, command: object) {
    const idempotencyKey = this.intents.acquire(intentId, command);
    try {
      const result = await this.request<T>(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...command, idempotencyKey }),
      });
      this.intents.complete(intentId);
      return result;
    } catch (error) {
      if (error instanceof CollectionApiError && error.status > 0 && error.status < 500) {
        this.intents.complete(intentId);
      }
      throw error;
    }
  }

  private async request<T>(url: string, init?: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await this.fetcher(url, { cache: 'no-store', credentials: 'same-origin', ...init });
    } catch (error) {
      throw new CollectionApiError(
        error instanceof Error ? error.message : 'Network request failed.',
        0,
        'NETWORK_ERROR',
      );
    }
    const body = await responseBody(response);
    if (!response.ok) throw errorFromResponse(response, body);
    return body as T;
  }
}

export function canonicalRupiahInput(raw: string) {
  const value = raw.trim();
  if (!value || /[,eE+\-]/.test(value) || !/^(?:Rp\s*)?[0-9.\s]+$/i.test(value)) return null;
  const digits = value.replace(/^Rp\s*/i, '').replace(/[.\s]/g, '');
  if (!digits || digits.length > 17) return null;
  const normalized = digits.replace(/^0+(?=\d)/, '');
  return `${normalized || '0'}.00`;
}

export function resolveCollectionFrontendMode(value = process.env.NEXT_PUBLIC_GORUT_COLLECTION_MODE) {
  return value === 'demo' ? 'demo' as const : 'server' as const;
}
