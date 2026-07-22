# PIINDUNG Release Checklist

## Batas rilis

- [ ] Perubahan hanya menyentuh portal PIINDUNG pusat, bukan scope GORUT atau operasional.
- [ ] Launcher modul hanya memeriksa izin masuk; otorisasi data dan aksi operasional tetap di modul.
- [ ] Scope legacy internal `portal-user-audit`, `portal-access-audit`, `portal-notification-audit`, dan `portal-module-grants` tidak dibuka melalui generic records API.

## Autentikasi dan redirect

- [ ] Login menerbitkan cookie `piindung-session` `HttpOnly`, `SameSite=Lax`, `Path=/`, dan `Secure` di production.
- [ ] Tidak ada token auth di `localStorage` atau `sessionStorage`.
- [ ] Logout dan perubahan password menghapus cookie sesi.
- [ ] Parameter `next` hanya menerima path lokal aman dan menolak API sensitif, protocol-relative URL, traversal, dan backslash.
- [ ] Rute protected tanpa sesi redirect ke `/login?next=...`; rute member-area terlarang redirect ke `/dashboard`.

## Data dan privasi

- [ ] Dashboard, Member Area, profil, hak akses, notifikasi, aktivitas, audit, topbar, dan verifikasi publik tidak merender raw JSON.
- [ ] Notifikasi, aktivitas, dan audit merender plain React text; tidak memakai `dangerouslySetInnerHTML`.
- [ ] Aktivitas akun difilter server-side berdasarkan pengguna saat ini.
- [ ] Audit pusat hanya menampilkan ringkasan aman, kategori, label sumber, pelaku, target, dan waktu.
- [ ] Verifikasi publik tidak menampilkan email, telepon, token, grant, permission, atau data operasional.

## Request security dan query bounds

- [ ] Mutation JSON memvalidasi `Content-Type`, batas ukuran payload, dan same-origin `Origin` jika dikirim browser.
- [ ] Endpoint private mengirim `Cache-Control: private, no-store`.
- [ ] Pagination notifikasi dibatasi `page >= 1`, `limit <= 50`.
- [ ] Pagination aktivitas dibatasi `page >= 1`, `limit <= 50`.
- [ ] Pagination audit dibatasi `page <= 10000`, `limit <= 50`, search <= 100 karakter, tanggal valid.

## Aksesibilitas UI

- [ ] Semua icon-only button punya `aria-label` atau teks screen-reader.
- [ ] Input punya label terasosiasi atau `aria-label`.
- [ ] Tidak ada label kosong atau label tanpa kontrol.
- [ ] Dialog/dropdown penting memakai status expanded/label yang cukup.

## Validasi akhir

- [ ] `npm run lint`
- [ ] Test keamanan kecil: `node --test lib/request-security.test.ts lib/safe-redirect.test.ts lib/portal-notifications.test.ts lib/portal-access.test.ts lib/account-activity.test.ts lib/central-audit.test.ts`
- [ ] Smoke test login, dashboard, `/member-area`, `/member-area/identitas`, `/notifikasi`, `/member-area/aktivitas`, `/member-area/audit`, `/member-area/notifikasi`, `/member-area/hak-akses`, dan `/verify/{memberId}`.
