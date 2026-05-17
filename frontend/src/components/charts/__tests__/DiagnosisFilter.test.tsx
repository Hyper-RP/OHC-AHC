import { render, screen, fireEvent } from '@testing-library/react';
import { DiagnosisFilter } from '../DiagnosisFilter';

describe('DiagnosisFilter', () => {
  const mockDiagnoses = ['Flu', 'Cold', 'COVID-19', 'Allergies', 'Asthma'];

  it('renders all diagnoses', () => {
    render(
      <DiagnosisFilter
        diagnoses={mockDiagnoses}
        selected={[]}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText('Flu')).toBeInTheDocument();
    expect(screen.getByText('Cold')).toBeInTheDocument();
    expect(screen.getByText('COVID-19')).toBeInTheDocument();
    expect(screen.getByText('Allergies')).toBeInTheDocument();
    expect(screen.getByText('Asthma')).toBeInTheDocument();
  });

  it('shows search input by default', () => {
    render(
      <DiagnosisFilter
        diagnoses={mockDiagnoses}
        selected={[]}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByPlaceholderText('Search diagnoses...')).toBeInTheDocument();
  });

  it('does not show search input when searchable is false', () => {
    render(
      <DiagnosisFilter
        diagnoses={mockDiagnoses}
        selected={[]}
        onChange={jest.fn()}
        searchable={false}
      />
    );

    expect(screen.queryByPlaceholderText('Search diagnoses...')).not.toBeInTheDocument();
  });

  it('filters diagnoses based on search', () => {
    render(
      <DiagnosisFilter
        diagnoses={mockDiagnoses}
        selected={[]}
        onChange={jest.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Search diagnoses...');
    fireEvent.change(input, { target: { value: 'flu' } });

    expect(screen.getByText('Flu')).toBeInTheDocument();
    expect(screen.queryByText('Cold')).not.toBeInTheDocument();
  });

  it('filters case-insensitively', () => {
    render(
      <DiagnosisFilter
        diagnoses={mockDiagnoses}
        selected={[]}
        onChange={jest.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Search diagnoses...');
    fireEvent.change(input, { target: { value: 'FLU' } });

    expect(screen.getByText('Flu')).toBeInTheDocument();
  });

  it('toggles diagnosis selection', () => {
    const onChange = jest.fn();
    render(
      <DiagnosisFilter
        diagnoses={mockDiagnoses}
        selected={[]}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByText('Flu'));

    expect(onChange).toHaveBeenCalledWith(['Flu']);
  });

  it('removes diagnosis when already selected', () => {
    const onChange = jest.fn();
    render(
      <DiagnosisFilter
        diagnoses={mockDiagnoses}
        selected={['Flu']}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByText('Flu'));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('shows correct checked state', () => {
    render(
      <DiagnosisFilter
        diagnoses={mockDiagnoses}
        selected={['Flu']}
        onChange={jest.fn()}
      />
    );

    const fluCheckbox = screen.getByLabelText('Flu') as HTMLInputElement;
    expect(fluCheckbox.checked).toBe(true);

    const coldCheckbox = screen.getByLabelText('Cold') as HTMLInputElement;
    expect(coldCheckbox.checked).toBe(false);
  });

  it('selects all diagnoses when "Select All" is clicked', () => {
    const onChange = jest.fn();
    render(
      <DiagnosisFilter
        diagnoses={mockDiagnoses}
        selected={[]}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByText('Select All'));

    expect(onChange).toHaveBeenCalledWith(expect.arrayContaining(mockDiagnoses));
  });

  it('deselects all diagnoses when "Deselect All" is clicked', () => {
    const onChange = jest.fn();
    render(
      <DiagnosisFilter
        diagnoses={mockDiagnoses}
        selected={mockDiagnoses}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByText('Deselect All'));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('limits displayed items to maxDisplay', () => {
    render(
      <DiagnosisFilter
        diagnoses={mockDiagnoses}
        selected={[]}
        onChange={jest.fn()}
        maxDisplay={3}
      />
    );

    expect(screen.getByText('Flu')).toBeInTheDocument();
    expect(screen.getByText('Cold')).toBeInTheDocument();
    expect(screen.getByText('COVID-19')).toBeInTheDocument();
    expect(screen.queryByText('Allergies')).not.toBeInTheDocument();
  });

  it('shows "Show more" button when items are limited', () => {
    render(
      <DiagnosisFilter
        diagnoses={mockDiagnoses}
        selected={[]}
        onChange={jest.fn()}
        maxDisplay={3}
      />
    );

    expect(screen.getByText(/Show/)).toBeInTheDocument();
  });

  it('shows all items when "Show more" is clicked', () => {
    render(
      <DiagnosisFilter
        diagnoses={mockDiagnoses}
        selected={[]}
        onChange={jest.fn()}
        maxDisplay={3}
      />
    );

    fireEvent.click(screen.getByText(/Show/));

    expect(screen.getByText('Allergies')).toBeInTheDocument();
    expect(screen.getByText('Asthma')).toBeInTheDocument();
  });

  it('handles empty diagnoses array', () => {
    render(
      <DiagnosisFilter
        diagnoses={[]}
        selected={[]}
        onChange={jest.fn()}
      />
    );

    expect(screen.queryByText('Flu')).not.toBeInTheDocument();
  });

  it('shows scrollable list for many items', () => {
    const manyDiagnoses = Array.from({ length: 30 }, (_, i) => `Diagnosis ${i + 1}`);
    render(
      <DiagnosisFilter
        diagnoses={manyDiagnoses}
        selected={[]}
        onChange={jest.fn()}
      />
    );

    const list = document.querySelector('.max-h-60');
    expect(list).toBeInTheDocument();
    expect(list).toHaveClass('overflow-y-auto');
  });

  it('updates filtered list when search changes', () => {
    render(
      <DiagnosisFilter
        diagnoses={mockDiagnoses}
        selected={[]}
        onChange={jest.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Search diagnoses...');
    fireEvent.change(input, { target: { value: 'allergies' } });

    expect(screen.getByText('Allergies')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: '' } });

    expect(screen.getByText('Flu')).toBeInTheDocument();
    expect(screen.getByText('Cold')).toBeInTheDocument();
  });
});