import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormInput } from '../FormInput';

describe('FormInput Component', () => {
  const handleChange = vi.fn();

  beforeEach(() => {
    handleChange.mockClear();
  });

  it('renders without label', () => {
    render(<FormInput name="test" value="" onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('renders placeholder', () => {
    render(<FormInput name="search" value="" placeholder="Search..." onChange={handleChange} />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('renders with value', () => {
    render(<FormInput name="email" value="test@example.com" onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('test@example.com');
  });

  it('calls onChange handler', () => {
    render(<FormInput name="test" value="" onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new value' } });

    expect(handleChange).toHaveBeenCalledWith('new value');
  });

  it('calls onBlur handler', () => {
    const handleBlur = vi.fn();
    render(<FormInput name="test" value="" onChange={handleChange} onBlur={handleBlur} />);

    const input = screen.getByRole('textbox');
    fireEvent.blur(input);

    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('renders error message', () => {
    render(<FormInput name="test" value="" onChange={handleChange} error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('renders helper text when no error', () => {
    render(<FormInput name="password" value="" onChange={handleChange} helperText="Minimum 8 characters" />);
    expect(screen.getByText('Minimum 8 characters')).toBeInTheDocument();
  });

  it('does not render helper text when error is present', () => {
    render(
      <FormInput
        name="password"
        value=""
        onChange={handleChange}
        error="Required"
        helperText="Minimum 8 characters"
      />
    );
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.queryByText('Minimum 8 characters')).not.toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<FormInput name="test" value="" onChange={handleChange} disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('renders with type="password"', () => {
    render(<FormInput name="password" type="password" value="" onChange={handleChange} />);
    const input = screen.getByDisplayValue('') as HTMLInputElement;
    expect(input.type).toBe('password');
  });

  it('renders with type="email"', () => {
    render(<FormInput name="email" type="email" value="" onChange={handleChange} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.type).toBe('email');
  });

  it('renders with type="number"', () => {
    render(<FormInput name="age" type="number" value="" onChange={handleChange} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toBeInTheDocument();
  });

  it('renders with min constraint', () => {
    render(<FormInput name="quantity" type="number" value="" onChange={handleChange} min="0" />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(input.min).toBe('0');
  });

  it('renders with custom className', () => {
    const { container } = render(<FormInput name="test" value="" onChange={handleChange} className="custom-input" />);
    const containerDiv = container.querySelector('.custom-input');
    expect(containerDiv).toBeInTheDocument();
  });

  it('renders error state styling', () => {
    render(<FormInput name="test" value="" onChange={handleChange} error="Error" />);
    // When there's an error, the input should have an 'error' class
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('error');
  });

  it('renders as textarea when type is textarea', () => {
    render(<FormInput name="description" type="textarea" value="" onChange={handleChange} />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('renders with custom rows for textarea', () => {
    render(<FormInput name="description" type="textarea" rows="3" value="" onChange={handleChange} />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.rows).toBe(3);
  });

  it('renders as select when type is select', () => {
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
    ];
    render(<FormInput name="select" type="select" value="" options={options} onChange={handleChange} />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('renders select options', () => {
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
    ];
    render(<FormInput name="select" type="select" value="" options={options} onChange={handleChange} />);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('is readonly when readonly prop is true', () => {
    render(<FormInput name="test" value="readonly" onChange={handleChange} readonly />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.readOnly).toBe(true);
  });
});
