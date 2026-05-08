import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card } from '../Card';

describe('Card Component', () => {
  const user = userEvent.setup();

  it('renders with title and children', () => {
    render(
      <Card title="Test Title">
        <p>Card content</p>
      </Card>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders without title', () => {
    render(<Card>Content only</Card>);
    expect(screen.getByText('Content only')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    render(<Card onClick={handleClick}>Click me</Card>);

    await user.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders with badge', () => {
    render(<Card title="Card with Badge" badge="New">Content</Card>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders with badge color', () => {
    render(<Card title="Card" badge="Success" badgeColor="success">Content</Card>);
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('renders with subtitle', () => {
    render(<Card title="Title" subtitle="This is a subtitle">Content</Card>);
    expect(screen.getByText('This is a subtitle')).toBeInTheDocument();
  });

  it('renders with actions', () => {
    render(
      <Card title="Card with Actions" actions={<button>Action</button>}>
        Content
      </Card>
    );

    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <Card>
        <p>First child</p>
        <p>Second child</p>
        <p>Third child</p>
      </Card>
    );

    expect(screen.getByText('First child')).toBeInTheDocument();
    expect(screen.getByText('Second child')).toBeInTheDocument();
    expect(screen.getByText('Third child')).toBeInTheDocument();
  });

  it('renders with all optional props', () => {
    render(
      <Card
        title="Full Card"
        subtitle="Subtitle here"
        badge="Active"
        badgeColor="brand"
        actions={<button>Edit</button>}
        className="highlight"
      >
        Main content
      </Card>
    );

    expect(screen.getByText('Full Card')).toBeInTheDocument();
    expect(screen.getByText('Subtitle here')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByText('Main content')).toBeInTheDocument();
  });
});
