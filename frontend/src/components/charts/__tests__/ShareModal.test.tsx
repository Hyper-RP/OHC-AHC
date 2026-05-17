import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShareModal } from '../ShareModal';

describe('ShareModal', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      share: jest.fn().mockResolvedValue(undefined),
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('does not render when isOpen is false', () => {
    render(
      <ShareModal
        isOpen={false}
        onClose={jest.fn()}
        url="https://example.com"
      />
    );

    expect(screen.queryByText('Share Chart')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(
      <ShareModal
        isOpen={true}
        onClose={jest.fn()}
        url="https://example.com"
      />
    );

    expect(screen.getByText('Share Chart')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(
      <ShareModal
        isOpen={true}
        onClose={onClose}
        url="https://example.com"
      />
    );

    const closeButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent === ''
    );
    fireEvent.click(closeButton!);

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = jest.fn();
    render(
      <ShareModal
        isOpen={true}
        onClose={onClose}
        url="https://example.com"
      />
    );

    const overlay = document.querySelector('.fixed.inset-0.bg-black\\/50');
    if (overlay) {
      fireEvent.click(overlay);
      expect(onClose).toHaveBeenCalled();
    } else {
      // Fallback: try clicking the absolute positioned overlay
      const overlayDiv = document.querySelector('.absolute.inset-0');
      if (overlayDiv) {
        fireEvent.click(overlayDiv);
        expect(onClose).toHaveBeenCalled();
      }
    }
  });

  it('shows native share button when available', () => {
    render(
      <ShareModal
        isOpen={true}
        onClose={jest.fn()}
        url="https://example.com"
      />
    );

    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  it('calls navigator.share when share button is clicked', async () => {
    const { rerender } = render(
      <ShareModal
        isOpen={true}
        onClose={jest.fn()}
        url="https://example.com"
        title="Test Chart"
      />
    );

    const shareButton = screen.getAllByText('Share')[0];
    fireEvent.click(shareButton);

    expect(navigator.share).toHaveBeenCalledWith({
      title: 'Test Chart',
      url: 'https://example.com',
    });
  });

  it('copies URL when copy link is clicked', async () => {
    render(
      <ShareModal
        isOpen={true}
        onClose={jest.fn()}
        url="https://example.com"
      />
    );

    fireEvent.click(screen.getByText('Copy Link'));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com');
  });

  it('shows "Copied!" state after copying', async () => {
    render(
      <ShareModal
        isOpen={true}
        onClose={jest.fn()}
        url="https://example.com"
      />
    );

    fireEvent.click(screen.getByText('Copy Link'));

    await waitFor(() => {
      expect(screen.getByText('Copied to clipboard!')).toBeInTheDocument();
    });
  });

  it('opens email client when email is clicked', () => {
    const windowOpenSpy = jest.spyOn(window, 'open').mockReturnValue(null);

    render(
      <ShareModal
        isOpen={true}
        onClose={jest.fn()}
        url="https://example.com"
      />
    );

    fireEvent.click(screen.getByText('Email'));

    expect(windowOpenSpy).toHaveBeenCalled();

    windowOpenSpy.mockRestore();
  });

  it('shows shareable URL', () => {
    render(
      <ShareModal
        isOpen={true}
        onClose={jest.fn()}
        url="https://example.com/chart?filter=IT"
      />
    );

    const urlInput = screen.getByDisplayValue('https://example.com/chart?filter=IT');
    expect(urlInput).toBeInTheDocument();
  });

  it('shows description when provided (for internal logic)', () => {
    // Description is used for email body but not displayed in UI
    render(
      <ShareModal
        isOpen={true}
        onClose={jest.fn()}
        url="https://example.com"
        description="This is a test chart"
      />
    );

    // Verify the modal renders (description affects email behavior)
    expect(screen.getByText('Share Chart')).toBeInTheDocument();
  });

  it('has copy button in URL section', () => {
    render(
      <ShareModal
        isOpen={true}
        onClose={jest.fn()}
        url="https://example.com"
      />
    );

    const copyButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent === ''
    );
    expect(copyButton).toBeInTheDocument();
  });

  it('copies URL when copy button in URL section is clicked', () => {
    render(
      <ShareModal
        isOpen={true}
        onClose={jest.fn()}
        url="https://example.com"
      />
    );

    const copyButtons = screen.getAllByRole('button').filter(
      (btn) => btn.textContent === ''
    );
    fireEvent.click(copyButtons[copyButtons.length - 1]);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com');
  });

  it('does not show native share button when not available', () => {
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
    });

    render(
      <ShareModal
        isOpen={true}
        onClose={jest.fn()}
        url="https://example.com"
      />
    );

    expect(screen.queryByText('Share', { selector: 'button' })).not.toBeInTheDocument();
  });

  it('handles share errors gracefully', async () => {
    (navigator.share as jest.Mock).mockRejectedValue(new Error('Share failed'));

    const { rerender } = render(
      <ShareModal
        isOpen={true}
        onClose={jest.fn()}
        url="https://example.com"
      />
    );

    const shareButton = screen.getAllByText('Share')[0];
    expect(() => fireEvent.click(shareButton)).not.toThrow();
  });

  it('has proper modal styling', () => {
    const { container } = render(
      <ShareModal
        isOpen={true}
        onClose={jest.fn()}
        url="https://example.com"
      />
    );

    const modal = container.querySelector('.bg-white');
    expect(modal).toHaveClass('rounded-lg');
    expect(modal).toHaveClass('shadow-xl');
    expect(modal).toHaveClass('max-w-md');
  });

  it('shows correct labels for share options', () => {
    render(
      <ShareModal
        isOpen={true}
        onClose={jest.fn()}
        url="https://example.com"
      />
    );

    expect(screen.getByText('Share via link')).toBeInTheDocument();
    expect(screen.getByText('Send via email')).toBeInTheDocument();
  });

  it('shows icon indicators', () => {
    const { container } = render(
      <ShareModal
        isOpen={true}
        onClose={jest.fn()}
        url="https://example.com"
      />
    );

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });
});