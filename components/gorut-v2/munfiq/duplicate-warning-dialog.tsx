'use client';

import { AlertTriangle } from 'lucide-react';

import type { GorutMunfiq } from '@/features/gorut-v2/types';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

interface DuplicateWarningDialogProps {
  open: boolean;
  candidates: GorutMunfiq[];
  onConfirm: () => void;
  onCancel: () => void;
  onViewData: (munfiq: GorutMunfiq) => void;
}

export function DuplicateWarningDialog({ open, candidates, onConfirm, onCancel, onViewData }: DuplicateWarningDialogProps) {
  if (candidates.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent showCloseButton={false} className="mqw-alert" aria-describedby="mqw-dupe-note">
        <span className="mqw-alert-icon" aria-hidden="true"><AlertTriangle size={22} /></span>
        <DialogTitle className="mqw-alert-title">Data serupa ditemukan</DialogTitle>
        <DialogDescription id="mqw-dupe-note" className="mqw-alert-note">
          Kami menemukan data Munfiq dengan informasi yang sangat mirip di dalam sistem.
        </DialogDescription>

        <div className="mqw-dupes">
          {candidates.map((candidate) => (
            <div key={candidate.id} className="mqw-dupe">
              <strong>{candidate.name}</strong>
              <span>HP: {candidate.phone}</span>
              <span>Wilayah: {candidate.kecamatan}, {candidate.village}</span>
              <button type="button" onClick={() => onViewData(candidate)} className="mqw-link">Lihat Data Detail</button>
            </div>
          ))}
        </div>

        <div className="mqw-alert-actions">
          <button type="button" onClick={onCancel} className="mqw-btn mqw-btn-ghost">Batal</button>
          <button type="button" onClick={onConfirm} className="mqw-btn mqw-btn-warn">Tetap Tambahkan</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
