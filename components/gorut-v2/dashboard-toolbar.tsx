'use client';

import { CheckCircle2, ChevronDown, Download, FileSpreadsheet, FileText, MoreHorizontal, Settings2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function DashboardToolbar() {
  const [exportOpen, setExportOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!exportRef.current?.contains(event.target as Node)) setExportOpen(false); };
    document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close);
  }, []);
  return <div className="gorut-toolbar gorut-entrance-toolbar"><div className="gorut-update-status" title="Data diperbarui beberapa detik lalu"><CheckCircle2 size={14} aria-label="Data terbaru" /><span>Data diperbarui beberapa detik lalu</span></div><div className="gorut-toolbar-actions"><button type="button" className="gorut-button gorut-secondary-button"><Settings2 size={14} />Atur Widget</button><button type="button" className="gorut-button gorut-secondary-button"><Upload size={14} />Impor</button><div className="gorut-dropdown" ref={exportRef}><button type="button" className="gorut-button gorut-primary-button" onClick={() => setExportOpen((value) => !value)} aria-expanded={exportOpen} aria-label="Ekspor"><Download size={14} /><span className="gorut-export-label">Ekspor</span><ChevronDown size={12} /></button>{exportOpen ? <div className="gorut-dropdown-menu"><button type="button"><FileText size={14} />Export PDF</button><button type="button"><FileSpreadsheet size={14} />Export Excel</button><button type="button"><FileText size={14} />Export CSV</button></div> : null}</div><div className="gorut-toolbar-overflow"><button type="button" className="gorut-icon-button" onClick={() => setOverflowOpen((value) => !value)} aria-label="Menu toolbar"><MoreHorizontal size={16} /></button>{overflowOpen ? <div className="gorut-dropdown-menu"><button type="button"><Settings2 size={14} />Atur Widget</button><button type="button"><Upload size={14} />Impor</button></div> : null}</div></div></div>;
}
