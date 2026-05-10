import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Loading } from '../Loading';

describe('Loading', () => {
  it('renders spinner with default props', () => {
    const { container } = render(<Loading />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('does not render text when text prop is omitted', () => {
    const { container } = render(<Loading />);
    expect(container.querySelector('p')).not.toBeInTheDocument();
  });

  it('renders text when text prop is provided', () => {
    render(<Loading text="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('applies fullScreen class when fullScreen is true', () => {
    const { container } = render(<Loading fullScreen />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('fullScreen');
  });

  it('does not apply fullScreen class by default', () => {
    const { container } = render(<Loading />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).not.toContain('fullScreen');
  });

  it('applies custom className', () => {
    const { container } = render(<Loading className="my-custom" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('my-custom');
  });

  it('renders spinner element inside container', () => {
    const { container } = render(<Loading size="sm" />);
    const wrapper = container.firstChild as HTMLElement;
    const spinner = wrapper.firstChild as HTMLElement;
    // CSS modules will mangle names, just verify the spinner div exists
    expect(spinner).toBeInTheDocument();
    expect(spinner.tagName).toBe('DIV');
    expect(spinner.className).toContain('spinner');
  });

  it('renders different spinner for each size', () => {
    const { container: smContainer } = render(<Loading size="sm" />);
    const { container: lgContainer } = render(<Loading size="lg" />);
    const smSpinner = (smContainer.firstChild as HTMLElement).firstChild as HTMLElement;
    const lgSpinner = (lgContainer.firstChild as HTMLElement).firstChild as HTMLElement;
    // Different sizes should produce different class names
    expect(smSpinner.className).not.toBe(lgSpinner.className);
  });

  it('renders fullScreen with text', () => {
    const { container } = render(<Loading fullScreen text="Please wait..." />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('fullScreen');
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('renders spinner class on inner div', () => {
    const { container } = render(<Loading />);
    const wrapper = container.firstChild as HTMLElement;
    const spinner = wrapper.firstChild as HTMLElement;
    expect(spinner.className).toContain('spinner');
  });
});
