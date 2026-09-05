'use client';

import { useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';

export type MunfiqDocumentType = 'ktp' | 'member-card' | 'family-card' | 'other';

export interface ExtractedMunfiqField {
  key: string;
  label: string;
  value: string;
  status: 'clear' | 'review' | 'missing';
  source: MunfiqDocumentType;
}

export interface MunfiqScanResult {
  documentType: MunfiqDocumentType;
  fields: ExtractedMunfiqField[];
  scannedAt: string;
}

interface DocumentScanStepProps {
  onScanComplete: (result: MunfiqScanResult) => void;
}

export function DocumentScanStep({ onScanComplete }: DocumentScanStepProps) {
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const [documentType, setDocumentType] = useState<MunfiqDocumentType>('ktp');
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanStage, setScanStage] = useState(0);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('Ukuran file maksimal 10 MB');
      return;
    }
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  };

  const handleClear = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setScanning(false);
    setScanStage(0);
  };

  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === 'dragenter' || event.type === 'dragover') setDragActive(true);
    else if (event.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      handleFileSelect(event.dataTransfer.files[0]);
    }
  };

  const handleScan = () => {
    setScanning(true);
    setScanStage(1);

    // Simulate scan progress
    setTimeout(() => setScanStage(2), 600);
    setTimeout(() => setScanStage(3), 1200);
    setTimeout(() => {
      // Mock result
      const mockResult: MunfiqScanResult = {
        documentType,
        scannedAt: new Date().toISOString(),
        fields: [
          { key: 'name', label: 'Nama Lengkap', value: 'Desandi Herdiansyah', status: 'clear', source: documentType },
          { key: 'nik', label: 'Nomor Identitas', value: '3205********1234', status: 'clear', source: documentType },
          { key: 'kecamatan', label: 'Kecamatan', value: 'Cikajang', status: 'clear', source: documentType },
          { key: 'village', label: 'Desa/Kelurahan', value: 'Cikajang', status: 'review', source: documentType },
          { key: 'address', label: 'Alamat', value: 'Jl. Cikajang, Kabupaten Garut', status: 'clear', source: documentType },
          { key: 'phone', label: 'Nomor HP', value: '', status: 'missing', source: documentType },
        ]
      };

      onScanComplete(mockResult);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    }, 1800);
  };

  return (
    <>
      <div className="mqw-field">
        <label className="mqw-label" htmlFor="mqw-doc-type">Jenis Dokumen</label>
        <select
          id="mqw-doc-type"
          className="mqw-input"
          value={documentType}
          onChange={(event) => setDocumentType(event.target.value as MunfiqDocumentType)}
          disabled={scanning}
        >
          <option value="ktp">KTP</option>
          <option value="member-card">KTA / Kartu Anggota</option>
          <option value="family-card">Kartu Keluarga</option>
          <option value="other">Dokumen Lainnya</option>
        </select>
      </div>

      <div className="mqw-scan-aside">
        {!file ? (
          <div
            className={dragActive ? 'mqw-drop is-active' : 'mqw-drop'}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="mqw-document-upload"
              onChange={(event) => { if (event.target.files && event.target.files[0]) handleFileSelect(event.target.files[0]); }}
              accept="image/jpeg,image/png,application/pdf"
              aria-label="Unggah atau foto dokumen"
            />
            <span className="mqw-drop-icon" aria-hidden="true"><Camera size={22} /></span>
            <span className="mqw-drop-title">Foto atau unggah dokumen</span>
            <p className="mqw-drop-note">Pastikan tulisan terlihat jelas dan tidak terpotong. Maksimal 10 MB.</p>
          </div>
        ) : (
          <div className="mqw-preview">
            <div className="mqw-preview-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl!} alt="Pratinjau dokumen" className={scanning ? 'is-scanning' : undefined} />
              {scanning && (
                <div className="mqw-scanning">
                  <div className="mqw-scan-track">
                    <i style={{ width: `${(scanStage / 3) * 100}%` }} role="progressbar" aria-valuenow={scanStage} aria-valuemin={0} aria-valuemax={3} aria-label="Progres pemindaian" />
                  </div>
                  <span className="mqw-scan-label">
                    {scanStage === 1 && 'Memeriksa kualitas dokumen…'}
                    {scanStage === 2 && 'Membaca informasi identitas…'}
                    {scanStage === 3 && 'Mencocokkan wilayah…'}
                  </span>
                  <div className="mqw-scanline" aria-hidden="true" />
                </div>
              )}
            </div>

            {!scanning && (
              <div className="mqw-preview-actions">
                <button type="button" onClick={handleScan} className="mqw-btn mqw-btn-primary">Pindai Sekarang</button>
                <button type="button" onClick={() => replaceInputRef.current?.click()} className="mqw-btn mqw-btn-quiet">Ganti</button>
                <input
                  ref={replaceInputRef}
                  type="file"
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                  onChange={(event) => {
                    if (event.target.files && event.target.files[0]) {
                      handleClear();
                      handleFileSelect(event.target.files[0]);
                    }
                    event.target.value = '';
                  }}
                  accept="image/jpeg,image/png,application/pdf"
                />
                <button type="button" onClick={handleClear} className="mqw-btn mqw-btn-quiet">
                  <Trash2 size={16} aria-hidden="true" />Hapus
                </button>
              </div>
            )}
          </div>
        )}

        <ul className="mqw-tips">
          <li>Gunakan pencahayaan yang cukup.</li>
          <li>Posisikan dokumen rata dan pas di dalam bingkai.</li>
          <li>Pastikan nama dan alamat terbaca jelas.</li>
        </ul>
      </div>
    </>
  );
}
