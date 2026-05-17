import { render, screen } from '@testing-library/react';
import { LoadingIndicator } from '../LoadingIndicator';

describe('LoadingIndicator', () => {
  it('does not render when visible is false', () => {
    const { container } = render(
      <LoadingIndicator visible={false} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders when visible is true', () => {
    render(<LoadingIndicator visible={true} />);

    expect(screen.getByText('Updating data...')).toBeInTheDocument();
  });

  it('shows custom message', () => {
    render(
      <LoadingIndicator visible={true} message="Custom message" />
    );

    expect(screen.getByText('Custom message')).toBeInTheDocument();
  });

  it('renders at top position by default', () => {
    const { container } = render(
      <LoadingIndicator visible={true} position="top" />
    );

    const indicator = container.firstChild as HTMLElement;
    expect(indicator).toHaveClass('top-2');
  });

  it('renders at bottom position', () => {
    const { container } = render(
      <LoadingIndicator visible={true} position="bottom" />
    );

    const indicator = container.firstChild as HTMLElement;
    expect(indicator).toHaveClass('bottom-2');
  });

  it('renders at inline position', () => {
    const { container } = render(
      <LoadingIndicator visible={true} position="inline" />
    );

    const indicator = container.firstChild as HTMLElement;
    expect(indicator).toHaveClass('inline-flex');
  });

  it('shows spinner animation', () => {
    const { container } = render(
      <LoadingIndicator visible={true} />
    );

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('has correct styling classes', () => {
    const { container } = render(
      <LoadingIndicator visible={true} />
    );

    const indicator = container.firstChild as HTMLElement;
    expect(indicator).toHaveClass('bg-white/90');
    expect(indicator).toHaveClass('backdrop-blur');
    expect(indicator).toHaveClass('rounded-full');
    expect(indicator).toHaveClass('shadow-sm');
  });

  it('shows small text', () => {
    render(<LoadingIndicator visible={true} />);

    const text = screen.getByText('Updating data...');
    expect(text).toHaveClass('text-xs');
  });
});