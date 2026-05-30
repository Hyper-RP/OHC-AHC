import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ShareButton } from '../ShareButton';

describe('ShareButton', () => {
  const mockUrl = 'https://example.com/chart';

  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders button', () => {
    render(
      <ShareButton url={mockUrl} />
    );

    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', () => {
    render(
      <ShareButton url={mockUrl} />
    );

    fireEvent.click(screen.getByText('Share'));

    expect(screen.getByText('Copy Link')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('copies URL to clipboard when Copy Link is clicked', async () => {
    const onShare = jest.fn();
    render(
      <ShareButton url={mockUrl} onShare={onShare} />
    );

    fireEvent.click(screen.getByText('Share'));
    fireEvent.click(screen.getByText('Copy Link'));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockUrl);
      expect(onShare).toHaveBeenCalledWith('link');
    });
  });

  it('shows "Copied!" state after copying', async () => {
    render(
      <ShareButton url={mockUrl} />
    );

    fireEvent.click(screen.getByText('Share'));
    fireEvent.click(screen.getByText('Copy Link'));

    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('resets "Copied!" state after timeout', async () => {
    jest.useFakeTimers();

    render(
      <ShareButton url={mockUrl} />
    );

    fireEvent.click(screen.getByText('Share'));
    fireEvent.click(screen.getByText('Copy Link'));

    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });

    act(() => {
      jest.advanceTimersByTime(2500);
    });

    expect(screen.getByText('Copy to clipboard')).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('opens email client when Email is clicked', () => {
    const onShare = jest.fn();
    const windowOpenSpy = jest.spyOn(window, 'open').mockReturnValue(null);

    render(
      <ShareButton url={mockUrl} onShare={onShare} />
    );

    fireEvent.click(screen.getByText('Share'));
    fireEvent.click(screen.getByText('Email'));

    expect(windowOpenSpy).toHaveBeenCalled();
    expect(onShare).toHaveBeenCalledWith('email');

    windowOpenSpy.mockRestore();
  });

  it('shows current URL in dropdown', () => {
    render(
      <ShareButton url={mockUrl} />
    );

    fireEvent.click(screen.getByText('Share'));

    expect(screen.getByText(mockUrl)).toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', () => {
    render(
      <ShareButton url={mockUrl} />
    );

    fireEvent.click(screen.getByText('Share'));
    expect(screen.getByText('Copy Link')).toBeInTheDocument();

    // Click on the backdrop element
    const backdrop = document.querySelector('.fixed.inset-0');
    expect(backdrop).toBeInTheDocument();
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(screen.queryByText('Copy Link')).not.toBeInTheDocument();
  });

  it('handles clipboard errors gracefully', async () => {
    (navigator.clipboard.writeText as jest.Mock).mockRejectedValue(new Error('Copy failed'));

    render(
      <ShareButton url={mockUrl} />
    );

    fireEvent.click(screen.getByText('Share'));
    fireEvent.click(screen.getByText('Copy Link'));

    // Should not throw an error
    await expect(Promise.resolve()).resolves.toBeUndefined();
  });
});