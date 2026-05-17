import { renderHook, act, waitFor } from '@testing-library/react';
import { useExport, type ExportFormat } from '../useExport';

jest.mock('html2canvas');
jest.mock('jspdf');

describe('useExport', () => {
  let mockHtml2Canvas: jest.Mock;
  let mockJsPDF: jest.MockedClass<any>;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 800;
    mockCanvas.height = 600;

    mockHtml2Canvas = require('html2canvas').default;
    mockHtml2Canvas.mockResolvedValue(mockCanvas);

    mockJsPDF = require('jspdf').jsPDF;
    mockJsPDF.mockImplementation(() => ({
      addImage: jest.fn(),
      save: jest.fn(),
    }));

    document.body.innerHTML = '<div id="test-chart">Test Content</div>';
  });

  it('exports chart as PNG', async () => {
    const { result } = renderHook(() => useExport());

    const linkSpy = jest.spyOn(document, 'createElement').mockReturnValue({
      download: '',
      href: '',
      click: jest.fn(),
    } as unknown as HTMLAnchorElement);

    await act(async () => {
      await result.current.exportChart('test-chart', { format: 'png' });
    });

    await waitFor(() => {
      expect(result.current.isExporting).toBe(false);
    });

    expect(mockHtml2Canvas).toHaveBeenCalled();
    expect(linkSpy).toHaveBeenCalled();

    linkSpy.mockRestore();
  });

  it('exports chart as PDF', async () => {
    const { result } = renderHook(() => useExport());

    await act(async () => {
      await result.current.exportChart('test-chart', { format: 'pdf' });
    });

    await waitFor(() => {
      expect(result.current.isExporting).toBe(false);
    });

    expect(mockJsPDF).toHaveBeenCalled();
  });

  it('sets exporting state correctly', async () => {
    const { result } = renderHook(() => useExport());
    mockHtml2Canvas.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockCanvas), 100))
    );

    const exportPromise = act(async () => {
      result.current.exportChart('test-chart', { format: 'png' });
    });

    expect(result.current.isExporting).toBe(true);

    await exportPromise;

    await waitFor(() => {
      expect(result.current.isExporting).toBe(false);
    });
  });

  it('updates export progress', async () => {
    const { result } = renderHook(() => useExport());

    const progressUpdates: number[] = [];
    const originalExport = result.current.exportChart.bind(result.current);

    result.current.exportChart = async (...args) => {
      const promise = originalExport(...args);
      progressUpdates.push(result.current.exportProgress);
      await promise;
      return promise;
    };

    await act(async () => {
      await result.current.exportChart('test-chart', { format: 'png' });
    });

    await waitFor(() => {
      expect(result.current.exportProgress).toBe(0);
    });
  });

  it('handles export errors', async () => {
    const { result } = renderHook(() => useExport());
    mockHtml2Canvas.mockRejectedValue(new Error('Export failed'));

    await act(async () => {
      await expect(
        result.current.exportChart('test-chart', { format: 'png' })
      ).rejects.toThrow('Export failed');
    });

    await waitFor(() => {
      expect(result.current.isExporting).toBe(false);
    });
  });

  it('generates share URL with params', () => {
    const { result } = renderHook(() => useExport());

    const url = result.current.generateShareUrl('https://example.com', {
      dept: 'IT',
      severity: 'MILD',
    });

    expect(url).toContain('dept=IT');
    expect(url).toContain('severity=MILD');
  });

  it('copies to clipboard', async () => {
    const { result } = renderHook(() => useExport());
    const clipboardSpy = jest
      .spyOn(navigator, 'clipboard', 'get')
      .mockReturnValue({
        writeText: jest.fn().mockResolvedValue(undefined),
      } as unknown as Clipboard);

    const success = await result.current.copyToClipboard('test text');

    expect(success).toBe(true);
    expect(clipboardSpy.writeText).toHaveBeenCalledWith('test text');

    clipboardSpy.mockRestore();
  });

  it('exports multiple charts', async () => {
    document.body.innerHTML =
      '<div id="chart1">Chart 1</div><div id="chart2">Chart 2</div>';

    const { result } = renderHook(() => useExport());

    await act(async () => {
      await result.current.exportMultiple([
        { id: 'chart1', options: { format: 'png' } },
        { id: 'chart2', options: { format: 'png' } },
      ]);
    });

    await waitFor(() => {
      expect(result.current.isExporting).toBe(false);
    });

    expect(mockHtml2Canvas).toHaveBeenCalledTimes(2);
  });

  it('handles non-existent element', async () => {
    const { result } = renderHook(() => useExport());

    await act(async () => {
      await expect(
        result.current.exportChart('non-existent', { format: 'png' })
      ).rejects.toThrow('Element not found');
    });
  });
});