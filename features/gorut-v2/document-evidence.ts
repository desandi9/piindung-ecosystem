import type { KordesVillageRecap } from './types';

/** Verification alone is not evidence of a Ranting → UPZIS handover. */
export function hasF015HandoverEvidence(recap: KordesVillageRecap) {
  return recap.plpkRows.length > 0
    && recap.plpkRows.every((row) => row.status === 'verified-by-kordes'
      && row.period === recap.period && row.village === recap.village && row.kecamatan === recap.kecamatan)
    && recap.f015Status === 'handed-to-upzis'
    && Boolean(recap.handedToUpzisAt && Number.isFinite(Date.parse(recap.handedToUpzisAt)))
    && Boolean(recap.handoverDate && Number.isFinite(Date.parse(recap.handoverDate)))
    && Boolean(recap.f015Number.trim() && recap.kordesName.trim() && recap.upzisOfficerName.trim());
}
