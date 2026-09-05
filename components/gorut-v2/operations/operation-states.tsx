import { AlertTriangle, Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

export function OperationLoadingState({ rows = 5 }: { rows?: number }) {
  return <div className="gorut-operation-state is-loading" aria-label="Memuat data" aria-busy="true">{Array.from({ length: rows }, (_, index) => <i key={index} />)}</div>;
}

export function OperationEmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description: string; action?: ReactNode }) {
  return <div className="gorut-operation-state is-empty">{icon ?? <Inbox size={22} aria-hidden="true" />}<h2>{title}</h2><p>{description}</p>{action}</div>;
}

export function OperationErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="gorut-operation-state is-error" role="alert"><AlertTriangle size={22} aria-hidden="true" /><h2>Data belum dapat ditampilkan</h2><p>{message}</p>{onRetry ? <button type="button" onClick={onRetry}>Coba lagi</button> : null}</div>;
}
