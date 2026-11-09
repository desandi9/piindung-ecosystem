import type { MunfiqHomeProgram, MunfiqHomeStory } from '@/components/gorut-v2/home/munfiq-home';
import type { MunfiqCollectionsResponse } from './munfiq-presentation';

type PresentationNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  publishedAt: string | null;
  readAt: string | null;
  read: boolean;
};

type MunfiqHomePresentationData = {
  marker: 'PRESENTATION_DATA/DEMO_FIXTURE';
  name: 'Siti Aminah';
  collections: MunfiqCollectionsResponse;
  programs: MunfiqHomeProgram[];
  story: MunfiqHomeStory;
  notifications: { notifications: PresentationNotification[]; unreadCount: number };
};

export const MUNFIQ_PRESENTATION_DATA_MARKER = 'PRESENTATION_DATA/DEMO_FIXTURE' as const;
const LOCAL_PRESENTATION_MUNFIQ_CODE = 'UAT-M001';

const recorded = (month: string, day: string, amount: string, status: string, extraTimeline: Array<{ key: string; label: string; at: string }> = []) => ({
  collectionCode: `DEMO_FIXTURE-${month}`,
  periodStart: `2026-${month}-01T00:00:00.000Z`,
  amount,
  currency: 'IDR' as const,
  status,
  statusAt: `2026-${month}-${day}T08:00:00.000Z`,
  historicalPlpk: { code: 'DEMO-PLPK-001', name: 'Dede Rahmat' },
  location: { ranting: 'Desa Sukamentri', kecamatan: 'Garut Kota' },
  timeline: [
    { key: 'recorded', label: 'Dicatat PLPK', at: `2026-${month}-${day}T08:00:00.000Z` },
    ...extraTimeline,
  ],
});

/**
 * DEMO_FIXTURE / PRESENTATION_DATA
 * Client-only sample content for the local Munfiq presentation account.
 * Never persist these records and never return them from an API.
 */
const PRESENTATION_DATA: MunfiqHomePresentationData = {
  marker: MUNFIQ_PRESENTATION_DATA_MARKER,
  name: 'Siti Aminah',
  collections: {
    owner: { munfiqCode: LOCAL_PRESENTATION_MUNFIQ_CODE, name: 'Siti Aminah' },
    summary: { collectionCount: 7, totalAmount: '185500.00', currency: 'IDR' },
    collections: [
      {
        collectionCode: 'DEMO_FIXTURE-NEXT-PICKUP',
        periodStart: '2026-09-01T00:00:00.000Z',
        amount: '0.00',
        currency: 'IDR',
        status: 'Menunggu Penjemputan',
        statusAt: '2026-09-18T08:00:00.000Z',
        historicalPlpk: { code: 'DEMO-PLPK-001', name: 'Dede Rahmat' },
        location: { ranting: 'Desa Sukamentri', kecamatan: 'Garut Kota' },
        timeline: [{ key: 'pending', label: 'Menunggu Penjemputan', at: '2026-09-18T08:00:00.000Z' }],
      },
      recorded('08', '22', '50000.00', 'Sudah Dijemput'),
      recorded('07', '21', '45000.00', 'Sudah Dijemput'),
      recorded('06', '22', '30000.00', 'Sudah Dijemput'),
      recorded('05', '21', '25500.00', 'Sudah Dijemput'),
      recorded('04', '22', '15000.00', 'Sudah Dijemput'),
      recorded('03', '21', '10000.00', 'Sudah Dijemput'),
      recorded('02', '22', '10000.00', 'Sudah Dijemput'),
    ],
  },
  programs: [
    {
      id: 'DEMO_FIXTURE-PROGRAM-PENDIDIKAN',
      title: 'Pendidikan Generasi Garut',
      excerpt: 'Beasiswa & perlengkapan sekolah untuk santri dan siswa.',
      contentType: 'artikel',
      coverImage: '/images/gorut/highlands.webp',
      featured: true,
      publishedAt: '2026-09-18T08:00:00.000Z',
      category: 'Pendidikan',
      targetLabel: 'Target: Rp50.000.000',
    },
    {
      id: 'DEMO_FIXTURE-PROGRAM-PEMBERDAYAAN',
      title: 'Pemberdayaan UMKM Lokal',
      excerpt: 'Modal usaha bergulir untuk pelaku usaha kecil di Garut.',
      contentType: 'berita',
      coverImage: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgcng9IjgiIGZpbGw9IiNlOGVhZWQiLz48cGF0aCBkPSJNMTcwIDEzMCBsMzAgNDAgbDIwLTE1IGw0MCA1NSBIMTQweiIgZmlsbD0iI2JkYzFjNiIvPjxjaXJjbGUgY3g9IjI1MCIgY3k9IjEyMCIgcj0iMTgiIGZpbGw9IiNiZGMxYzYiLz48L3N2Zz4=',
      featured: false,
      publishedAt: '2026-09-12T08:00:00.000Z',
      category: 'Pemberdayaan',
      targetLabel: 'Target: Rp40.000.000',
    },
  ],
  story: {
    id: 'DEMO_FIXTURE-STORY-DAMPAK',
    title: 'Dampak kebaikan Anda',
    excerpt: 'Kontribusi Anda ikut mendukung kegiatan pendidikan santri, layanan kesehatan dhuafa, dan pemberdayaan masyarakat di Garut.',
    featured: true,
  },
  notifications: {
    unreadCount: 1,
    notifications: [
      {
        id: 'DEMO_FIXTURE-NOTIFICATION-RECORDED',
        title: 'Pencatatan infak Anda berhasil diperbarui',
        body: 'Catatan kontribusi terbaru sudah tersedia.',
        createdAt: '2026-09-12T07:00:00.000Z',
        publishedAt: '2026-09-12T07:00:00.000Z',
        readAt: null,
        read: false,
      },
      {
        id: 'DEMO_FIXTURE-NOTIFICATION-PICKUP',
        title: 'Program Pendidikan Generasi Garut memiliki perkembangan baru',
        body: 'Lihat kabar terbaru program melalui menu Program.',
        createdAt: '2026-09-10T02:15:00.000Z',
        publishedAt: '2026-09-10T02:15:00.000Z',
        readAt: '2026-09-10T03:00:00.000Z',
        read: true,
      },
      {
        id: 'DEMO_FIXTURE-NOTIFICATION-PROGRAM',
        title: 'Kenali alur penjemputan koin Anda',
        body: 'Nominal infak muncul setelah penjemputan dicatat oleh PLPK.',
        createdAt: '2026-09-08T09:20:00.000Z',
        publishedAt: '2026-09-08T09:20:00.000Z',
        readAt: '2026-09-08T10:00:00.000Z',
        read: true,
      },
    ],
  },
};

export function munfiqHomePresentationData(environment: string | undefined, munfiqCode: string, preview = false): MunfiqHomePresentationData | null {
  // Live pages must preserve empty/error responses, including the local UAT account.
  // Samples are only available to an explicitly requested, isolated design preview.
  if (!preview || environment === 'production' || munfiqCode !== LOCAL_PRESENTATION_MUNFIQ_CODE) return null;
  return PRESENTATION_DATA;
}
