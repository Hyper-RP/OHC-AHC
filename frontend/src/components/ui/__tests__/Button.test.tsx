import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button Component', () => {
  const user = userEvent.setup();

  it('renders with default props', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('renders with variant="brand"', () => {
    render(<Button variant="brand">Brand</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Brand');
  });

  it('renders with variant="outline-brand"', () => {
    render(<Button variant="outline-brand">Outline Brand</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Outline Brand');
  });

  it('renders with variant="outline-light"', () => {
    render(<Button variant="outline-light">Outline Light</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Outline Light');
  });

  it('renders with size="sm"', () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Small');
  });

  it('renders with size="lg"', () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Large');
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Loading');
  });

  it('does not click when loading', async () => {
    const handleClick = vi.fn();
    render(<Button loading onClick={handleClick}>Loading</Button>);

    const button = screen.getByRole('button');
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders with custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('renders with type="submit"', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('renders with type="button"', () => {
    render(<Button type="button">Button</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
});
