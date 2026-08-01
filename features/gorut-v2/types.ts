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
};

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
