export function formatRupiah(value: number): string {
  return `Rp${value.toLocaleString('id-ID')}`;
}

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

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatPhoneNumber(phoneStr: string): string {
  const clean = phoneStr.replace(/\D/g, '');
  if (clean.length > 9) {
    return clean.replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3');
  }
  return clean;
}

export function getInitials(nameStr: string): string {
  const parts = nameStr.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
