'use client';

import { SearchX } from 'lucide-react';

export function MunfiqEmptyState({ onReset }: { onReset: () => void }) { return <section className="gorut-munfiq-empty"><SearchX size={28} /><h2>Munfiq tidak ditemukan</h2><p>Tidak ada data yang cocok dengan pencarian atau filter saat ini.</p><button type="button" className="gorut-button gorut-secondary-button" onClick={onReset}>Reset Filter</button></section>; }
