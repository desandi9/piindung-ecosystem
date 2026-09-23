export function countActiveFilters(values: Array<string | undefined | null>) {
  return values.filter((value) => value != null && value !== '' && value !== 'all').length;
}

export function formatResultSummary(visible: number, total: number, noun: string) {
  return `Menampilkan ${visible.toLocaleString('id-ID')} dari ${total.toLocaleString('id-ID')} ${noun}`;
}
