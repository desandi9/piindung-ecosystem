import type { MunfiqData } from '@/lib/gorut/types'
import { createPlpkCodeRegistry, formatPlpkCode } from '@/lib/gorut/plpk-registry'

const kecamatanCodeMap: Record<string, string> = {
  'Garut Kota': 'GK',
  'Tarogong Kaler': 'TK',
  'Tarogong Kidul': 'TD',
  Karangpawitan: 'KP',
  Banyuresmi: 'BR',
  Samarang: 'SM',
  Wanaraja: 'WR',
  Kadungora: 'KD',
  Leles: 'LL',
  Cibatu: 'CB',
  Malangbong: 'MB',
  Limbangan: 'LB',
  Selaawi: 'SW',
  Cikajang: 'CJ',
  Bayongbong: 'BY',
  Cisurupan: 'CS',
  Sukaresmi: 'SK',
  Pasirwangi: 'PW',
  Caringin: 'CR',
  Banjarwangi: 'BJ',
  Singajaya: 'SJ',
  Cilawu: 'CL',
  Peundeuy: 'PD',
  Cisompet: 'CT',
  Pakenjeng: 'PJ',
  Cibalong: 'CG',
  Bungbulang: 'BB',
  Mekarmukti: 'MM',
  Pameungpeuk: 'PM',
  Cikelet: 'CK',
  Cisewu: 'CW',
  Talegong: 'TG',
  Cihurip: 'CH',
  Karangtengah: 'KT',
  Sukawening: 'SN',
}

function toFiveDigitSequence(value: number) {
  return String(value).padStart(5, '0')
}

function getParsedSequence(item: Pick<MunfiqData, 'sequence' | 'munfiqCode'>) {
  if (typeof item.sequence === 'number' && Number.isFinite(item.sequence) && item.sequence > 0) {
    return item.sequence
  }

  if (item.munfiqCode && /^[A-Z]{2}\d{8}$/.test(item.munfiqCode)) {
    return Number.parseInt(item.munfiqCode.slice(5), 10)
  }

  return null
}

function getSequenceScopeKey(item: Pick<MunfiqData, 'kecamatan' | 'munfiqCode'>) {
  if (item.munfiqCode && /^[A-Z]{2}\d{8}$/.test(item.munfiqCode)) {
    return item.munfiqCode.slice(0, 2)
  }

  return getKecamatanCode(item.kecamatan)
}

export function getKecamatanCode(kecamatan: string) {
  return kecamatanCodeMap[kecamatan] ?? 'ZZ'
}

export function formatMunfiqCode(kecamatanCode: string, plpkCode: string, sequence: number) {
  return `${kecamatanCode}${formatPlpkCode(plpkCode)}${toFiveDigitSequence(sequence)}`
}

export function ensureMunfiqCodeFields(items: MunfiqData[]) {
  const plpkRegistry = createPlpkCodeRegistry(items)
  const maxSequenceByKecamatan = new Map<string, number>()

  for (const item of items) {
    const sequence = getParsedSequence(item)
    if (!sequence) continue

    const scopeKey = getSequenceScopeKey(item)
    maxSequenceByKecamatan.set(scopeKey, Math.max(maxSequenceByKecamatan.get(scopeKey) ?? 0, sequence))
  }

  let changed = false

  const normalizedItems = items.map((item) => {
    const plpkCode = item.plpkCode && /^\d{3}$/.test(item.plpkCode)
      ? item.plpkCode
      : plpkRegistry.ensure(item.plpk)
    const scopeKey = getKecamatanCode(item.kecamatan)
    const sequence = getParsedSequence(item) ?? ((maxSequenceByKecamatan.get(scopeKey) ?? 0) + 1)

    maxSequenceByKecamatan.set(scopeKey, Math.max(maxSequenceByKecamatan.get(scopeKey) ?? 0, sequence))

    const munfiqCode = item.munfiqCode && /^[A-Z]{2}\d{8}$/.test(item.munfiqCode)
      ? item.munfiqCode
      : formatMunfiqCode(getKecamatanCode(item.kecamatan), plpkCode, sequence)

    if (item.plpkCode !== plpkCode || item.sequence !== sequence || item.munfiqCode !== munfiqCode) {
      changed = true
    }

    return {
      ...item,
      plpkCode,
      sequence,
      munfiqCode,
    }
  })

  return { items: normalizedItems, changed }
}

export function createMunfiqWithGeneratedCode(existingItems: MunfiqData[], draft: MunfiqData) {
  const normalizedExisting = ensureMunfiqCodeFields(existingItems).items
  const plpkRegistry = createPlpkCodeRegistry(normalizedExisting)
  const plpkCode = plpkRegistry.ensure(draft.plpk)
  const scopeKey = getKecamatanCode(draft.kecamatan)
  const sequence = normalizedExisting
    .filter((item) => getSequenceScopeKey(item) === scopeKey)
    .map((item) => item.sequence ?? 0)
    .reduce((max, value) => Math.max(max, value), 0) + 1

  return {
    ...draft,
    plpkCode,
    sequence,
    munfiqCode: formatMunfiqCode(getKecamatanCode(draft.kecamatan), plpkCode, sequence),
  }
}

export function preserveMunfiqIdentity(nextItem: MunfiqData, existingItem?: MunfiqData | null) {
  if (!existingItem) return nextItem

  return {
    ...nextItem,
    munfiqCode: existingItem.munfiqCode,
    plpkCode: existingItem.plpkCode,
    sequence: existingItem.sequence,
  }
}
