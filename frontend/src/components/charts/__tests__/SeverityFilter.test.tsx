import { render, screen, fireEvent } from '@testing-library/react';
import { SeverityFilter } from '../SeverityFilter';

describe('SeverityFilter', () => {
  it('renders all severity levels', () => {
    render(
      <SeverityFilter
        selected={[]}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText('Mild')).toBeInTheDocument();
    expect(screen.getByText('Moderate')).toBeInTheDocument();
    expect(screen.getByText('Serious')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('calls onChange when severity is toggled', () => {
    const onChange = jest.fn();
    render(
      <SeverityFilter
        selected={[]}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByText('Mild'));

    expect(onChange).toHaveBeenCalledWith(['MILD']);
  });

  it('removes severity when already selected', () => {
    const onChange = jest.fn();
    render(
      <SeverityFilter
        selected={['MILD']}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByText('Mild'));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('shows correct selection state', () => {
    const { rerender } = render(
      <SeverityFilter
        selected={['MILD']}
        onChange={jest.fn()}
      />
    );

    const mildCheckbox = screen.getByText('Mild').closest('label')?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(mildCheckbox?.checked).toBe(true);

    rerender(
      <SeverityFilter
        selected={[]}
        onChange={jest.fn()}
      />
    );

    expect(mildCheckbox?.checked).toBe(false);
  });

  it('shows severity counts when showCount is true', () => {
    render(
      <SeverityFilter
        selected={[]}
        onChange={jest.fn()}
        showCount={true}
        severityCounts={{ MILD: 10, MODERATE: 5 }}
      />
    );

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('calls onToggleAll when "Select All" is clicked', () => {
    const onToggleAll = jest.fn();
    render(
      <SeverityFilter
        selected={[]}
        onChange={onToggleAll}
      />
    );

    fireEvent.click(screen.getByText('Select All'));

    expect(onToggleAll).toHaveBeenCalledWith(['MILD', 'MODERATE', 'SERIOUS', 'CRITICAL']);
  });

  it('calls onToggleAll with empty array when "Deselect All" is clicked', () => {
    const onToggleAll = jest.fn();
    render(
      <SeverityFilter
        selected={['MILD', 'MODERATE', 'SERIOUS', 'CRITICAL']}
        onChange={onToggleAll}
      />
    );

    fireEvent.click(screen.getByText('Deselect All'));

    expect(onToggleAll).toHaveBeenCalledWith([]);
  });

  it('shows correct button text based on selection', () => {
    const { rerender } = render(
      <SeverityFilter
        selected={[]}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText('Select All')).toBeInTheDocument();

    rerender(
      <SeverityFilter
        selected={['MILD', 'MODERATE', 'SERIOUS', 'CRITICAL']}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText('Deselect All')).toBeInTheDocument();
  });

  it('shows color indicators for each severity', () => {
    render(
      <SeverityFilter
        selected={[]}
        onChange={jest.fn()}
      />
    );

    const colorDots = document.querySelectorAll('.rounded-full');
    expect(colorDots).toHaveLength(4);
  });

  it('shows ring border when selected', () => {
    render(
      <SeverityFilter
        selected={['MILD']}
        onChange={jest.fn()}
      />
    );

    const mildLabel = screen.getByText('Mild').closest('label');
    expect(mildLabel).toHaveClass('ring-2');
  });

  it('does not show ring border when not selected', () => {
    render(
      <SeverityFilter
        selected={[]}
        onChange={jest.fn()}
      />
    );

    const mildLabel = screen.getByText('Mild').closest('label');
    expect(mildLabel).not.toHaveClass('ring-2');
  });
});