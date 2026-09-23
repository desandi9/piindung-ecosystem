export type GorutPackageAction = 'SUBMIT' | 'APPROVE' | 'RETURN';

export type GorutPackageState =
  | 'DRAFT'
  | 'WAITING_UPZIS_VERIFICATION'
  | 'RETURNED_TO_RANTING'
  | 'WAITING_PC_APPROVAL'
  | 'RETURNED_TO_UPZIS'
  | 'FINAL_APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type GorutPackageCorrectionTargetType = 'RANTING' | 'TRANSACTION' | 'COLLECTION';

export const packageReturnReasonCodes = [
  'DATA_INCOMPLETE',
  'AMOUNT_MISMATCH',
  'UNRESOLVED_MAPPING',
  'COLLECTION_CORRECTION_REQUIRED',
  'FINANCIAL_RECONCILIATION_FAILED',
  'EVIDENCE_INCOMPLETE',
  'OTHER',
] as const;

export type GorutPackageReturnReasonCode = (typeof packageReturnReasonCodes)[number];

type PackageIdentity = {
  packageCode: string;
  origin: string;
  isHistorical: boolean;
  workflowHistoryComplete: boolean;
  version: number;
  revision: number;
};

type PackagePeriod = { key: string; start: string; label: string };
type PackageRegion = {
  kecamatan: { code: string; name: string };
  upzis: { operationalLevel: 'KECAMATAN'; kecamatanCode: string };
};

export type GorutPackageCoverageRow = {
  status: 'included' | 'excluded-with-reason' | 'unresolved';
  ranting: { code: string; name: string } | null;
  sourceRantingKey: string | null;
  sourceRantingName: string | null;
  exclusionReason: string | null;
  exclusionReference: string | null;
  recordedBy: string | null;
  recordedAt: string | null;
  activeAtCutoff: boolean | null;
  transactionCount: number;
  plpkCount: number;
  munfiqCount: number;
  recordedAmount: string | null;
};

type PackageCoverageSummary = {
  included: number;
  excluded: number;
  unresolved: number;
  completenessEvaluated: boolean;
};

type PackageFinancial = {
  status: 'UNVERIFIED' | 'BLOCKED' | 'READY';
  blockingReasons: string[];
  recordedAmount: string | null;
  recordedAmountSemantic: 'Jumlah Tercatat';
  grossAmount: string | null;
  totalPlpkFee: string | null;
  netAmount: string | null;
  calculatedAt: string | null;
  lockedAt: string | null;
  feePolicyVersion: string | null;
  feePolicyAuthority: string | null;
  authority: { sourceType: 'AUTHORITATIVE_COLLECTION'; completeForEveryTransaction: boolean };
};

type PackageWorkflowSummary = {
  currentState: GorutPackageState | null;
  version: number;
  availableActions: GorutPackageAction[];
  blockingReasons: string[];
};

export type GorutSettlementMode = 'PC_PICKUP' | 'UPZIS_BANK_DEPOSIT';
export type GorutSettlementAction = 'RECORD_PC_PICKUP' | 'RECORD_BANK_DEPOSIT';
export type GorutValidationAction = 'VALIDATE_SETTLEMENT';
export type GorutValidationResult = 'MATCHED' | 'MISMATCH';
export type GorutValidationStatus = 'NOT_VALIDATED' | 'CURRENT' | 'STALE';

export type GorutPackageActor = { memberId: string | null; name: string; role?: string | null };

export type GorutSettlementValidationItem = {
  status: 'CURRENT' | 'STALE';
  validationCode: string;
  settlementEvidenceCode: string;
  settlementRevision: number;
  result: GorutValidationResult;
  expectedAmount: string;
  actualAmount: string;
  difference: string;
  currency: 'IDR';
  validator: GorutPackageActor;
  validatedAt: string;
  note: string | null;
  packageVersion: { before: number; after: number };
  assertion: string;
  doesNotAssert: readonly string[];
};

