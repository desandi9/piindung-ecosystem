import { ArrowUpRight, CheckCircle2, Clock3, Info, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import type { CSSProperties } from 'react';

import type { DashboardAttention } from '@/features/gorut-v2/dashboard-control';

const priorityMeta = {
  critical: { label: 'Perlu koreksi', icon: TriangleAlert },
  warning: { label: 'Menunggu tindakan', icon: Clock3 },
  info: { label: 'Perlu dipantau', icon: Info },
} as const;

export function DashboardPriorityQueue({ items }: { items: DashboardAttention[] }) {
  return (
    <section className="gorut-command-priority" aria-labelledby="gorut-priority-title">
      <header className="gorut-command-section-head">
        <div>
          <h2 id="gorut-priority-title">Tindakan yang perlu didahulukan</h2>
          <p>Urutan otomatis berdasarkan dampak dan status operasional terkini.</p>
        </div>
        <Link href="/gorut-v2/monitoring">Lihat monitoring <ArrowUpRight size={15} aria-hidden="true" /></Link>
      </header>

      {items.length ? (
        <ol className="gorut-command-priority-list gorut-motion-list">
          {items.map((item, index) => {
            const meta = priorityMeta[item.priority];
            const Icon = meta.icon;
            return (
              <li
                key={item.id}
                className={`is-${item.priority}`}
                style={{ '--gorut-motion-index': index } as CSSProperties}
              >
                <span className="gorut-command-priority-icon"><Icon size={17} aria-hidden="true" /></span>
                <div className="gorut-command-priority-copy">
                  <span>{meta.label}</span>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </div>
                <Link href={item.href}>{item.hrefLabel}<ArrowUpRight size={15} aria-hidden="true" /></Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="gorut-command-priority-clear">
          <CheckCircle2 size={20} aria-hidden="true" />
          <div><strong>Tidak ada tindakan mendesak</strong><span>Seluruh batch berjalan tanpa koreksi atau antrean prioritas.</span></div>
        </div>
      )}
    </section>
  );
}
