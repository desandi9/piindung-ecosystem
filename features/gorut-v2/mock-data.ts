import type { GorutDashboardData } from './types';

export const gorutDashboardData: GorutDashboardData = {
  user: { name: 'Admin PC', role: 'PC LAZISNU Garut' },
  metrics: [
    { id: 'munfiq', label: 'Total Munfiq', value: 1529, trend: 2.4, comparisonText: 'dibanding minggu lalu', icon: 'Users' },
    { id: 'deposits', label: 'Setoran Berjalan', value: 14, trend: -4.1, comparisonText: 'dibanding minggu lalu', icon: 'WalletCards' },
    { id: 'validation', label: 'Tingkat Validasi', value: '94%', trend: 2.1, comparisonText: 'dibanding bulan lalu', icon: 'BadgeCheck' },
    { id: 'collection', label: 'Penghimpunan', value: 'Rp1,42 M', trend: 4.8, comparisonText: 'dibanding bulan lalu', icon: 'Landmark' },
  ],
  chartData: [
    ['Mar', 23], ['Apr', 16], ['Mei', 18], ['Jun', 13], ['Jul', 20], ['Agu', 7], ['Sep', 18], ['Okt', 14], ['Nov', 19], ['Des', 10], ['Jan', 7], ['Feb', 8],
  ].map(([label, value]) => ({ label: String(label), value: Number(value), fullDateLabel: `${label === 'Sep' ? 'September' : label} 2026`, formattedValue: `Rp${String(value).replace('.', ',')},2 jt` })),
  events: [
    { id: 'validation-meeting', title: 'Rapat Validasi Setoran', time: '09.00–10.00', location: 'Zoom Meeting', participantCount: 3, color: 'emerald' },
    { id: 'upzis-deposit', title: 'Konfirmasi Setoran UPZIS', time: '13.30–14.00', location: 'Kantor PC LAZISNU', participantCount: 2, color: 'orange' },
  ],
  depositStatus: [
    { id: 'draft', label: 'Draft', count: 8, variant: 'emerald-50' },
    { id: 'waiting', label: 'Menunggu', count: 14, variant: 'emerald-70' },
    { id: 'verified', label: 'Diverifikasi', count: 76, variant: 'emerald' },
    { id: 'returned', label: 'Dikembalikan', count: 4, variant: 'warning' },
  ],
  regions: [
    { id: 'garut-kota', name: 'Garut Kota', percentage: 22, amount: 312_000_000 },
    { id: 'tarogong-kidul', name: 'Tarogong Kidul', percentage: 18, amount: 255_000_000 },
    { id: 'karangpawitan', name: 'Karangpawitan', percentage: 15, amount: 213_000_000 },
    { id: 'cilawu', name: 'Cilawu', percentage: 12, amount: 170_000_000 },
  ],
  retention: [
    { id: 'sep', label: 'Sep', active: 60, new: 18, inactive: 22 },
    { id: 'okt', label: 'Okt', active: 64, new: 17, inactive: 19 },
    { id: 'nov', label: 'Nov', active: 67, new: 15, inactive: 18 },
    { id: 'des', label: 'Des', active: 69, new: 13, inactive: 18 },
    { id: 'jan', label: 'Jan', active: 71, new: 14, inactive: 15 },
    { id: 'feb', label: 'Feb', active: 73, new: 13, inactive: 14 },
  ],
  target: { current: 1_420_000_000, max: 2_000_000_000, percentage: 71, formattedCurrent: 'Rp1,42 M', formattedMax: 'Rp2 M' },
};
