import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeNotifications, munfiqNotificationFixture, notificationActionHref, notificationDate, notificationTimeGroup, notificationTopic, type MunfiqNotification } from './munfiq-notifications';
const item: MunfiqNotification = { id: 'n1', title: 'Infak Anda sudah tercatat', body: 'Catatan infak masuk ke proses penghimpunan.', category: 'system', createdAt: '2026-09-30T18:00:00Z', publishedAt: null, readAt: null, read: false };
test('notification topics classify existing milestone copy without changing server categories', () => {
  assert.equal(notificationTopic(item), 'kontribusi');
  assert.equal(notificationTopic({ ...item, title: 'Jadwal penjemputan koin', body: 'Siapkan infak Anda.' }), 'penjemputan');
  assert.equal(notificationTopic({ ...item, title: 'Program pendidikan', body: 'Kontribusi untuk pendidikan.' }), 'program');
  assert.equal(notificationTopic({ ...item, category: 'security' }), 'layanan');
  assert.equal(notificationTopic({ ...item, title: 'Pengumuman', body: 'Informasi terbaru.' }), 'informasi');
});
test('time groups use Jakarta midnight and Monday as the start of the week', () => {
  const now = Date.parse('2026-09-30T18:30:00Z');
  assert.equal(notificationTimeGroup(item, now), 'Hari ini');
  assert.equal(notificationTimeGroup({ ...item, publishedAt: '2026-09-30T16:59:59Z' }, now), 'Minggu ini');
  assert.equal(notificationTimeGroup({ ...item, publishedAt: '2026-09-27T16:59:59Z' }, now), 'Sebelumnya');
});
test('invalid notification dates remain readable', () => {
  const invalid = { ...item, createdAt: 'invalid' };
  assert.equal(notificationDate(invalid), 'Waktu belum tersedia');
  assert.equal(notificationTimeGroup(invalid, Date.now()), 'Waktu belum tersedia');
  assert.match(notificationDate(item, true), /01[.:]00 WIB/);
});
test('pagination deduplicates and updates existing read state', () => {
  const result = mergeNotifications([item], [{ ...item, read: true }, { ...item, id: 'n2' }]);
  assert.equal(result.length, 2);
  assert.equal(result[0].read, true);
});
test('notification actions reject external and unsafe paths', () => {
  const home = '/gorut-v2/mobile/ruang-munfiq';
  for (const path of ['https://example.com', '//example.com', '/%2e%2e/admin', '/unknown', '/\\evil', 'javascript:alert(1)']) assert.equal(notificationActionHref(path, home), null);
  assert.equal(notificationActionHref('/notifikasi', home), `${home}/notifikasi`);
  assert.equal(notificationActionHref('/profil', home), '/profil');
});
test('demo notifications are restricted, independently mutable, and count actual unread items', () => {
  assert.equal(munfiqNotificationFixture('production', 'UAT-M001'), null);
  assert.equal(munfiqNotificationFixture('development', 'OTHER'), null);
  const demo = munfiqNotificationFixture('development', 'UAT-M001')!;
  assert.equal(demo.unreadCount, demo.notifications.filter((entry) => !entry.read).length);
  demo.notifications[0].read = true;
  assert.equal(munfiqNotificationFixture('development', 'UAT-M001')!.notifications[0].read, false);
});
