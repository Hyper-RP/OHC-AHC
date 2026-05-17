import { render, screen, fireEvent } from '@testing-library/react';
import { ZoomControls } from '../ZoomControls';

describe('ZoomControls', () => {
  it('renders all buttons', () => {
    render(<ZoomControls />);

    // Buttons are rendered with icons, not text names
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('shows zoom level when showZoomLevel is true', () => {
    render(<ZoomControls zoomLevel={150} showZoomLevel={true} />);

    expect(screen.getByText('150%')).toBeInTheDocument();
  });

  it('does not show zoom level when showZoomLevel is false', () => {
    render(<ZoomControls zoomLevel={150} showZoomLevel={false} />);

    expect(screen.queryByText('150%')).not.toBeInTheDocument();
  });

  it('calls onZoomIn when zoom in button is clicked', () => {
    const onZoomIn = jest.fn();
    render(<ZoomControls onZoomIn={onZoomIn} />);

    // Buttons are rendered as: ZoomOut, ZoomIn (Reset only if onReset provided)
    const buttons = screen.getAllByRole('button');
    const zoomInButton = buttons[1]; // Second button is ZoomIn
    fireEvent.click(zoomInButton);

    expect(onZoomIn).toHaveBeenCalledTimes(1);
  });

  it('calls onZoomOut when zoom out button is clicked', () => {
    const onZoomOut = jest.fn();
    render(<ZoomControls onZoomOut={onZoomOut} />);

    const buttons = screen.getAllByRole('button');
    const zoomOutButton = buttons[0]; // First button is ZoomOut
    fireEvent.click(zoomOutButton);

    expect(onZoomOut).toHaveBeenCalledTimes(1);
  });

  it('disables zoom in button when canZoomIn is false', () => {
    render(<ZoomControls canZoomIn={false} onZoomIn={jest.fn()} />);

    const buttons = screen.getAllByRole('button');
    const zoomInButton = buttons[1]; // Second button is ZoomIn
    expect(zoomInButton).toBeDisabled();
  });

  it('disables zoom out button when canZoomOut is false', () => {
    render(<ZoomControls canZoomOut={false} onZoomOut={jest.fn()} />);

    const buttons = screen.getAllByRole('button');
    const zoomOutButton = buttons[0]; // First button is ZoomOut
    expect(zoomOutButton).toBeDisabled();
  });

  it('calls onReset when reset button is clicked', () => {
    const onReset = jest.fn();
    render(<ZoomControls onReset={onReset} />);

    const buttons = screen.getAllByRole('button');
    const resetButton = buttons[buttons.length - 1];
    fireEvent.click(resetButton);

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('does not show reset button when onReset is not provided', () => {
    render(<ZoomControls />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });

  it('shows reset button when onReset is provided', () => {
    render(<ZoomControls onReset={jest.fn()} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(2);
  });

  it('disables all buttons when disabled is true', () => {
    render(
      <ZoomControls
        onZoomIn={jest.fn()}
        onZoomOut={jest.fn()}
        onReset={jest.fn()}
        disabled={true}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });
});