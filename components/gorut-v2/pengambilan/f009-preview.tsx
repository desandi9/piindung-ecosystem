'use client';

import { GorutPdfViewer } from '@/components/gorut-v2/documents/gorut-pdf-viewer';
import { F009HtmlFallback } from '@/components/gorut-v2/documents/gorut-html-fallback';
import { buildF009DocumentRequest } from '@/features/gorut-v2/document-data';
import type { CollectionBatch } from '@/features/gorut-v2/types';

export function F009Preview({
  batch,
  canPrint = true,
  onClose,
}: {
  batch: CollectionBatch | null;
  canPrint?: boolean;
  onClose: () => void;
}) {
  return (
    <GorutPdfViewer
      request={batch ? buildF009DocumentRequest(batch) : null}
      title="Preview F.009"
      canPrint={canPrint}
      fallback={batch ? <F009HtmlFallback batch={batch} /> : undefined}
      onClose={onClose}
    />
  );
}
