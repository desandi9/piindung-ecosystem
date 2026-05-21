import type { AppRole } from '@/types/auth'
import type { ApprovalAction, ApprovalStatus, ApprovalStep, ApprovalTransaction, Transaction } from '@/lib/gorut/types'

export const gorutWorkflowStepMeta: Record<ApprovalStep, { label: string; order: number }> = {
  plpk: { label: 'Input PLPK', order: 1 },
  ranting: { label: 'Verifikasi Ranting', order: 2 },
  upzis: { label: 'Verifikasi UPZIS', order: 3 },
  pc: { label: 'Rekap PC', order: 4 },
}

export function getGorutWorkflowStepLabel(step: ApprovalStep) {
  return gorutWorkflowStepMeta[step].label
}

const gorutApprovalActorsByStep: Record<ApprovalStep, AppRole[]> = {
  plpk: ['super_admin_pc', 'admin_pc', 'admin_kordes'],
  ranting: ['super_admin_pc', 'admin_pc', 'admin_kordes'],
  upzis: ['super_admin_pc', 'admin_pc', 'admin_upzis'],
  pc: ['super_admin_pc', 'admin_pc'],
}

export function getGorutRoleLabel(role?: AppRole | null) {
  if (role === 'super_admin_pc') return 'Super Admin PC'
  if (role === 'admin_pc') return 'Admin PC'
  if (role === 'admin_upzis') return 'Admin UPZIS'
  if (role === 'admin_kordes') return 'Admin Kordes / Ranting'
  return 'Petugas GORUT'
}

export function canRoleProcessApprovalStep(role: AppRole | null | undefined, step: ApprovalStep) {
  if (!role) return false
  return gorutApprovalActorsByStep[step].includes(role)
}

export function canRoleProcessValidation(role: AppRole | null | undefined) {
  return role === 'super_admin_pc' || role === 'admin_pc' || role === 'admin_upzis'
}

export function getAllowedRoleLabelsForApprovalStep(step: ApprovalStep) {
  return gorutApprovalActorsByStep[step].map((role) => getGorutRoleLabel(role)).join(', ')
}

export function transitionApprovalTransaction(
  transaction: ApprovalTransaction,
  actionType: 'approve' | 'reject',
  actorName: string,
  actorRole: AppRole | null | undefined,
  notes?: string
) {
  const validatorRole = getGorutRoleLabel(actorRole)
  const action: ApprovalAction = {
    step: transaction.currentStep,
    status: actionType === 'approve' ? 'approved' : 'rejected',
    validator: actorName,
    validatorRole,
    timestamp: new Date().toISOString(),
    notes:
      notes ||
      (actionType === 'approve'
        ? `${getGorutWorkflowStepLabel(transaction.currentStep)} disetujui dan diteruskan.`
        : `${getGorutWorkflowStepLabel(transaction.currentStep)} ditolak untuk revisi.`),
  }

  if (actionType === 'reject') {
    return {
      ...transaction,
      overallStatus: 'rejected' as const,
      approvalHistory: [...transaction.approvalHistory, action],
    }
  }

  const nextStepMap: Record<ApprovalStep, ApprovalStep> = {
    plpk: 'ranting',
    ranting: 'upzis',
    upzis: 'pc',
    pc: 'pc',
  }

  const isFinal = transaction.currentStep === 'pc'

  return {
    ...transaction,
    currentStep: isFinal ? 'pc' : nextStepMap[transaction.currentStep],
    overallStatus: isFinal ? ('approved' as const) : ('pending' as const),
    approvalHistory: [...transaction.approvalHistory, action],
  }
}

export function getGorutWorkflowStatusMetaFromApproval(transaction: Pick<ApprovalTransaction, 'currentStep' | 'overallStatus'>) {
  if (transaction.overallStatus === 'approved') {
    return {
      label: 'SELESAI',
      tone: 'success' as const,
    }
  }

  if (transaction.overallStatus === 'rejected') {
    return {
      label: `PERLU REVISI ${getGorutWorkflowStepLabel(transaction.currentStep).toUpperCase()}`,
      tone: 'destructive' as const,
    }
  }

  if (transaction.currentStep === 'plpk') {
    return {
      label: 'INPUT PLPK',
      tone: 'warning' as const,
    }
  }

  if (transaction.currentStep === 'ranting') {
    return {
      label: 'MENUNGGU VERIFIKASI RANTING',
      tone: 'warning' as const,
    }
  }

  if (transaction.currentStep === 'upzis') {
    return {
      label: 'MENUNGGU VERIFIKASI UPZIS',
      tone: 'info' as const,
    }
  }

  return {
    label: 'MASUK REKAP PC',
    tone: 'info' as const,
  }
}

export function getLegacyApprovalStatusMeta(status: ApprovalStatus) {
  if (status === 'approved') {
    return { label: 'Approved', tone: 'success' as const }
  }

  if (status === 'rejected') {
    return { label: 'Rejected', tone: 'destructive' as const }
  }

  return { label: 'Pending', tone: 'warning' as const }
}

export function getGorutWorkflowStatusMetaFromTransaction(
  transaction: Pick<Transaction, 'status'>,
  approvalTransaction?: Pick<ApprovalTransaction, 'currentStep' | 'overallStatus'> | null
) {
  if (approvalTransaction) {
    return getGorutWorkflowStatusMetaFromApproval(approvalTransaction)
  }

  if (transaction.status === 'valid') {
    return { label: 'SELESAI', tone: 'success' as const }
  }

  if (transaction.status === 'invalid') {
    return { label: 'PERLU REVISI VALIDASI', tone: 'destructive' as const }
  }

  return { label: 'MENUNGGU VALIDASI ADMIN', tone: 'warning' as const }
}
