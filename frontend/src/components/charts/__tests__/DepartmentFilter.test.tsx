import { render, screen, fireEvent } from '@testing-library/react';
import { DepartmentFilter } from '../DepartmentFilter';

describe('DepartmentFilter', () => {
  const mockDepartments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'];

  it('renders all departments', () => {
    render(
      <DepartmentFilter
        departments={mockDepartments}
        selected={[]}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.getByText('HR')).toBeInTheDocument();
    expect(screen.getByText('Finance')).toBeInTheDocument();
  });

  it('shows search input when searchable is true', () => {
    render(
      <DepartmentFilter
        departments={mockDepartments}
        selected={[]}
        onChange={jest.fn()}
        searchable={true}
      />
    );

    expect(screen.getByPlaceholderText('Search departments...')).toBeInTheDocument();
  });

  it('does not show search input when searchable is false', () => {
    render(
      <DepartmentFilter
        departments={mockDepartments}
        selected={[]}
        onChange={jest.fn()}
        searchable={false}
      />
    );

    expect(screen.queryByPlaceholderText('Search departments...')).not.toBeInTheDocument();
  });

  it('filters departments based on search', () => {
    render(
      <DepartmentFilter
        departments={mockDepartments}
        selected={[]}
        onChange={jest.fn()}
        searchable={true}
      />
    );

    const input = screen.getByPlaceholderText('Search departments...');
    fireEvent.change(input, { target: { value: 'eng' } });

    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.queryByText('Sales')).not.toBeInTheDocument();
  });

  it('toggles department selection', () => {
    const onChange = jest.fn();
    render(
      <DepartmentFilter
        departments={mockDepartments}
        selected={[]}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByText('Engineering'));

    expect(onChange).toHaveBeenCalledWith(['Engineering']);
  });

  it('removes department when already selected', () => {
    const onChange = jest.fn();
    render(
      <DepartmentFilter
        departments={mockDepartments}
        selected={['Engineering']}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByText('Engineering'));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('shows correct checked state', () => {
    render(
      <DepartmentFilter
        departments={mockDepartments}
        selected={['Engineering']}
        onChange={jest.fn()}
      />
    );

    const engineeringCheckbox = screen.getByLabelText('Engineering') as HTMLInputElement;
    expect(engineeringCheckbox.checked).toBe(true);

    const salesCheckbox = screen.getByLabelText('Sales') as HTMLInputElement;
    expect(salesCheckbox.checked).toBe(false);
  });

  it('selects all departments when "Select All" is clicked', () => {
    const onChange = jest.fn();
    render(
      <DepartmentFilter
        departments={mockDepartments}
        selected={[]}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByText('Select All'));

    expect(onChange).toHaveBeenCalledWith(expect.arrayContaining(mockDepartments));
  });

  it('deselects all departments when "Deselect All" is clicked', () => {
    const onChange = jest.fn();
    render(
      <DepartmentFilter
        departments={mockDepartments}
        selected={mockDepartments}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByText('Deselect All'));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('shows correct button text based on selection', () => {
    const { rerender } = render(
      <DepartmentFilter
        departments={mockDepartments}
        selected={[]}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText('Select All')).toBeInTheDocument();

    rerender(
      <DepartmentFilter
        departments={mockDepartments}
        selected={mockDepartments}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText('Deselect All')).toBeInTheDocument();
  });

  it('limits displayed items to maxDisplay', () => {
    render(
      <DepartmentFilter
        departments={mockDepartments}
        selected={[]}
        onChange={jest.fn()}
        maxDisplay={3}
      />
    );

    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.queryByText('HR')).not.toBeInTheDocument();
  });

  it('shows "Show more" button when items are limited', () => {
    render(
      <DepartmentFilter
        departments={mockDepartments}
        selected={[]}
        onChange={jest.fn()}
        maxDisplay={3}
      />
    );

    expect(screen.getByText(/Show/)).toBeInTheDocument();
  });

  it('shows all items when "Show more" is clicked', () => {
    render(
      <DepartmentFilter
        departments={mockDepartments}
        selected={[]}
        onChange={jest.fn()}
        maxDisplay={3}
      />
    );

    fireEvent.click(screen.getByText(/Show/));

    expect(screen.getByText('HR')).toBeInTheDocument();
    expect(screen.getByText('Finance')).toBeInTheDocument();
  });

  it('shows correct "show less" text', () => {
    render(
      <DepartmentFilter
        departments={mockDepartments}
        selected={[]}
        onChange={jest.fn()}
        maxDisplay={3}
      />
    );

    const showMoreBtn = screen.getByText(/Show/);
    expect(showMoreBtn.textContent).toContain('2 more');
  });

  it('handles empty departments array', () => {
    render(
      <DepartmentFilter
        departments={[]}
        selected={[]}
        onChange={jest.fn()}
      />
    );

    expect(screen.queryByText('Engineering')).not.toBeInTheDocument();
  });

  it('shows scrollable list for many items', () => {
    const manyDepartments = Array.from({ length: 20 }, (_, i) => `Dept ${i + 1}`);
    render(
      <DepartmentFilter
        departments={manyDepartments}
        selected={[]}
        onChange={jest.fn()}
      />
    );

    const list = document.querySelector('.max-h-60');
    expect(list).toBeInTheDocument();
    expect(list).toHaveClass('overflow-y-auto');
  });
});