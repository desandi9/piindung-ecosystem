export function isPlpkOperationalRole(role: string | null | undefined): boolean {
  return role === 'plpk'
}

export type PlpkDashboardTransaction = {
  id: string
  transactionCode: string
  transactionDate: string
  currentState: string
  totalAmount: string
  submittedAt?: string | null
  finalApprovedAt?: string | null
}

export type PlpkDashboardMunfiq = {
  id: string
  munfiqCode: string
  name: string
  phone?: string | null
  address?: string | null
  desa?: string | null
  status: string
}

export type PlpkDashboardRow = PlpkDashboardMunfiq | PlpkDashboardTransaction

export function normalizePlpkDashboardRows(payload: PlpkDashboardPayload): PlpkDashboardPayload {
  return {
    ...payload,
    munfiq: payload.munfiq.map((item) => ({ ...item })),
    transactions: payload.transactions.map((item) => ({ ...item })),
  }
}

export type PlpkDashboardPayload = {
  profile: {
    name: string
    phone: string
    plpk: {
      id: string
      code: string
      name: string
      phone: string
      upzis: { name: string; kecamatanName: string }
      ranting: { name: string; desaKelurahanName: string }
    } | null
  }
  summary: {
    totalMunfiq: number
    setoranBulanIni: string
    transaksiPending: number
    transaksiSelesai: number
  }
  munfiq: PlpkDashboardMunfiq[]
  transactions: PlpkDashboardTransaction[]
}
