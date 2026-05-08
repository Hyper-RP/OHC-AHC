import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert } from '../Alert';

describe('Alert Component', () => {
  const user = userEvent.setup();

  it('renders with info type', () => {
    render(<Alert type="info">Info message</Alert>);
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('renders with success type', () => {
    render(<Alert type="success">Success message</Alert>);
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('renders with warning type', () => {
    render(<Alert type="warning">Warning message</Alert>);
    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  it('renders with danger type', () => {
    render(<Alert type="danger">Error message</Alert>);
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('renders with title', () => {
    render(<Alert title="Alert Title">Message content</Alert>);
    expect(screen.getByText('Alert Title')).toBeInTheDocument();
    expect(screen.getByText('Message content')).toBeInTheDocument();
  });

  it('is dismissable when onDismiss is provided', async () => {
    const handleDismiss = vi.fn();
    render(<Alert onDismiss={handleDismiss}>Dismissable alert</Alert>);

    const dismissButton = screen.getByLabelText('Dismiss alert');
    expect(dismissButton).toBeInTheDocument();

    await user.click(dismissButton);

    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not show dismiss button when onDismiss not provided', () => {
    render(<Alert>Not dismissable</Alert>);
    expect(screen.queryByLabelText('Dismiss alert')).not.toBeInTheDocument();
  });

  it('renders with multiple children', () => {
    render(
      <Alert>
        <p>First paragraph</p>
        <p>Second paragraph</p>
      </Alert>
    );

    expect(screen.getByText('First paragraph')).toBeInTheDocument();
    expect(screen.getByText('Second paragraph')).toBeInTheDocument();
  });

  it('renders dismiss button with correct aria-label', () => {
    render(<Alert onDismiss={() => {}}>Alert with dismiss</Alert>);
    expect(screen.getByRole('button', { name: 'Dismiss alert' })).toBeInTheDocument();
  });

  it('renders all props together', () => {
    render(
      <Alert type="success" title="Success!" onDismiss={() => {}} className="important">
        Your changes have been saved.
      </Alert>
    );

    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Your changes have been saved.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dismiss alert' })).toBeInTheDocument();
  });
});
