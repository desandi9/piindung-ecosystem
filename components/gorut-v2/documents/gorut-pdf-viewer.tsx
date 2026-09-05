'use client';

import { Download, Printer, RefreshCw, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import type { GorutDocumentRequest } from '@/features/gorut-v2/document-data';
import { canonicalPreviewMode, previewFailureMode } from '@/lib/gorut-documents/preview-policy';

export function GorutPdfViewer({
  request,
  title,
  canPrint,
  fallback,
  onClose,
}: {
  request: GorutDocumentRequest | null;
  title: string;
  canPrint: boolean;
  fallback?: ReactNode;
  onClose: () => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [fallbackReason, setFallbackReason] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!request) return;
    setUrl(null);
    setError('');
    setFallbackReason('');
    const previewMode = canonicalPreviewMode(process.env.GORUT_CANONICAL_PDF_ENABLED, Boolean(fallback));
    if (previewMode !== 'canonical') {
      if (previewMode === 'fallback') setFallbackReason('Preview frontend aktif.');
      else setError('Preview sementara belum tersedia untuk dokumen ini.');
      return;
    }

    const controller = new AbortController();
    let objectUrl = '';
    void (async () => {
      try {
        const response = await fetch('/api/gorut-v2/documents/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
          signal: controller.signal,
        });
        if (!response.ok) {
          const body = await response.json().catch(() => null) as { error?: string; fallbackAllowed?: boolean } | null;
          if (previewFailureMode(body ?? {}, Boolean(fallback)) === 'fallback') {
            setFallbackReason(body?.error ?? 'PDF canonical belum tersedia.');
            return;
          }
          throw new Error(body?.error ?? 'PDF gagal dibuat.');
        }
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch (cause: unknown) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'PDF gagal dibuat.');
      }
    })();
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attempt, fallback, request]);

  useEffect(() => {
    if (!request) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose, request]);

  if (!request) return null;

  return (
    <div className="gorut-pdf-modal" role="dialog" aria-modal="true" aria-label={title}>
      <header className="gorut-pdf-toolbar">
        <div><strong>{title}</strong><span>{fallbackReason ? 'Preview sementara · bukan dokumen resmi' : 'Dokumen resmi · PDF'}</span>{fallbackReason ? <em>Belum tersedia</em> : null}</div>
        <nav aria-label="Aksi dokumen">
          {url ? <a href={url} download={request.filename} aria-label={`Simpan ${title}`}><Download size={17} aria-hidden="true" /><span>Simpan PDF</span></a> : null}
          {url && canPrint ? <button type="button" onClick={() => frame.current?.contentWindow?.print()} aria-label={`Cetak ${title}`}><Printer size={17} aria-hidden="true" /><span>Cetak</span></button> : null}
          {fallbackReason ? <button type="button" disabled aria-label="Simpan PDF belum tersedia"><Download size={17} aria-hidden="true" /><span>Simpan PDF</span></button> : null}
          {fallbackReason && canPrint ? <button type="button" disabled aria-label="Cetak belum tersedia"><Printer size={17} aria-hidden="true" /><span>Cetak</span></button> : null}
          <button type="button" onClick={onClose} aria-label={`Tutup ${title}`}><X size={19} aria-hidden="true" /><span className="gorut-pdf-close-label">Tutup</span></button>
        </nav>
      </header>
      <main className="gorut-pdf-stage">
        {!url && !error && !fallbackReason ? <div className="gorut-pdf-state" role="status"><span className="gorut-pdf-spinner" /><strong>Menyiapkan dokumen resmi…</strong><small>DOCX sedang dikonversi melalui Gotenberg.</small></div> : null}
        {error ? <div className="gorut-pdf-state is-error" role="alert"><strong>{error}</strong><small>Pastikan layanan Gotenberg aktif, lalu coba kembali.</small><button type="button" onClick={() => setAttempt((value) => value + 1)}><RefreshCw size={17} aria-hidden="true" />Coba Lagi</button></div> : null}
        {fallbackReason ? <div className="gorut-html-fallback"><div className="gorut-html-fallback-note" role="note"><strong>Preview sementara — dokumen resmi akan tersedia setelah layanan PDF diaktifkan.</strong><span>Badge “Belum tersedia” berlaku untuk Simpan PDF dan Cetak.</span></div>{fallback}</div> : null}
        {url ? <iframe ref={frame} src={url} title={title} /> : null}
      </main>
    </div>
  );
}
