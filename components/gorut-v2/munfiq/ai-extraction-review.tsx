'use client';

import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';

import type { ExtractedMunfiqField } from './document-scan-step';

interface MunfiqScanReviewProps {
  fields: ExtractedMunfiqField[];
  onAccept: () => void;
  onRescan: () => void;
}

const chips: Record<ExtractedMunfiqField['status'], { className: string; label: string }> = {
  clear: { className: 'mqw-chip mqw-chip-ok', label: 'Terbaca jelas' },
  review: { className: 'mqw-chip mqw-chip-review', label: 'Perlu diperiksa' },
  missing: { className: 'mqw-chip mqw-chip-missing', label: 'Belum ditemukan' },
};

export function MunfiqScanReview({ fields, onAccept, onRescan }: MunfiqScanReviewProps) {
  const missingCount = useMemo(() => fields.filter(f => f.status === 'missing').length, [fields]);
  const reviewCount = useMemo(() => fields.filter(f => f.status === 'review').length, [fields]);

  return (
    <>
      <p className="mqw-notice">
        <AlertTriangle size={16} aria-hidden="true" />
        <span>
          {reviewCount > 0 && `${reviewCount} informasi perlu diperiksa. `}
          {missingCount > 0 && `${missingCount} informasi tidak ditemukan. `}
          Anda dapat menyunting atau memperbaikinya di langkah berikutnya.
        </span>
      </p>

      <div className="mqw-scan-aside">
        <div className="mqw-result">
          {fields.map((field) => (
            <div key={field.key} className="mqw-result-row">
              <div>
                <span className="mqw-result-label">{field.label}</span>
                <span className={field.value ? 'mqw-result-value' : 'mqw-result-value is-empty'}>
                  {field.value || 'Tidak ditemukan'}
                </span>
              </div>
              <span className={chips[field.status].className}>{chips[field.status].label}</span>
            </div>
          ))}
        </div>

        <div className="mqw-actions">
          <button type="button" onClick={onAccept} className="mqw-btn mqw-btn-primary">Lanjut Lengkapi Data</button>
          <button type="button" onClick={onRescan} className="mqw-btn mqw-btn-quiet">Pindai Ulang</button>
        </div>
      </div>
    </>
  );
}
