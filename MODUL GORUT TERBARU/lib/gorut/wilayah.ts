import { kecamatanData, munfiqDataList, plpkData, transactionData } from './data'

export type KecamatanOverview = {
  id: string
  nama: string
  jumlahKotak: number
  jumlahKotakAktif: number
  totalTerkumpul: number
  jumlahDesa: number
  rantingCount: number
  munfiqCount: number
  totalKoin: number
  activationRate: number
  activePlpkCount: number
  pendingTransactions: number
  healthScore: number
  lastActivity: string | null
}

export type PlpkOverview = {
  id: string
  nama: string
  ranting: string
  kecamatan: string
  kontak: string
  status: 'aktif' | 'nonaktif' | 'pending'
  jumlahMunfiq: number
  targetMunfiq: number
  totalSetoran: number
  targetSetoran: number
  performanceScore: number
  pendingTransactions: number
  activeMunfiq: number
  lastActivity: string
  wilayahNames: string[]
}

export type UpzisOverview = {
  id: string
  nama: string
  kecamatan: string
  ketua: string
  kontak: string
  status: 'aktif' | 'nonaktif' | 'pending'
  jumlahMunfiq: number
  totalSetoran: number
  targetBulanIni: number
  realisasiBulanIni: number
  pertumbuhanPersen: number
  penghimpunanScore: number
  pendingTransactions: number
  lastActivityAt: string
  wilayahNames: string[]
  plpkNames: string[]
}

function normalizeDate(value?: string | null) {
  return value ?? '2026-05-01T08:00:00'
}

function getHealthScore(input: {
  activationRate: number
  performanceScore: number
  pendingTransactions: number
  activePlpkCount: number
}) {
  const pendingPenalty = Math.min(18, input.pendingTransactions * 6)
  const plpkPenalty = input.activePlpkCount > 0 ? 0 : 20
  return Math.max(
    35,
    Math.round(input.activationRate * 0.4 + input.performanceScore * 0.6 - pendingPenalty - plpkPenalty),
  )
}

export function getWilayahOverview() {
  const plpkOverview: PlpkOverview[] = plpkData.map((item) => {
    const relatedMunfiq = munfiqDataList.filter((munfiq) => munfiq.plpk === item.nama)
    const relatedTransactions = transactionData.filter((trx) => trx.kecamatan === item.kecamatan)
    const desaNames = Array.from(new Set(relatedMunfiq.map((munfiq) => munfiq.desa)))
    const pendingTransactions = relatedTransactions.filter((trx) => trx.status === 'pending').length
    const status = item.status === 'nonaktif' ? 'nonaktif' : pendingTransactions > 0 ? 'pending' : 'aktif'

    return {
      id: item.id,
      nama: item.nama,
      ranting: item.ranting,
      kecamatan: item.kecamatan,
      kontak: item.noHp,
      status,
      jumlahMunfiq: item.jumlahMunfiq,
      targetMunfiq: item.targetMunfiq,
      totalSetoran: item.totalSetoran,
      targetSetoran: item.targetSetoran,
      performanceScore: item.performanceScore,
      pendingTransactions,
      activeMunfiq: relatedMunfiq.filter((munfiq) => munfiq.status === 'aktif').length,
      lastActivity: normalizeDate(item.lastActivity),
      wilayahNames: desaNames.length > 0 ? desaNames : [item.ranting.replace(/^Ranting\s+/i, '')],
    }
  })

  const kecamatanOverview: KecamatanOverview[] = kecamatanData.map((item) => {
    const relatedPlpk = plpkOverview.filter((plpk) => plpk.kecamatan === item.nama)
    const relatedTransactions = transactionData.filter((trx) => trx.kecamatan === item.nama)
    const munfiqCount = munfiqDataList.filter((munfiq) => munfiq.kecamatan === item.nama).length
    const activePlpkCount = relatedPlpk.filter((plpk) => plpk.status !== 'nonaktif').length
    const activationRate = Math.round((item.jumlahKotakAktif / Math.max(1, item.jumlahKotak)) * 100)
    const avgPerformance =
      relatedPlpk.length > 0
        ? Math.round(relatedPlpk.reduce((sum, plpk) => sum + plpk.performanceScore, 0) / relatedPlpk.length)
        : activationRate
    const pendingTransactions = relatedTransactions.filter((trx) => trx.status === 'pending').length
    const lastActivity =
      relatedPlpk.map((plpk) => plpk.lastActivity).sort((a, b) => b.localeCompare(a))[0] ?? null

    return {
      id: item.id,
      nama: item.nama,
      jumlahKotak: item.jumlahKotak,
      jumlahKotakAktif: item.jumlahKotakAktif,
      totalTerkumpul: item.totalTerkumpul,
      jumlahDesa: item.jumlahDesa,
      rantingCount: item.rantingCount ?? Math.max(relatedPlpk.length, Math.round(item.jumlahDesa / 2.5)),
      munfiqCount: item.munfiqCount ?? munfiqCount,
      totalKoin: item.totalKoin ?? item.totalTerkumpul,
      activationRate,
      activePlpkCount,
      pendingTransactions,
      healthScore: getHealthScore({
        activationRate,
        performanceScore: avgPerformance,
        pendingTransactions,
        activePlpkCount,
      }),
      lastActivity,
    }
  })

  const upzisOverview: UpzisOverview[] = kecamatanOverview.map((kecamatan, index) => {
    const relatedPlpk = plpkOverview.filter((plpk) => plpk.kecamatan === kecamatan.nama)
    const ketua = relatedPlpk[0]?.nama ?? `Koordinator ${kecamatan.nama}`
    const kontak = relatedPlpk[0]?.kontak ?? '0812-0000-0000'
    const status =
      relatedPlpk.length === 0 || relatedPlpk.every((plpk) => plpk.status === 'nonaktif')
        ? 'nonaktif'
        : kecamatan.pendingTransactions > 0 || kecamatan.healthScore < 80
          ? 'pending'
          : 'aktif'

    return {
      id: `UPZIS-${String(index + 1).padStart(3, '0')}`,
      nama: `UPZIS ${kecamatan.nama}`,
      kecamatan: kecamatan.nama,
      ketua,
      kontak,
      status,
      jumlahMunfiq: kecamatan.munfiqCount,
      totalSetoran: kecamatan.totalTerkumpul,
      targetBulanIni: Math.round(kecamatan.totalTerkumpul * 0.95),
      realisasiBulanIni: Math.round(kecamatan.totalTerkumpul * (status === 'aktif' ? 0.98 : status === 'pending' ? 0.74 : 0.42)),
      pertumbuhanPersen: status === 'aktif' ? 7.8 : status === 'pending' ? 1.9 : -4.1,
      penghimpunanScore: kecamatan.healthScore,
      pendingTransactions: kecamatan.pendingTransactions,
      lastActivityAt: normalizeDate(kecamatan.lastActivity),
      wilayahNames: relatedPlpk.flatMap((plpk) => plpk.wilayahNames),
      plpkNames: relatedPlpk.map((plpk) => plpk.nama),
    }
  })

  return {
    kecamatan: kecamatanOverview,
    plpk: plpkOverview,
    upzis: upzisOverview,
  }
}