export type GorutSettlementEvidence = {
  evidenceCode: string;
  mode: GorutSettlementMode;
  revision: number;
  supersedesEvidenceCode: string | null;
  supersededByEvidenceCode: string | null;
  expectedAmount: string;
  actualAmount: string;
  difference: string;
  currency: 'IDR';
  comparison: { status: 'NOMINAL_SESUAI' | 'ADA_SELISIH'; label: string };
  occurredAt: string;
  recordedAt: string;
  actors: {
    recordedBy: GorutPackageActor;
    handedOverBy: Omit<GorutPackageActor, 'role'> | null;
    receivedBy: Omit<GorutPackageActor, 'role'> | null;
    receivedAt: string | null;
    depositedBy: Omit<GorutPackageActor, 'role'> | null;
  };
  bank: string | null;
  externalReference: string | null;
  evidenceReference: string | null;
  note: string | null;
  packageVersion: { before: number; after: number };
  validation: GorutSettlementValidationItem | null;
};

type GorutPackageSettlement = {
  status: 'EVIDENCE_RECORDED' | 'NOT_RECORDED';
  completionStatus: 'NOT_DETERMINED_UNTIL_VALIDATION';
  latest: GorutSettlementEvidence | null;
  activeEvidenceCodes: string[];
  availableActions: GorutSettlementAction[];
  blockingReasons: string[];
  validation: {
    status: GorutValidationStatus;
    validationCode: string | null;
    settlementEvidenceCode: string | null;
    result: GorutValidationResult | null;
    expectedAmount: string | null;
    actualAmount: string | null;
    difference: string | null;
    validator: GorutPackageActor | null;
    validatedAt: string | null;
    note: string | null;
    historical: GorutSettlementValidationItem[];
    availableActions: GorutValidationAction[];
    blockingReasons: string[];
  };
  finalApprovalReadiness: { status: 'READY' | 'BLOCKED'; blockingReasons: string[] };
};

export type GorutFinalApproval = {
  readiness: { status: 'READY' | 'BLOCKED'; blockingReasons: string[] };
  approved: boolean;
  approvedAt: string | null;
  approvedBy: GorutPackageActor | null;
  sourceValidationCode: string | null;
  settlementEvidenceCode: string | null;
  packageVersion: { before: number; after: number } | null;
  packageRevision: number | null;
  assertions: {
    bankSettled: false;
    fundsCleared: false;
    bankDepositCompleted: false;
    proofCryptographicallyVerified: false;
    f016Issued: false;
    finalClose: false;
    administrativeArchiveComplete: false;
  };
};

export interface GorutPackageSummary {
  identity: PackageIdentity;
  period: PackagePeriod;
  region: PackageRegion;
  coverage: PackageCoverageSummary;
  transactions: { count: number; plpkCount: number; munfiqCount: number };
  collectionSource: {
    transactionCount: number;
    sourceCount: number;
    authoritativeAmountCount: number;
    authoritativeFeeCount: number;
    financiallyReadyCount: number;
    verifiedByKordesCount: number;
    completeForEveryTransaction: boolean;
  };
  financial: PackageFinancial;
  settlement: GorutPackageSettlement;
  workflow: PackageWorkflowSummary;
}

export type GorutPackageTransaction = {
  transactionCode: string;
  transactionDate: string;
  currentState: string;
  recordedAmount: string;
  recordedAmountSemantic: 'Jumlah Tercatat';
  ranting: { code: string; name: string };
  plpk: { code: string; name: string };
  munfiqCount: number;
  collectionSource: null | {
    collectionCode: string;
    origin: string;
    lifecycleStatus: string;
    amountAuthorityStatus: string;
    feeAuthorityStatus: string;
    financialStatus: string;
    financialBlockingReasons: string[];
    grossAmount: string | null;
    totalPlpkFee: string | null;
    netAmount: string | null;
    revision: number;
    sourceHash: string;
    transactionSourceHash: string | null;
    calculationPolicyVersion: string | null;
    financialSourceHash: string | null;
    reconciliationStatus: 'READY' | 'STALE';
    verification: {
      confirmedByPlpkAt: string | null;
      submittedToKordesAt: string | null;
      verifiedByKordesAt: string | null;
      returnedForCorrectionAt: string | null;
    };
  };
  provenance: {
    sourceType: string;
    sourceKey: string;
    sourceVersion: string | null;
    sourceHash: string;
    includedAt: string;
  };
};

export type GorutPackageCorrection = {
  correctionCode: string;
  targetType: string;
  target: { code: string; name?: string };
  reasonCode: string;
  reason: string | null;
  status: string;
  requestedAt: string;
  requestedBy: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNote: string | null;
};

