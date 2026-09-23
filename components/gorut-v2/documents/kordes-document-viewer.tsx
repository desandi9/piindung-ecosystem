'use client';

import { buildF010DocumentRequest, buildF015DocumentRequest } from '@/features/gorut-v2/document-data';
import type { CollectionBatch, KordesVillageRecap } from '@/features/gorut-v2/types';

import { GorutPdfViewer } from './gorut-pdf-viewer';
import { F010HtmlFallback, F015HtmlFallback } from './gorut-html-fallback';

export function KordesDocumentViewer({
  documentType,
  recap,
  batches,
  canPrint = true,
  onClose,
}: {
  documentType: 'f010' | 'f015';
  recap: KordesVillageRecap | null;
  batches: CollectionBatch[];
  canPrint?: boolean;
  onClose: () => void;
}) {
  const request = recap
    ? documentType === 'f010'
      ? buildF010DocumentRequest(recap, batches)
      : buildF015DocumentRequest(recap, batches)
    : null;
  return (
    <GorutPdfViewer
      request={request}
      title={`Preview ${documentType === 'f010' ? 'F.010' : 'F.015'}`}
      canPrint={canPrint}
      fallback={recap ? documentType === 'f010' ? <F010HtmlFallback recap={recap} batches={batches} /> : <F015HtmlFallback recap={recap} batches={batches} /> : undefined}
      onClose={onClose}
    />
  );
}
