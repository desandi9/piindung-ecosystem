'use client';

import type { GorutMunfiq } from '@/features/gorut-v2/types';
import { formatDateShort, formatPhoneNumber, formatRupiah, getInitials } from '@/features/gorut-v2/formatters';
import { calculateMunfiqAverageMonthly, munfiqStatusLabels } from '@/features/gorut-v2/munfiq-options';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export function MunfiqDetailDrawer({ open, munfiq, onClose, onEdit, onNotice }: { open: boolean; munfiq: GorutMunfiq | null; onClose: () => void; onEdit: () => void; onNotice: (message: string) => void }) {
  if (!munfiq) return null;
  const average = calculateMunfiqAverageMonthly(munfiq);
  const transactions = [
    { id: 't-1', date: munfiq.lastDepositAt || '2026-07-20', amount: munfiq.lastDepositAmount || 50000 },
    { id: 't-2', date: '2026-06-15', amount: 75000 },
    { id: 't-3', date: '2026-05-10', amount: 100000 },
    { id: 't-4', date: '2026-04-05', amount: 50000 },
  ].filter((_, index) => index === 0 || munfiq.totalCollected > 100000);
  return <Sheet open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}><SheetContent className="gorut-munfiq-drawer" aria-describedby="munfiq-detail-description"><SheetHeader className="gorut-drawer-header"><div className="gorut-munfiq-person"><span className="gorut-avatar">{getInitials(munfiq.name)}</span><span><SheetTitle>{munfiq.name}</SheetTitle><SheetDescription id="munfiq-detail-description">{munfiq.memberId}</SheetDescription></span></div><button type="button" className="gorut-button gorut-secondary-button" onClick={onEdit}>Edit</button></SheetHeader><div className="gorut-drawer-body"><DrawerSection title="Informasi Kontak"><dl><div><dt>Nomor HP</dt><dd>{formatPhoneNumber(munfiq.phone)}</dd></div><div><dt>Email</dt><dd>{munfiq.email || '-'}</dd></div><div><dt>Alamat</dt><dd>{munfiq.address}</dd></div></dl></DrawerSection><DrawerSection title="Wilayah & Penanggung Jawab"><dl><div><dt>Kecamatan</dt><dd>{munfiq.kecamatan}</dd></div><div><dt>Desa</dt><dd>{munfiq.village}</dd></div><div><dt>UPZIS</dt><dd>{munfiq.upzis}</dd></div><div><dt>Petugas PLPK</dt><dd>{munfiq.plpkName}</dd></div><div><dt>Status Anggota</dt><dd><span className={`gorut-munfiq-status is-${munfiq.status}`}>{munfiqStatusLabels[munfiq.status]}</span></dd></div></dl></DrawerSection><DrawerSection title="Ringkasan Penghimpunan"><div className="gorut-summary-grid"><Summary label="Total Terkumpul" value={formatRupiah(munfiq.totalCollected)} /><Summary label="Rata-rata Bulanan" value={formatRupiah(average)} /><Summary label="Jumlah Setoran" value={`${munfiq.transactionCount} kali`} /></div></DrawerSection><DrawerSection title="Riwayat Transaksi"><div className="gorut-drawer-transactions">{transactions.map((transaction) => <div key={transaction.id} className="gorut-drawer-transaction-row"><div><strong>{formatRupiah(transaction.amount)}</strong><small>{formatDateShort(transaction.date)}</small></div><span className="gorut-munfiq-status is-active">Diverifikasi</span></div>)}</div></DrawerSection><DrawerSection title="Catatan">{munfiq.notes ? <p className="gorut-drawer-notes-text">{munfiq.notes}</p> : <p className="gorut-drawer-empty-text">Tidak ada catatan</p>}</DrawerSection></div><SheetFooter className="gorut-drawer-footer"><button type="button" className="gorut-button gorut-secondary-button" onClick={() => onNotice('Fitur transaksi akan dibuat pada batch berikutnya')}>Catat Transaksi</button><button type="button" className="gorut-button gorut-primary-button" onClick={onClose}>Tutup</button></SheetFooter></SheetContent></Sheet>;
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="gorut-drawer-section"><h3>{title}</h3>{children}</section>; }
function Summary({ label, value }: { label: string; value: string }) { return <div className="gorut-summary-metric"><small>{label}</small><strong>{value}</strong></div>; }
