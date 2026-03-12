import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

function escapeCsvCell(value: unknown) {
  const s = value == null ? '' : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

export function exportToCsv(filename: string, header: string[], rows: unknown[][]) {
  const csvContent = [header, ...rows]
    .map((cols) => cols.map(escapeCsvCell).join(','))
    .join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

export function exportToXlsx(
  filename: string,
  sheetName: string,
  header: string[],
  rows: unknown[][],
) {
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

