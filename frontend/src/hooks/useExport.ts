import { useState, useCallback } from 'react';

export type ExportFormat = 'png' | 'svg' | 'pdf' | 'csv';

export interface ExportOptions {
  format: ExportFormat;
  quality?: number;
  filename?: string;
  includeTitle?: boolean;
  includeLegend?: boolean;
  backgroundColor?: string;
}

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const exportChart = useCallback(async (
    elementId: string,
    options: ExportOptions = { format: 'png' }
  ): Promise<void> => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Element not found');
      }

      setExportProgress(20);

      const format = options.format;
      const filename = options.filename || `chart-export-${Date.now()}`;

      if (format === 'png' || format === 'svg') {
        setExportProgress(40);

        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(element, {
          backgroundColor: options.backgroundColor || '#ffffff',
          scale: (options.quality || 1) * 2,
          logging: false,
        });

        setExportProgress(80);

        const dataUrl = canvas.toDataURL(`image/${format}`);
        const link = document.createElement('a');
        link.download = `${filename}.${format}`;
        link.href = dataUrl;
        link.click();
      } else if (format === 'pdf') {
        setExportProgress(40);

        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(element, {
          backgroundColor: options.backgroundColor || '#ffffff',
          scale: 2,
          logging: false,
        });

        setExportProgress(60);

        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height],
        });

        setExportProgress(80);

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${filename}.pdf`);
      } else if (format === 'csv') {
        setExportProgress(60);

        const data = extractChartData(element);
        const csv = convertToCSV(data);
        downloadCSV(csv, `${filename}.csv`);
      }

      setExportProgress(100);
    } catch (error) {
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, []);

  const exportMultiple = useCallback(async (
    elements: Array<{ id: string; options?: ExportOptions }>
  ): Promise<void> => {
    setIsExporting(true);
    setExportProgress(0);

    const total = elements.length;

    try {
      for (let i = 0; i < total; i++) {
        const { id, options } = elements[i];
        await exportChart(id, options || { format: 'png' });
        setExportProgress(Math.round(((i + 1) / total) * 100));
      }
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [exportChart]);

  const generateShareUrl = useCallback((
    currentUrl: string,
    params: Record<string, string>
  ): string => {
    const url = new URL(currentUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return url.toString();
  }, []);

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    isExporting,
    exportProgress,
    exportChart,
    exportMultiple,
    generateShareUrl,
    copyToClipboard,
  };
}

function extractChartData(element: HTMLElement): Array<Record<string, string>> {
  const data: Array<Record<string, string>> = [];

  const table = element.querySelector('table');
  if (table) {
    const headers = Array.from(table.querySelectorAll('th')).map((th) => th.textContent?.trim() || '');
    const rows = table.querySelectorAll('tbody tr');

    rows.forEach((row) => {
      const cells = Array.from(row.querySelectorAll('td'));
      const rowData: Record<string, string> = {};

      cells.forEach((cell, index) => {
        if (headers[index]) {
          rowData[headers[index]] = cell.textContent?.trim() || '';
        }
      });

      if (Object.keys(rowData).length > 0) {
        data.push(rowData);
      }
    });
  }

  return data;
}

function convertToCSV(data: Array<Record<string, string>>): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const headerRow = headers.join(',');
  const dataRows = data.map((row) =>
    headers.map((header) => {
      const value = row[header] || '';
      return `"${value.replace(/"/g, '""')}"`;
    }).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}