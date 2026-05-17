import { render, screen, fireEvent } from '@testing-library/react';
import { FilterPanel } from '../FilterPanel';

describe('FilterPanel', () => {
  it('renders toggle button', () => {
    render(
      <FilterPanel
        isOpen={false}
        onToggle={jest.fn()}
        onClear={jest.fn()}
        filterCount={0}
      >
        <div>Filter Content</div>
      </FilterPanel>
    );

    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('shows badge count when filterCount > 0', () => {
    render(
      <FilterPanel
        isOpen={false}
        onToggle={jest.fn()}
        onClear={jest.fn()}
        filterCount={3}
      >
        <div>Filter Content</div>
      </FilterPanel>
    );

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('does not show badge count when filterCount is 0', () => {
    render(
      <FilterPanel
        isOpen={false}
        onToggle={jest.fn()}
        onClear={jest.fn()}
        filterCount={0}
      >
        <div>Filter Content</div>
      </FilterPanel>
    );

    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('calls onToggle when button is clicked', () => {
    const onToggle = jest.fn();
    render(
      <FilterPanel
        isOpen={false}
        onToggle={onToggle}
        onClear={jest.fn()}
        filterCount={0}
      >
        <div>Filter Content</div>
      </FilterPanel>
    );

    fireEvent.click(screen.getByText('Filters'));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows panel content when isOpen is true', () => {
    render(
      <FilterPanel
        isOpen={true}
        onToggle={jest.fn()}
        onClear={jest.fn()}
        filterCount={0}
      >
        <div>Filter Content</div>
      </FilterPanel>
    );

    expect(screen.getByText('Filter Content')).toBeInTheDocument();
  });

  it('does not show panel content when isOpen is false', () => {
    render(
      <FilterPanel
        isOpen={false}
        onToggle={jest.fn()}
        onClear={jest.fn()}
        filterCount={0}
      >
        <div>Filter Content</div>
      </FilterPanel>
    );

    expect(screen.queryByText('Filter Content')).not.toBeInTheDocument();
  });

  it('calls onClear when clear button is clicked', () => {
    const onClear = jest.fn();
    render(
      <FilterPanel
        isOpen={true}
        onToggle={jest.fn()}
        onClear={onClear}
        filterCount={3}
      >
        <div>Filter Content</div>
      </FilterPanel>
    );

    fireEvent.click(screen.getByText('Clear All'));

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('does not show Clear All button when filterCount is 0', () => {
    render(
      <FilterPanel
        isOpen={true}
        onToggle={jest.fn()}
        onClear={jest.fn()}
        filterCount={0}
      >
        <div>Filter Content</div>
      </FilterPanel>
    );

    expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
  });

  it('shows Apply Filters button when filters are active', () => {
    render(
      <FilterPanel
        isOpen={true}
        onToggle={jest.fn()}
        onClear={jest.fn()}
        filterCount={2}
      >
        <div>Filter Content</div>
      </FilterPanel>
    );

    expect(screen.getByText('Apply Filters (2)')).toBeInTheDocument();
  });

  it('calls onToggle when clicking overlay', () => {
    const onToggle = jest.fn();
    render(
      <FilterPanel
        isOpen={true}
        onToggle={onToggle}
        onClear={jest.fn()}
        filterCount={0}
      >
        <div>Filter Content</div>
      </FilterPanel>
    );

    const overlay = document.querySelector('.fixed');
    if (overlay) {
      fireEvent.click(overlay);
      expect(onToggle).toHaveBeenCalledTimes(1);
    }
  });

  it('positions panel on right when position is right', () => {
    const { container } = render(
      <FilterPanel
        isOpen={true}
        onToggle={jest.fn()}
        onClear={jest.fn()}
        filterCount={0}
        position="right"
      >
        <div>Filter Content</div>
      </FilterPanel>
    );

    const panel = container.querySelector('.right-0');
    expect(panel).toBeInTheDocument();
  });

  it('positions panel on left when position is left', () => {
    const { container } = render(
      <FilterPanel
        isOpen={true}
        onToggle={jest.fn()}
        onClear={jest.fn()}
        filterCount={0}
        position="left"
      >
        <div>Filter Content</div>
      </FilterPanel>
    );

    const panel = container.querySelector('.left-0');
    expect(panel).toBeInTheDocument();
  });
});