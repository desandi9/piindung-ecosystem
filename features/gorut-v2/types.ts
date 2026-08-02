export type GorutUser = {
  name: string;
  role: string;
  avatarUrl?: string;
};

export type GorutNavigationItem = {
  label: string;
  href?: string;
  icon: string;
  isActive?: boolean;
  isAvailable?: boolean;
  /** Submenu. Induk yang punya children dipakai sebagai tombol expand, bukan tautan. */
  children?: GorutNavigationItem[];
  /** Induk tetap aktif selama pathname berada di bawah prefix ini. */
  matchPrefix?: string;
};

export type GorutMunfiqStatus = "active" | "inactive" | "unpaid" | "new";

export interface GorutMunfiq {
  id: string;
  memberId: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  kecamatan: string;
  village: string;
  upzis: string;
  plpkId: string;
  plpkName: string;
  status: GorutMunfiqStatus;
  joinedAt: string;
  lastDepositAt?: string;
  lastDepositAmount?: number;
  totalCollected: number;
  transactionCount: number;
  notes?: string;
}

export type CollectionStatus =
  | 'draft'
  | 'scheduled'
  | 'collecting'
  | 'collection-completed'
  | 'waiting-kordes-verification'
  | 'verified-by-kordes'
  | 'needs-correction';

/**
 * Hasil kunjungan PLPK ke satu Munfiq. Hanya "collected" yang punya nominal.
 * "pending" = belum dikunjungi; bukan pilihan di form, dipakai sebagai keadaan awal.
 */
export type CollectionVisitStatus = 'pending' | 'collected' | 'not-around' | 'not-ready' | 'declined' | 'damaged-lost';

/** Hasil kunjungan yang boleh dipilih PLPK di aplikasi mobile. */
export type CollectionVisitOutcome = Exclude<CollectionVisitStatus, 'pending'>;

export interface CollectionEntry {
  id: string;
  munfiqId: string;
  munfiqName: string;
  memberId: string;
  /** Kode kaleng yang dipegang Munfiq — identitas utama di lapangan. */
  canCode: string;
  phone: string;
  address?: string;
  rt?: string;
  rw?: string;
  isActive?: boolean;
  canCount?: number;
  amount: number;
  visitStatus: CollectionVisitStatus;
  collectedAt: string;
  eligibleForPlpkFee: boolean;
  plpkFee: number;
  notes?: string;
}

export interface CollectionBatch {
  id: string;
  period: string;
  plpkId: string;
  plpkName: string;
  village: string;
  kecamatan: string;
  kordesName: string;
  entries: CollectionEntry[];
  activeCanCount: number;
  /** Munfiq yang sudah punya hasil kunjungan (status apa pun selain pending). */
  visitedCount: number;
  /** Munfiq yang belum dikunjungi sama sekali. */
  pendingCount: number;
  collectedCanCount: number;
  uncollectedCanCount: number;
  grossAmount: number;
  totalCollected: number;
  eligibleMunfiqCount: number;
  totalPlpkFee: number;
  netAmount: number;
  formCode: 'F.009';
  documentNumber: string;
  documentStatus: 'Draft' | 'Siap';
  status: CollectionStatus;
  confirmedByPlpkAt?: string;
  lockedAt?: string;
  f009DocumentNumber?: string;
  submittedToKordesAt?: string;
  verifiedByKordesAt?: string;
  verifiedByKordesName?: string;
  /** Catatan Kordes saat batch dikembalikan untuk dikoreksi. */
  kordesNotes?: string;
  /** Entri yang ditandai Kordes; hanya ini yang boleh diubah PLPK saat Perlu Koreksi. */
  correctionEntryIds?: string[];
  createdAt: string;
}

/** Identitas PLPK yang sedang memakai aplikasi mobile. Mock, bukan dari auth. */
export interface PlpkProfile {
  plpkId: string;
  name: string;
  phone: string;
  village: string;
  kecamatan: string;
  kordesName: string;
  upzis: string;
  joinedAt: string;
}

/** Status rekap satu desa dalam satu periode di tingkat UPZIS. */
export type UpzisRecapStatus =
  | 'incomplete'
  | 'ready-to-recap'
  | 'recapped'
  | 'waiting-minutes'
  | 'ready-to-deposit';

/** Rincian satu PLPK di dalam rekap desa. */
export interface UpzisPlpkBreakdown {
  plpkId: string;
  plpkName: string;
  munfiqCount: number;
  totalCollected: number;
  eligibleMunfiqCount: number;
  totalPlpkFee: number;
}

/** Satu baris = satu desa dalam satu periode. */
export interface UpzisVillageRecap {
  id: string;
  period: string;
  village: string;
  kecamatan: string;
  kordesName: string;
  plpkBreakdown: UpzisPlpkBreakdown[];
  plpkCount: number;
  munfiqCount: number;
  totalCollected: number;
  totalPlpkFee: number;
  status: UpzisRecapStatus;
  minutesNumber?: string;
  recappedAt?: string;
}

export type KordesVerificationStatus =
  | 'waiting-kordes-verification'
  | 'verified-by-kordes'
  | 'needs-correction';

export type F015Status =
  | 'not-ready'
  | 'waiting-plpk-completion'
  | 'ready-to-create'
  | 'f015-ready'
  | 'waiting-upzis-handover'
  | 'handed-to-upzis';

export interface KordesVerification {
  id: string;
  batchId: string;
  f009DocumentNumber: string;
  plpkId: string;
  plpkName: string;
  period: string;
  kecamatan: string;
  village: string;
  kordesName: string;
  grossAmount: number;
  totalPlpkFee: number;
  netAmount: number;
  status: KordesVerificationStatus;
  f015Status: F015Status;
  moneyMatches?: boolean;
  hasDamagedMoney?: boolean;
  cashReceived?: boolean;
  notes?: string;
  verifiedAt?: string;
  verifiedByKordesName?: string;
}

export interface KordesVillageRecap {
  id: string;
  period: string;
  kecamatan: string;
  village: string;
  kordesName: string;
  upzisOfficerName: string;
  f015Number: string;
  handoverDate: string;
  plpkRows: KordesVerification[];
  f015Status: F015Status;
  handedToUpzisAt?: string;
}

export type GorutMetric = {
  id: string;
  label: string;
  value: string | number;
  trend: number;
  comparisonText: string;
  icon: string;
};

export type GorutChartPoint = {
  label: string;
  value: number;
  fullDateLabel?: string;
  formattedValue?: string;
};

export type GorutCalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isActive?: boolean;
  hasEvents?: boolean;
};

export type GorutCalendarEvent = {
  id: string;
  title: string;
  time: string;
  location: string;
  participantCount: number;
  color: 'emerald' | 'blue' | 'orange';
};

export type GorutDepositStatus = {
  id: string;
  label: string;
  count: number;
  variant: 'emerald' | 'emerald-70' | 'emerald-50' | 'slate' | 'warning';
};

export type GorutRegionSummary = {
  id: string;
  name: string;
  percentage: number;
  amount: number;
};

export type GorutRetentionPoint = {
  id: string;
  label: string;
  active: number;
  new: number;
  inactive: number;
};

export type GorutDashboardData = {
  user: GorutUser;
  metrics: GorutMetric[];
  chartData: GorutChartPoint[];
  events: GorutCalendarEvent[];
  depositStatus: GorutDepositStatus[];
  regions: GorutRegionSummary[];
  retention: GorutRetentionPoint[];
  target: {
    current: number;
    max: number;
    percentage: number;
    formattedCurrent: string;
    formattedMax: string;
  };
};
