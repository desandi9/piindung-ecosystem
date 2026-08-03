'use client';

export function AiScanProgress({ progress, status }: { progress: number; status: string }) {
  return (
    <div className="space-y-2" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={status}>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{status}</p>
    </div>
  );
}
