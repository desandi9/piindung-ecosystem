import { plpkData } from '@/lib/gorut/data'
import type { MunfiqData } from '@/lib/gorut/types'

function normalizePlpkKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function formatPlpkCode(value: string | number) {
  const numeric = Number.parseInt(String(value), 10)
  return String(Number.isFinite(numeric) ? numeric : 0).padStart(3, '0')
}

export function createPlpkCodeRegistry(items: MunfiqData[] = []) {
  const registry = new Map<string, string>()

  for (const item of plpkData) {
    registry.set(normalizePlpkKey(item.nama), formatPlpkCode(item.id))
  }

  for (const item of items) {
    if (!item.plpk) continue
    if (item.plpkCode && /^\d{3}$/.test(item.plpkCode)) {
      registry.set(normalizePlpkKey(item.plpk), item.plpkCode)
    }
  }

  let maxCode = [...registry.values()]
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value))
    .reduce((max, value) => Math.max(max, value), 0)

  return {
    get(plpkName: string) {
      return registry.get(normalizePlpkKey(plpkName || '-'))
    },
    ensure(plpkName: string) {
      const key = normalizePlpkKey(plpkName || '-')
      const existing = registry.get(key)
      if (existing) return existing

      maxCode += 1
      const nextCode = formatPlpkCode(maxCode)
      registry.set(key, nextCode)
      return nextCode
    },
    entries() {
      return [...registry.entries()]
    },
  }
}
