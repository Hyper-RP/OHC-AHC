import { render, screen, fireEvent } from '@testing-library/react';
import { QuickFilters } from '../QuickFilters';

const MOCK_PRESETS = [
  { id: 'today', label: 'Today', start: new Date(), end: new Date() },
  { id: 'last-7-days', label: 'Last 7 Days', start: new Date(), end: new Date() },
  { id: 'last-30-days', label: 'Last 30 Days', start: new Date(), end: new Date() },
];

describe('QuickFilters', () => {
  it('renders all preset buttons', () => {
    render(
      <QuickFilters
        presets={MOCK_PRESETS}
        activePreset={null}
        onSelect={jest.fn()}
      />
    );

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
    expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
  });

  it('calls onSelect when preset is clicked', () => {
    const onSelect = jest.fn();
    render(
      <QuickFilters
        presets={MOCK_PRESETS}
        activePreset={null}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByText('Last 7 Days'));

    expect(onSelect).toHaveBeenCalledWith(MOCK_PRESETS[1]);
  });

  it('shows active state for selected preset', () => {
    render(
      <QuickFilters
        presets={MOCK_PRESETS}
        activePreset="last-7-days"
        onSelect={jest.fn()}
      />
    );

    const activeButton = screen.getByText('Last 7 Days');
    expect(activeButton).toHaveClass('bg-blue-600');
  });

  it('shows inactive state for unselected presets', () => {
    render(
      <QuickFilters
        presets={MOCK_PRESETS}
        activePreset="last-7-days"
        onSelect={jest.fn()}
      />
    );

    const inactiveButton = screen.getByText('Today');
    expect(inactiveButton).toHaveClass('bg-gray-100');
  });

  it('deselects when clicking active preset', () => {
    const onSelect = jest.fn();
    render(
      <QuickFilters
        presets={MOCK_PRESETS}
        activePreset="last-7-days"
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByText('Last 7 Days'));

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('applies custom className', () => {
    const { container } = render(
      <QuickFilters
        presets={MOCK_PRESETS}
        activePreset={null}
        onSelect={jest.fn()}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('uses default presets when none provided', () => {
    render(
      <QuickFilters
        activePreset={null}
        onSelect={jest.fn()}
      />
    );

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
    expect(screen.getByText('This Week')).toBeInTheDocument();
  });

  it('shows Clock icon', () => {
    const { container } = render(
      <QuickFilters
        presets={MOCK_PRESETS}
        activePreset={null}
        onSelect={jest.fn()}
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});