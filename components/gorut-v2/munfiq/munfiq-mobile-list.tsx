'use client';

import { MoreHorizontal, Edit3, Eye, Trash2, Settings2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { GorutMunfiq } from '@/features/gorut-v2/types';
import { formatRupiah, getInitials } from '@/features/gorut-v2/formatters';
import { munfiqStatusLabels } from '@/features/gorut-v2/munfiq-options';

export function MunfiqMobileList({ items, onDetail, onEdit, onDelete, onNotice }: { items: GorutMunfiq[]; onDetail: (item: GorutMunfiq) => void; onEdit: (item: GorutMunfiq) => void; onDelete: (item: GorutMunfiq) => void; onNotice: (message: string) => void }) {
  return <div className="gorut-munfiq-mobile-list">{items.map((item) => <article key={item.id}><div className="gorut-munfiq-card-top"><button type="button" className="gorut-munfiq-person" onClick={() => onDetail(item)} aria-label={`Lihat detail ${item.name}`}><span className="gorut-avatar">{getInitials(item.name)}</span><span><strong>{item.name}</strong><small>{item.memberId}</small></span></button><CardActions item={item} onDetail={onDetail} onEdit={onEdit} onDelete={onDelete} onNotice={onNotice} /></div><div className="gorut-munfiq-card-middle"><span className={`gorut-munfiq-status is-${item.status}`}>{munfiqStatusLabels[item.status]}</span><span className="gorut-munfiq-amount">{formatRupiah(item.totalCollected)}</span></div><dl><div><dt>Wilayah</dt><dd>{item.kecamatan}</dd></div><div><dt>UPZIS</dt><dd>{item.upzis}</dd></div><div><dt>PLPK</dt><dd>{item.plpkName}</dd></div><div><dt>Setoran Terakhir</dt><dd>{item.lastDepositAt ? formatDateOnly(item.lastDepositAt) : '-'}</dd></div></dl></article>)}</div>;
}

function formatDateOnly(dateStr: string): string { const d = new Date(dateStr); return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }); }

function CardActions({ item, onDetail, onEdit, onDelete, onNotice }: { item: GorutMunfiq; onDetail: (item: GorutMunfiq) => void; onEdit: (item: GorutMunfiq) => void; onDelete: (item: GorutMunfiq) => void; onNotice: (message: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close); }, []);
  const run = (action: () => void) => { setOpen(false); action(); };
  return <div className="gorut-dropdown" ref={ref}><button type="button" className="gorut-icon-button" onClick={() => setOpen((val) => !val)} aria-label="Aksi" aria-expanded={open}><MoreHorizontal size={16} /></button>{open ? <div className="gorut-dropdown-menu"><button type="button" onClick={() => run(() => onDetail(item))}><Eye size={13} />Detail</button><button type="button" onClick={() => run(() => onEdit(item))}><Edit3 size={13} />Edit</button><button type="button" onClick={() => run(() => onNotice(`Status ${item.name} berhasil diubah`))}><Settings2 size={13} />Ubah Status</button><button type="button" onClick={() => run(() => onDelete(item))}><Trash2 size={13} className="text-red-500" />Hapus</button></div> : null}</div>;
}