export interface GorutPackageDetail extends Omit<GorutPackageSummary, 'coverage' | 'transactions' | 'financial' | 'workflow'> {
  identity: PackageIdentity;
  coverage: PackageCoverageSummary & {
    roster: { frozenAt: string | null; frozenBy: string | null; sourceHash: string | null };
    rantings: GorutPackageCoverageRow[];
    consistency: { resolvedRantingsWithinRegion: boolean; everyTransactionHasIncludedRanting: boolean };
  };
  transactions: {
    count: number;
    munfiqCount: number;
    plpkCount: number;
    plpkSummaries: Array<{
      plpkCode: string;
      plpkName: string;
      rantingCode: string;
      rantingName: string;
      transactionCount: number;
      munfiqCount: number;
      recordedAmount: string;
    }>;
    items: GorutPackageTransaction[];
  };
  financial: PackageFinancial & {
    calculationPolicyVersion: string | null;
    sourceRevision: number | null;
    sourceHash: string | null;
    consistency: {
      formulaMatches: boolean | null;
      transactionsWithinRegion: boolean;
      sourceRevisionMatches: boolean;
    };
  };
  workflow: PackageWorkflowSummary & {
    history: Array<{
      sequence: number;
      fromState: string | null;
      toState: string;
      action: string;
      stage: string | null;
      actor: { name: string; role: string | null };
      occurredAt: string;
      reason: string | null;
      reasonCode: string | null;
      metadata: unknown;
    }>;
    finalApproved: GorutFinalApproval;
  };
  settlement: GorutPackageSettlement & { history: GorutSettlementEvidence[] };
  finalApproval: GorutFinalApproval;
  corrections: GorutPackageCorrection[];
  documents: Array<{ code: string; readiness: string; executable: boolean; reason: string }>;
}

export type GorutPackageListResponse = {
  items: GorutPackageSummary[];
  page: number;
  pageSize: number;
  total: number;
};

export type PackageListFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
  period?: string;
  state?: GorutPackageState;
  states?: GorutPackageState[];
};

export type PackageTransitionCommand =
  | { action: 'SUBMIT'; expectedVersion: number; resolvedCorrectionCodes?: string[]; resolutionNote?: string | null }
  | { action: 'APPROVE'; expectedVersion: number }
  | {
      action: 'RETURN';
      expectedVersion: number;
      reasonCode: GorutPackageReturnReasonCode;
      reason: string | null;
      correctionTargets: Array<{ targetType: GorutPackageCorrectionTargetType; targetCode: string }>;
    };

export type PackageSettlementCommand = {
  mode: 'PC_PICKUP';
  actualAmount: string;
  occurredAt: string;
  handedOverByMemberId: string;
  externalReference?: string | null;
  evidenceReference?: string | null;
  note?: string | null;
  supersedesEvidenceCode?: string | null;
  expectedVersion: number;
};

export type PackageValidationCommand = {
  settlementEvidenceCode: string;
  note?: string | null;
  expectedVersion: number;
};

export type GorutSettlementParticipant = { memberId: string; name: string };

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type UuidFactory = () => string;
type ActiveIntent = { fingerprint: string; idempotencyKey: string };

export class PackageApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message);
    this.name = 'PackageApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get isNetworkFailure() {
    return this.status === 0;
  }
}

export class PackageIntentRegistry {
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
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  if (!globalThis.crypto?.getRandomValues) throw new Error('Secure UUID generation is unavailable.');
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
}

function packageUrl(packageCode: string, suffix = '') {
  return `/api/gorut/packages/${encodeURIComponent(packageCode)}${suffix}`;
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
  return new PackageApiError(
    typeof payload.error === 'string' ? payload.error : 'Data package tidak dapat diproses.',
    response.status,
    typeof payload.code === 'string' ? payload.code : `HTTP_${response.status}`,
    payload.details,
  );
}

