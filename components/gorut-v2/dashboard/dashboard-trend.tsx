'use client';

import { BarChart3, LineChart } from 'lucide-react';
import { useMemo, useState, type CSSProperties } from 'react';

import type { DashboardTrendPoint } from '@/features/gorut-v2/dashboard-control';
import { formatRupiah, formatRupiahCompact } from '@/features/gorut-v2/formatters';
import { formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';

import { DashboardCountUp } from './dashboard-count-up';

const chart = { width: 720, height: 260, left: 48, right: 28, top: 24, bottom: 46 };

function buildPoints(data: DashboardTrendPoint[]) {
  const max = Math.max(...data.map((item) => item.netAmount), 1);
  const stageWidth = chart.width - chart.left - chart.right;
  const stageHeight = chart.height - chart.top - chart.bottom;
  return data.map((item, index) => {
    const x = chart.left + (index * stageWidth) / Math.max(data.length - 1, 1);
    const y = chart.top + stageHeight - (item.netAmount / max) * stageHeight;
    return { item, x, y, max };
  });
}

export function DashboardTrend({ data }: { data: DashboardTrendPoint[] }) {
  const [mode, setMode] = useState<'line' | 'bar'>('bar');
  const points = useMemo(() => buildPoints(data), [data]);
  const totalNet = data.reduce((sum, item) => sum + item.netAmount, 0);
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  const latest = data.at(-1);
  const minimum = data.length ? Math.min(...data.map((item) => item.netAmount)) : 0;
  const maximum = data.length ? Math.max(...data.map((item) => item.netAmount)) : 0;
  const axisValues = [1, 0.75, 0.5, 0.25, 0].map((ratio) => maximum * ratio);
  const firstPoint = points.at(0);
  const lastPoint = points.at(-1);
  const areaPath = firstPoint && lastPoint
    ? `${path} L ${lastPoint.x} ${chart.height - chart.bottom} L ${firstPoint.x} ${chart.height - chart.bottom} Z`
    : '';

  return (
    <section className="gorut-command-trend" aria-labelledby="gorut-trend-title">
      <header className="gorut-command-section-head">
        <div><h2 id="gorut-trend-title">Perkembangan penghimpunan</h2><p>Jumlah bersih dari enam periode terakhir berdasarkan data batch.</p></div>
        <div className="gorut-command-chart-switch" role="group" aria-label="Mode visualisasi tren">
          <button type="button" aria-pressed={mode === 'bar'} onClick={() => setMode('bar')}><BarChart3 size={15} aria-hidden="true" />Batang</button>
          <button type="button" aria-pressed={mode === 'line'} onClick={() => setMode('line')}><LineChart size={15} aria-hidden="true" />Garis</button>
        </div>
      </header>

      <div className="gorut-command-trend-summary">
        <span>Total enam periode</span><strong data-numeric><DashboardCountUp value={totalNet} format={formatRupiahCompact} /></strong>
        {latest ? <small>Terbaru {formatPeriodLabel(latest.period)} · {formatRupiah(latest.netAmount)}</small> : null}
      </div>

      <p className="gorut-sr-only">Nilai terendah {formatRupiah(minimum)}, tertinggi {formatRupiah(maximum)}, dan nilai terbaru {formatRupiah(latest?.netAmount ?? 0)}.</p>

      {data.length ? (
        <div className={`gorut-command-chart is-${mode}`}>
          {mode === 'line' ? (
            <div className="gorut-command-line-stage">
              <svg viewBox={`0 0 ${chart.width} ${chart.height}`} aria-hidden="true" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gorut-command-net-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--gorut-brand)" stopOpacity=".18" />
                    <stop offset="100%" stopColor="var(--gorut-brand)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[chart.top, 72, 120, 168, chart.height - chart.bottom].map((y) => <line key={y} x1={chart.left} x2={chart.width - chart.right} y1={y} y2={y} />)}
                <path className="gorut-command-chart-area" d={areaPath} />
                <path className="gorut-command-line-path" d={path} />
              </svg>
              {points.map((point) => (
                <button
                  key={point.item.period}
                  type="button"
                  className="gorut-command-chart-point"
                  style={{
                    '--gorut-point-x': `${(point.x / chart.width) * 100}%`,
                    '--gorut-point-y': `${(point.y / chart.height) * 100}%`,
                  } as CSSProperties}
                  aria-label={`${formatPeriodLabel(point.item.period)}, jumlah bersih ${formatRupiah(point.item.netAmount)}`}
                >
                  <span className="gorut-command-chart-tooltip" role="tooltip">{formatRupiah(point.item.netAmount)}</span>
                </button>
              ))}
              <div className="gorut-command-chart-labels" aria-hidden="true">
                {data.map((item) => <span key={item.period}>{formatPeriodLabel(item.period).split(' ')[0].slice(0, 3)}</span>)}
              </div>
            </div>
          ) : (
            <div className="gorut-command-bars-shell">
              <div className="gorut-command-bars-axis" aria-hidden="true">
                {axisValues.map((value, index) => <span key={`${value}-${index}`}>{formatRupiahCompact(value)}</span>)}
              </div>
              <div className="gorut-command-bars-stage">
                {points.map((point) => (
                  <button
                    key={point.item.period}
                    type="button"
                    aria-label={`${formatPeriodLabel(point.item.period)}, jumlah bersih ${formatRupiah(point.item.netAmount)}`}
                    style={{ '--gorut-bar-height': `${Math.max(8, (point.item.netAmount / point.max) * 100)}%` } as CSSProperties}
                  >
                    <span className="gorut-command-chart-tooltip" role="tooltip">{formatRupiah(point.item.netAmount)}</span>
                    <i />
                    <small>{formatPeriodLabel(point.item.period).split(' ')[0].slice(0, 3)}</small>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : <div className="gorut-state-empty"><h2>Belum ada tren</h2><p>Batch penghimpunan belum tersedia untuk divisualisasikan.</p></div>}
    </section>
  );
}
