import { renderHook, act, waitFor } from '@testing-library/react';
import { useExport } from '../useExport';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const mockAddImage = vi.fn();
const mockSave = vi.fn();

vi.mock('html2canvas', () => ({
  default: vi.fn(),
}));

vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(function (this: any) {
    this.addImage = mockAddImage;
    this.save = mockSave;
  }),
}));

describe('useExport', () => {
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 800;
    mockCanvas.height = 600;

    vi.mocked(html2canvas).mockResolvedValue(mockCanvas);

    vi.mocked(jsPDF).mockImplementation(function (this: any) {
      this.addImage = mockAddImage;
      this.save = mockSave;
    } as any);

    document.body.innerHTML = '<div id="test-chart">Test Content</div>';
  });

  it('exports chart as PNG', async () => {
    const { result } = renderHook(() => useExport());

    const clickMock = vi.fn();
    const linkSpy = vi.spyOn(document, 'createElement').mockReturnValue({
      download: '',
      href: '',
      click: clickMock,
    } as unknown as HTMLAnchorElement);

    await act(async () => {
      await result.current.exportChart('test-chart', { format: 'png' });
    });

    await waitFor(() => {
      expect(result.current.isExporting).toBe(false);
    });

    expect(html2canvas).toHaveBeenCalled();
    expect(linkSpy).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalled();

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

    expect(jsPDF).toHaveBeenCalled();
    expect(mockAddImage).toHaveBeenCalled();
    expect(mockSave).toHaveBeenCalled();
  });

  it('sets exporting state correctly', async () => {
    const { result } = renderHook(() => useExport());
    vi.mocked(html2canvas).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockCanvas), 100))
    );

    let exportPromise: Promise<void> | undefined;
    act(() => {
      exportPromise = result.current.exportChart('test-chart', { format: 'png' });
    });

    expect(result.current.isExporting).toBe(true);

    await act(async () => {
      await exportPromise;
    });

    await waitFor(() => {
      expect(result.current.isExporting).toBe(false);
    });
  });

  it('updates export progress', async () => {
    let resolveCanvas!: (val: HTMLCanvasElement) => void;
    const canvasPromise = new Promise<HTMLCanvasElement>((resolve) => {
      resolveCanvas = resolve;
    });

    vi.mocked(html2canvas).mockImplementation(() => canvasPromise);

    const { result } = renderHook(() => useExport());

    let exportPromise: Promise<void> | undefined;
    act(() => {
      exportPromise = result.current.exportChart('test-chart', { format: 'png' });
    });

    expect(result.current.isExporting).toBe(true);
    expect(result.current.exportProgress).toBeGreaterThan(0);

    await act(async () => {
      resolveCanvas(mockCanvas);
      await exportPromise;
    });

    expect(result.current.exportProgress).toBe(0);
  });

  it('handles export errors', async () => {
    const { result } = renderHook(() => useExport());
    vi.mocked(html2canvas).mockRejectedValue(new Error('Export failed'));

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
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      writable: true,
      configurable: true,
    });

    const success = await result.current.copyToClipboard('test text');

    expect(success).toBe(true);
    expect(writeTextMock).toHaveBeenCalledWith('test text');
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

    expect(html2canvas).toHaveBeenCalledTimes(2);
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