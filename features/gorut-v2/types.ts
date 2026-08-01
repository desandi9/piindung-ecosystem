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
  | 'scheduled'
  | 'collecting'
  | 'collected'
  | 'waiting-handover'
  | 'handed-to-kordes'
  | 'handed-to-upzis';

/** Hasil kunjungan PLPK ke satu Munfiq. Hanya "collected" yang punya nominal. */
export type CollectionVisitStatus = 'collected' | 'not-around' | 'not-ready' | 'declined';

export interface CollectionEntry {
  id: string;
  munfiqId: string;
  munfiqName: string;
  memberId: string;
  phone: string;
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
  entries: CollectionEntry[];
  totalCollected: number;
  eligibleMunfiqCount: number;
  totalPlpkFee: number;
  status: CollectionStatus;
  handoverDestination?: 'kordes' | 'upzis';
  createdAt: string;
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
