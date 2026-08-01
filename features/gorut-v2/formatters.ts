export function formatRupiahCompact(value: number): string {
  if (value >= 1_000_000_000) {
    return `Rp${(value / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} M`;
  }
  if (value >= 1_000_000) {
    return `Rp${(value / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
  }
  return `Rp${value.toLocaleString('id-ID')}`;
}

export function formatPercentage(value: number, withSign = false): string {
  const sign = withSign && value > 0 ? '+' : '';
  return `${sign}${value.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('id-ID');
}

export function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}
