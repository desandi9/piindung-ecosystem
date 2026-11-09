import { munfiqHomePresentationData } from './munfiq-home-presentation-data';
import { isAllowedActionPath } from '@/lib/portal-notifications';

export type MunfiqNotification = {
  id: string; title: string; body: string; category?: string; severity?: string;
  actionPath?: string | null; createdAt: string; publishedAt: string | null; readAt: string | null; read: boolean;
};
export type MunfiqNotificationsResponse = {
  notifications: MunfiqNotification[]; unreadCount: number; page: number; hasMore: boolean;
};
export type NotificationTopic = 'penjemputan' | 'kontribusi' | 'program' | 'layanan' | 'informasi';
export const notificationTopicLabels: Record<NotificationTopic, string> = {
  penjemputan: 'Penjemputan', kontribusi: 'Kontribusi', program: 'Program', layanan: 'Layanan', informasi: 'Informasi',
};

// Presentation grouping only; the server's category and eligibility remain authoritative.
export function notificationTopic(item: MunfiqNotification): NotificationTopic {
  if (['security', 'account', 'access'].includes(item.category ?? '')) return 'layanan';
  const text = `${item.title} ${item.body}`.toLocaleLowerCase('id-ID');
  if (/\b(program|beasiswa|pemberdayaan)\b/.test(text)) return 'program';
  if (/\b(penjemputan|dijemput|menjemput|jadwal)\b/.test(text)) return 'penjemputan';
  if (/\b(infak|kontribusi|setoran|penghimpunan)\b/.test(text)) return 'kontribusi';
  if (/\b(layanan|ambulans|ambulance|ppob|akun)\b/.test(text)) return 'layanan';
  return 'informasi';
}

function jakartaDay(value: string | number) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = (type: string) => parts.find((entry) => entry.type === type)!.value;
  return Date.UTC(Number(part('year')), Number(part('month')) - 1, Number(part('day')));
}
export function notificationTimeGroup(item: MunfiqNotification, now: number) {
  const day = jakartaDay(item.publishedAt ?? item.createdAt);
  const today = jakartaDay(now)!;
  if (day === null) return 'Waktu belum tersedia';
  if (day >= today) return 'Hari ini';
  const weekStart = today - ((new Date(today).getUTCDay() + 6) % 7) * 86400000;
  return day >= weekStart ? 'Minggu ini' : 'Sebelumnya';
}
export function notificationDate(item: MunfiqNotification, time = false) {
  const value = item.publishedAt ?? item.createdAt;
  if (!Number.isFinite(Date.parse(value))) return 'Waktu belum tersedia';
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', ...(time ? { hour: '2-digit', minute: '2-digit', hour12: false } as const : { day: 'numeric', month: 'short', year: 'numeric' } as const) }).format(new Date(value)) + (time ? ' WIB' : '');
}
export function notificationActionHref(path: string | null | undefined, homeHref: string) {
  if (!path || !isAllowedActionPath(path)) return null;
  return path === '/notifikasi' ? `${homeHref}/notifikasi` : path;
}
export function mergeNotifications(current: MunfiqNotification[], incoming: MunfiqNotification[]) {
  const items = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) items.set(item.id, item);
  return [...items.values()];
}
export function munfiqNotificationFixture(environment: string | undefined, code: string): MunfiqNotificationsResponse | null {
  const fixture = munfiqHomePresentationData(environment, code);
  if (!fixture) return null;
  const notifications = fixture.notifications.notifications.map((item) => ({ ...item }));
  return { notifications, unreadCount: notifications.filter((item) => !item.read).length, page: 1, hasMore: false };
}