export function packageErrorMessage(error: unknown) {
  if (!(error instanceof PackageApiError)) return 'Terjadi kesalahan. Silakan coba lagi.';
  if (error.status === 0) return 'Koneksi ke server terputus. Periksa jaringan lalu coba lagi.';
  if (error.status === 403) return 'Anda tidak memiliki akses ke package ini.';
  if (error.status === 404) return 'Data package tidak tersedia atau tidak ditemukan.';
  if (error.status === 409) return 'Package berubah di server. Data terbaru sudah dimuat; periksa kembali sebelum melanjutkan.';
  if (error.status === 422) return error.message || 'Tindakan diblokir oleh keputusan server.';
  if (error.status >= 500) return 'Server belum dapat memproses package. Silakan coba lagi.';
  return error.message || 'Data package tidak dapat diproses.';
}

export function packageErrorBlockingReasons(error: unknown) {
  if (!(error instanceof PackageApiError) || !error.details || typeof error.details !== 'object') return [];
  const reasons = (error.details as Record<string, unknown>).blockingReasons;
  return Array.isArray(reasons) ? reasons.filter((reason): reason is string => typeof reason === 'string') : [];
}

export async function executeWithCanonicalPackageRefetch<T>(
  mutation: () => Promise<T>,
  refetch: () => Promise<GorutPackageDetail>,
) {
  try {
    await mutation();
  } catch (error) {
    if (error instanceof PackageApiError && error.status === 409) await refetch();
    throw error;
  }
  return refetch();
}

export class GorutPackageApiClient {
  readonly intents: PackageIntentRegistry;
  private readonly fetcher: FetchLike;

  constructor(
    fetcher: FetchLike = globalThis.fetch.bind(globalThis),
    uuid?: UuidFactory,
  ) {
    this.fetcher = fetcher;
    this.intents = new PackageIntentRegistry(uuid);
  }

  async list(filters: PackageListFilters = {}): Promise<GorutPackageListResponse> {
    if (filters.states?.length) {
      const { states, ...shared } = filters;
      const responses = await Promise.all(states.map((state) => this.list({ ...shared, state })));
      const items = responses.flatMap((response) => response.items).sort((left, right) =>
        right.period.start.localeCompare(left.period.start) || left.identity.packageCode.localeCompare(right.identity.packageCode),
      );
      return {
        items,
        page: filters.page ?? 1,
        pageSize: filters.pageSize ?? items.length,
        total: responses.reduce((sum, response) => sum + response.total, 0),
      };
    }
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
    if (filters.search) params.set('search', filters.search);
    if (filters.period) params.set('period', filters.period);
    if (filters.state) params.set('state', filters.state);
    const query = params.toString();
    return this.request<GorutPackageListResponse>(`/api/gorut/packages${query ? `?${query}` : ''}`);
  }

  detail(packageCode: string) {
    return this.request<GorutPackageDetail>(packageUrl(packageCode));
  }

  transition(packageCode: string, command: PackageTransitionCommand, intentId: string) {
    return this.mutate(packageUrl(packageCode, '/transition'), intentId, command);
  }

  settlement(packageCode: string, command: PackageSettlementCommand, intentId: string) {
    return this.mutate(packageUrl(packageCode, '/settlements'), intentId, command);
  }

  validation(packageCode: string, command: PackageValidationCommand, intentId: string) {
    return this.mutate(packageUrl(packageCode, '/validations'), intentId, command);
  }

  settlementParticipants(packageCode: string) {
    return this.request<{ packageCode: string; items: GorutSettlementParticipant[] }>(packageUrl(packageCode, '/settlement-participants'));
  }

  private async mutate<T>(url: string, intentId: string, command: object) {
    const idempotencyKey = this.intents.acquire(intentId, command);
    try {
      const result = await this.request<T>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...command, idempotencyKey }),
      });
      this.intents.complete(intentId);
      return result;
    } catch (error) {
      if (error instanceof PackageApiError && error.status > 0 && error.status < 500) this.intents.complete(intentId);
      throw error;
    }
  }

  private async request<T>(url: string, init?: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await this.fetcher(url, { cache: 'no-store', credentials: 'same-origin', ...init });
    } catch (error) {
      throw new PackageApiError(error instanceof Error ? error.message : 'Network request failed.', 0, 'NETWORK_ERROR');
    }
    const body = await responseBody(response);
    if (!response.ok) throw errorFromResponse(response, body);
    return body as T;
  }
}

export function resolvePackageFrontendMode(value = process.env.NEXT_PUBLIC_GORUT_PACKAGE_MODE) {
  return value === 'demo' ? 'demo' as const : 'server' as const;
}
