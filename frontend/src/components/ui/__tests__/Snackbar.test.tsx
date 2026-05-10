import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Snackbar } from '../Snackbar';

// Mock the SnackbarContext
const mockClose = vi.fn();
const mockContextValue = {
  isOpen: true,
  currentMessage: { id: '1', message: 'Test message', severity: 'info' as const, duration: 4000 },
  close: mockClose,
  show: vi.fn(),
};

vi.mock('../../../contexts/SnackbarContext', () => ({
  useSnackbar: vi.fn(),
}));

import { useSnackbar } from '../../../contexts/SnackbarContext';

describe('Snackbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSnackbar).mockReturnValue(mockContextValue);
  });

  it('renders nothing when isOpen is false', () => {
    vi.mocked(useSnackbar).mockReturnValue({ ...mockContextValue, isOpen: false });
    const { container } = render(<Snackbar />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when currentMessage is null', () => {
    vi.mocked(useSnackbar).mockReturnValue({ ...mockContextValue, currentMessage: null });
    const { container } = render(<Snackbar />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the message when open', () => {
    render(<Snackbar />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders close button with aria-label', () => {
    render(<Snackbar />);
    expect(screen.getByLabelText('Close notification')).toBeInTheDocument();
  });

  it('calls close when close button is clicked', () => {
    render(<Snackbar />);
    fireEvent.click(screen.getByLabelText('Close notification'));
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('renders success icon for success severity', () => {
    vi.mocked(useSnackbar).mockReturnValue({
      ...mockContextValue,
      currentMessage: { id: '1', message: 'OK', severity: 'success', duration: 4000 },
    });
    render(<Snackbar />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('renders error icon for error severity', () => {
    vi.mocked(useSnackbar).mockReturnValue({
      ...mockContextValue,
      currentMessage: { id: '1', message: 'Fail', severity: 'error', duration: 4000 },
    });
    render(<Snackbar />);
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('renders warning icon for warning severity', () => {
    vi.mocked(useSnackbar).mockReturnValue({
      ...mockContextValue,
      currentMessage: { id: '1', message: 'Warn', severity: 'warning', duration: 4000 },
    });
    render(<Snackbar />);
    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  it('renders info icon for info severity', () => {
    render(<Snackbar />);
    expect(screen.getByText('ℹ')).toBeInTheDocument();
  });

  it('calls close when Escape key is pressed', () => {
    render(<Snackbar />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('does not call close for non-Escape keys', () => {
    render(<Snackbar />);
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(mockClose).not.toHaveBeenCalled();
  });
});
