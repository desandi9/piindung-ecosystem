type ReportSummaryItem = {
  label: string
  value: string
}

type ReportTable = {
  title: string
  columns: string[]
  rows: string[][]
}

type ReportOptions = {
  title: string
  subtitle?: string
  fileName?: string
  summary?: ReportSummaryItem[]
  tables?: ReportTable[]
  notes?: string[]
}

type SpreadsheetOptions = {
  fileName: string
  rows: string[][]
  format?: 'xlsx' | 'csv'
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function exportReportToPdf(options: ReportOptions) {
  if (typeof window === 'undefined') return false

  const generatedAt = new Date().toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const summaryHtml = options.summary?.length
    ? `<section class="summary-grid">${options.summary
        .map(
          (item) => `<div class="summary-card"><div class="summary-label">${escapeHtml(item.label)}</div><div class="summary-value">${escapeHtml(item.value)}</div></div>`,
        )
        .join('')}</section>`
    : ''

  const tablesHtml = options.tables?.length
    ? options.tables
        .map(
          (table) => `
          <section class="table-section">
            <h2>${escapeHtml(table.title)}</h2>
            <table>
              <thead><tr>${table.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}</tr></thead>
              <tbody>
                ${table.rows
                  .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
                  .join('')}
              </tbody>
            </table>
          </section>`,
        )
        .join('')
    : ''

  const notesHtml = options.notes?.length
    ? `<section class="notes"><h2>Catatan</h2><ul>${options.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join('')}</ul></section>`
    : ''

  const html = `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(options.fileName ?? options.title)}</title>
        <style>
          :root { color-scheme: light; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #0f172a; background: #ffffff; }
          .page { padding: 32px; }
          .header { border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 24px; }
          .title { margin: 0; font-size: 28px; font-weight: 800; }
          .subtitle { margin: 8px 0 0; color: #475569; font-size: 14px; }
          .meta { margin-top: 8px; color: #64748b; font-size: 12px; }
          .summary-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 24px; }
          .summary-card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px; }
          .summary-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
          .summary-value { margin-top: 6px; font-size: 18px; font-weight: 700; }
          .table-section { margin-top: 24px; }
          .table-section h2, .notes h2 { margin: 0 0 12px; font-size: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; vertical-align: top; }
          th { background: #f1f5f9; font-weight: 700; }
          .notes { margin-top: 24px; font-size: 12px; color: #475569; }
          .notes ul { margin: 8px 0 0; padding-left: 18px; }
          @media print {
            .page { padding: 18px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <main class="page">
          <header class="header">
            <h1 class="title">${escapeHtml(options.title)}</h1>
            ${options.subtitle ? `<p class="subtitle">${escapeHtml(options.subtitle)}</p>` : ''}
            <p class="meta">Generated at ${escapeHtml(generatedAt)}</p>
          </header>
          ${summaryHtml}
          ${tablesHtml}
          ${notesHtml}
        </main>
      </body>
    </html>
  `

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.setAttribute('aria-hidden', 'true')
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc || !iframe.contentWindow) {
    iframe.remove()
    return false
  }

  doc.open()
  doc.write(html)
  doc.close()

  const cleanup = () => {
    window.setTimeout(() => {
      iframe.remove()
    }, 1500)
  }

  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } finally {
      cleanup()
    }
  }

  window.setTimeout(triggerPrint, 600)

  return true
}

export function exportRowsToSpreadsheet(options: SpreadsheetOptions) {
  if (typeof window === 'undefined') return false

  const worksheet = XLSX.utils.aoa_to_sheet(options.rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')

  const format = options.format ?? (options.fileName.toLowerCase().endsWith('.csv') ? 'csv' : 'xlsx')
  const finalName =
    format === 'csv'
      ? options.fileName.replace(/\.(xlsx|csv)$/i, '') + '.csv'
      : options.fileName.replace(/\.(xlsx|csv)$/i, '') + '.xlsx'

  XLSX.writeFile(workbook, finalName, {
    bookType: format,
    compression: true,
  })

  return true
}
import * as XLSX from 'xlsx'
