'use client';

import { Download, MoreHorizontal, Plus, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function MunfiqToolbar({ onCreate, onNotice }: { onCreate: () => void; onNotice: (message: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close); }, []);
  const action = (message: string) => { setOpen(false); onNotice(message); };
  return <div className="gorut-munfiq-toolbar"><div className="gorut-munfiq-toolbar-desktop"><button type="button" className="gorut-button gorut-secondary-button" onClick={() => action('Impor Munfiq siap pada integrasi berikutnya')}><Upload size={14} />Impor</button><button type="button" className="gorut-button gorut-secondary-button" onClick={() => action('Data Munfiq berhasil diekspor')}><Download size={14} />Ekspor</button></div><div className="gorut-munfiq-toolbar-overflow" ref={ref}><button type="button" className="gorut-icon-button" onClick={() => setOpen((value) => !value)} aria-label="Menu impor dan ekspor" aria-expanded={open}><MoreHorizontal size={17} /></button>{open ? <div className="gorut-dropdown-menu"><button type="button" onClick={() => action('Impor Munfiq siap pada integrasi berikutnya')}><Upload size={14} />Impor</button><button type="button" onClick={() => action('Data Munfiq berhasil diekspor')}><Download size={14} />Ekspor</button></div> : null}</div><button type="button" className="gorut-button gorut-primary-button" onClick={onCreate}><Plus size={14} />Tambah Munfiq</button></div>;
}
