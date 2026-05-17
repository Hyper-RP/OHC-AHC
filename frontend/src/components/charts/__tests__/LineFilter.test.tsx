import { render, screen, fireEvent } from '@testing-library/react';
import { LineFilter } from '../LineFilter';

describe('LineFilter', () => {
  const mockOptions = [
    { id: '1', name: 'Diagnosis A', color: '#ff0000', visible: true },
    { id: '2', name: 'Diagnosis B', color: '#00ff00', visible: true },
    { id: '3', name: 'Diagnosis C', color: '#0000ff', visible: false },
  ];

  it('renders all filter options', () => {
    render(
      <LineFilter options={mockOptions} onChange={jest.fn()} />
    );

    expect(screen.getByText('Diagnosis A')).toBeInTheDocument();
    expect(screen.getByText('Diagnosis B')).toBeInTheDocument();
    expect(screen.getByText('Diagnosis C')).toBeInTheDocument();
  });

  it('calls onChange when option is clicked', () => {
    const onChange = jest.fn();
    render(
      <LineFilter options={mockOptions} onChange={onChange} />
    );

    fireEvent.click(screen.getByText('Diagnosis A'));

    expect(onChange).toHaveBeenCalledWith('1');
  });

  it('shows color indicators', () => {
    render(
      <LineFilter options={mockOptions} onChange={jest.fn()} />
    );

    const colorDots = document.querySelectorAll('.rounded-full');
    expect(colorDots).toHaveLength(3);
  });

  it('strikes through hidden lines', () => {
    render(
      <LineFilter options={mockOptions} onChange={jest.fn()} />
    );

    const diagnosisC = screen.getByText('Diagnosis C');
    expect(diagnosisC).toHaveClass('line-through');
  });

  it('does not strike through visible lines', () => {
    render(
      <LineFilter options={mockOptions} onChange={jest.fn()} />
    );

    const diagnosisA = screen.getByText('Diagnosis A');
    expect(diagnosisA).not.toHaveClass('line-through');
  });

  it('calls onToggleAll when "Show All" is clicked', () => {
    const onToggleAll = jest.fn();
    render(
      <LineFilter
        options={mockOptions}
        onChange={jest.fn()}
        onToggleAll={onToggleAll}
      />
    );

    fireEvent.click(screen.getByText('Show All'));

    expect(onToggleAll).toHaveBeenCalledWith(true);
  });

  it('calls onToggleAll with false when "Hide All" is clicked', () => {
    const allVisibleOptions = mockOptions.map((o) => ({ ...o, visible: true }));
    const onToggleAll = jest.fn();
    render(
      <LineFilter
        options={allVisibleOptions}
        onChange={jest.fn()}
        onToggleAll={onToggleAll}
      />
    );

    fireEvent.click(screen.getByText('Hide All'));

    expect(onToggleAll).toHaveBeenCalledWith(false);
  });

  it('shows "No lines visible" when all are hidden', () => {
    const allHiddenOptions = mockOptions.map((o) => ({ ...o, visible: false }));
    render(
      <LineFilter options={allHiddenOptions} onChange={jest.fn()} />
    );

    expect(screen.getByText('No lines visible')).toBeInTheDocument();
  });

  it('does not show "No lines visible" when at least one is visible', () => {
    render(
      <LineFilter options={mockOptions} onChange={jest.fn()} />
    );

    expect(screen.queryByText('No lines visible')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <LineFilter options={mockOptions} onChange={jest.fn()} className="custom" />
    );

    expect(container.firstChild).toHaveClass('custom');
  });

  it('shows border when compact is true', () => {
    const { container } = render(
      <LineFilter options={mockOptions} onChange={jest.fn()} compact={true} />
    );

    const buttons = container.querySelectorAll('button');
    buttons.forEach((button) => {
      expect(button).toHaveStyle('borderWidth: 1px');
    });
  });
});