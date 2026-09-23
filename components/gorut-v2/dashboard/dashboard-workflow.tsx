import { ArrowRight, Check, CircleDashed, OctagonAlert } from 'lucide-react';
import Link from 'next/link';

import type { DashboardFlowStep } from '@/features/gorut-v2/dashboard-control';
import { formatNumber } from '@/features/gorut-v2/formatters';

export function DashboardWorkflow({ steps }: { steps: DashboardFlowStep[] }) {
  return (
    <section className="gorut-command-workflow" aria-labelledby="gorut-workflow-title">
      <header className="gorut-command-section-head">
        <div><h2 id="gorut-workflow-title">Alur kerja penghimpunan</h2><p>Posisi batch dari PLPK sampai pencatatan PC.</p></div>
      </header>
      <ol>
        {steps.map((step, index) => (
          <li key={step.id} className={`is-${step.tone}${step.bottleneck ? ' is-bottleneck' : ''}`}>
            <div className="gorut-command-workflow-rail" aria-hidden="true">
              <span>{step.tone === 'verified' ? <Check size={15} /> : step.bottleneck ? <OctagonAlert size={15} /> : <CircleDashed size={15} />}</span>
              {index < steps.length - 1 ? <i /> : null}
            </div>
            <div className="gorut-command-workflow-copy">
              <div><strong>{step.label}</strong>{step.bottleneck ? <b>Hambatan utama</b> : null}</div>
              <span>{step.status}</span>
              <small>{formatNumber(step.count)} {step.countLabel}</small>
            </div>
            <div className="gorut-command-workflow-progress">
              {step.progress == null ? <span>Progress belum tersedia</span> : <><div><i style={{ width: `${step.progress}%` }} /></div><span>{step.done}/{step.total} selesai · {step.progress}%</span></>}
            </div>
            <Link href={step.href} aria-label={`Lihat detail tahap ${step.label}`}><ArrowRight size={16} aria-hidden="true" /></Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
