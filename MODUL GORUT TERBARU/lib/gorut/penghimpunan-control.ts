'use client'

import { createCollectionClient, createSingletonClient } from '@/services/api/record-client'
import type { KordesUpzisRow, MunfiqPlpkRow, PlpkKordesRow, UpzisPcRow } from '@/lib/gorut/penghimpunan-dummy'
import { kordesUpzisRows, munfiqPlpkRows, plpkKordesRows, upzisPcRows } from '@/lib/gorut/penghimpunan-dummy'

export type PenghimpunanVerificationState = {
  plpkKordesVerifiedIds: string[]
  kordesUpzisVerifiedIds: string[]
  upzisPcVerifiedIds: string[]
}

const defaultVerificationState: PenghimpunanVerificationState = {
  plpkKordesVerifiedIds: ['1', '2', '3', '5'],
  kordesUpzisVerifiedIds: ['1', '2', '3'],
  upzisPcVerifiedIds: ['1', '2', '3'],
}

export const GORUT_PENGHIMPUNAN_VERIFICATION_EVENT = 'gorut-penghimpunan-verification-updated'
export const GORUT_MUNFIQ_PLPK_EVENT = 'gorut-munfiq-plpk-updated'
export const GORUT_PLPK_KORDES_EVENT = 'gorut-plpk-kordes-updated'
export const GORUT_KORDES_UPZIS_EVENT = 'gorut-kordes-upzis-updated'
export const GORUT_UPZIS_PC_EVENT = 'gorut-upzis-pc-updated'

const penghimpunanVerificationClient = createSingletonClient<PenghimpunanVerificationState>({
  scope: 'gorut-penghimpunan-verification',
  defaultValue: defaultVerificationState,
  eventName: GORUT_PENGHIMPUNAN_VERIFICATION_EVENT,
})

const munfiqPlpkClient = createCollectionClient<MunfiqPlpkRow>({
  scope: 'gorut-munfiq-plpk',
  defaultItems: munfiqPlpkRows,
  eventName: GORUT_MUNFIQ_PLPK_EVENT,
  sort: (items) => [...items].sort((a, b) => a.kodeMunfiq.localeCompare(b.kodeMunfiq)),
})

const plpkKordesClient = createCollectionClient<PlpkKordesRow>({
  scope: 'gorut-plpk-kordes',
  defaultItems: plpkKordesRows,
  eventName: GORUT_PLPK_KORDES_EVENT,
  sort: (items) => [...items].sort((a, b) => a.plpkCode.localeCompare(b.plpkCode)),
})

const kordesUpzisClient = createCollectionClient<KordesUpzisRow>({
  scope: 'gorut-kordes-upzis',
  defaultItems: kordesUpzisRows,
  eventName: GORUT_KORDES_UPZIS_EVENT,
  sort: (items) => [...items].sort((a, b) => a.rantingCode.localeCompare(b.rantingCode)),
})

const upzisPcClient = createCollectionClient<UpzisPcRow>({
  scope: 'gorut-upzis-pc',
  defaultItems: upzisPcRows,
  eventName: GORUT_UPZIS_PC_EVENT,
  sort: (items) => [...items].sort((a, b) => a.upzisCode.localeCompare(b.upzisCode)),
})

export function useGorutPenghimpunanVerificationState() {
  return penghimpunanVerificationClient.useValue()
}

export function readGorutPenghimpunanVerificationState() {
  return penghimpunanVerificationClient.readValueSync()
}

export async function writeGorutPenghimpunanVerificationState(value: PenghimpunanVerificationState) {
  return penghimpunanVerificationClient.writeValue(value)
}

export function useGorutMunfiqPlpkRows() {
  return munfiqPlpkClient.useItems()
}

export function useGorutPlpkKordesRows() {
  return plpkKordesClient.useItems()
}

export function useGorutKordesUpzisRows() {
  return kordesUpzisClient.useItems()
}

export function useGorutUpzisPcRows() {
  return upzisPcClient.useItems()
}

export async function writeGorutMunfiqPlpkRows(items: MunfiqPlpkRow[]) {
  return munfiqPlpkClient.writeItems(items)
}

export async function writeGorutPlpkKordesRows(items: PlpkKordesRow[]) {
  return plpkKordesClient.writeItems(items)
}

export async function writeGorutKordesUpzisRows(items: KordesUpzisRow[]) {
  return kordesUpzisClient.writeItems(items)
}

export async function writeGorutUpzisPcRows(items: UpzisPcRow[]) {
  return upzisPcClient.writeItems(items)
}
