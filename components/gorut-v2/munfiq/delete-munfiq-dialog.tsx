'use client';

import type { GorutMunfiq } from '@/features/gorut-v2/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function DeleteMunfiqDialog({ munfiq, onClose, onConfirm }: { munfiq: GorutMunfiq | null; onClose: () => void; onConfirm: () => void }) {
  return <Dialog open={Boolean(munfiq)} onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="gorut-dialog-surface is-delete" aria-describedby="delete-description"><DialogHeader className="gorut-dialog-header"><DialogTitle>Hapus data Munfiq?</DialogTitle><DialogDescription id="delete-description">Anda yakin ingin menghapus data munfiq <strong>{munfiq?.name}</strong> ({munfiq?.memberId})?</DialogDescription><p className="gorut-delete-warning">Peringatan: Perubahan status data dilakukan pada state lokal dan akan hilang jika halaman dimuat ulang.</p></DialogHeader><DialogFooter className="gorut-dialog-footer"><button type="button" className="gorut-button gorut-secondary-button" onClick={onClose}>Batal</button><button type="button" className="gorut-button gorut-danger-button" onClick={onConfirm}>Hapus</button></DialogFooter></DialogContent></Dialog>;
}
