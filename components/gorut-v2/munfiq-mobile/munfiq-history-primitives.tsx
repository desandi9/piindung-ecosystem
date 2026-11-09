import { Check, Info } from 'lucide-react';
import { collectionFact, munfiqDate, munfiqStages, recordedOwnAmount, type MunfiqCollection } from '@/features/gorut-v2/munfiq-presentation';

export function MunfiqStatus({ item }: { item: MunfiqCollection }) {
  const pending = Boolean(collectionFact(item, 'pending'));
  return <span className={`mq-status ${pending ? 'mq-status-pending' : ''}`}>{pending && <i aria-hidden="true" />}{pending ? 'Menunggu Penjemputan' : item.status ?? 'Riwayat tersedia'}</span>;
}

export function MunfiqAmount({ item }: { item: MunfiqCollection }) {
  const amount = recordedOwnAmount(item);
  return amount ? <strong className="mq-amount">{amount}</strong> : null;
}

export function MunfiqHistoryRow({ item, onOpen }: { item: MunfiqCollection; onOpen: () => void }) {
  const recorded = collectionFact(item, 'recorded');
  const amount = recordedOwnAmount(item);
  return <button type="button" className="mq-history-row" onClick={onOpen}>
    <span className="mq-pickup-history-copy">
      <span className="mq-pickup-history-title"><strong>{munfiqDate(item.periodStart, 'period')}</strong><MunfiqStatus item={item} /></span>
      <span className="mq-history-meta">{recorded ? `${munfiqDate(recorded.at)} · ` : ''}PLPK {item.historicalPlpk.name}</span>
    </span>
    {amount ? <span className="mq-pickup-history-fact"><MunfiqAmount item={item} /><small>Koin Kaleng</small></span> : null}
  </button>;
}

const journeySteps = [
  { key: 'pending', label: 'Penjemputan' },
  { key: 'recorded', label: 'Dicatat' },
  { key: 'verified', label: 'Diverifikasi' },
  { key: 'complete', label: 'Selesai' },
] as const;

export function MunfiqJourney({ item }: { item: MunfiqCollection }) {
  const currentIndex = munfiqJourneyStep(item) - 1;
  return <ol className="mq-journey" aria-label="Perjalanan penjemputan">
    {journeySteps.map(({ key, label }, index) => {
      const fact = collectionFact(item, key);
      const state = fact && key !== 'pending' ? 'recorded' : index === currentIndex ? 'active' : 'inactive';
      return <li key={key} data-state={state}>
        <span className="mq-step-dot" aria-hidden="true">{state === 'recorded' ? <Check size={13} strokeWidth={3} /> : <i />}</span>
        <span>{label}</span><span className="sr-only">{state === 'recorded' ? ' — tercatat' : state === 'active' ? ' — tahap saat ini' : ' — belum ada catatan'}</span>
      </li>;
    })}
  </ol>;
}

export function munfiqJourneyStep(item: MunfiqCollection) {
  if (collectionFact(item, 'complete')) return 4;
  if (collectionFact(item, 'verified') || collectionFact(item, 'upzis') || collectionFact(item, 'pc')) return 3;
  if (collectionFact(item, 'recorded') || collectionFact(item, 'verifying')) return 2;
  return 1;
}

export function MunfiqTimeline({ item }: { item: MunfiqCollection }) {
  const pending = collectionFact(item, 'pending');
  const stages = pending ? [{ key: 'pending', label: 'Belum dijemput' }, ...munfiqStages] : munfiqStages;
  return <ol className="mq-timeline">
    {stages.map(({ key, label }) => {
      const fact = collectionFact(item, key);
      return <li key={key} data-recorded={Boolean(fact)}>
        <span className="mq-timeline-dot" aria-hidden="true">{fact ? <Check size={12} /> : null}</span>
        <div><strong>{fact?.label ?? label}</strong>{fact ? <time dateTime={fact.at}>{munfiqDate(fact.at, 'time')} WIB</time> : <span>Belum ada catatan</span>}</div>
      </li>;
    })}
  </ol>;
}

export function MunfiqRecordingNote() {
  return <p className="mq-note"><Info size={16} aria-hidden="true" /><span>Nominal akan muncul setelah dicatat oleh PLPK.</span></p>;
}

export function MunfiqLoading() {
  return <div className="mq-loading" role="status"><span className="sr-only">Memuat riwayat penjemputan…</span><div /><div /><div /></div>;
}
