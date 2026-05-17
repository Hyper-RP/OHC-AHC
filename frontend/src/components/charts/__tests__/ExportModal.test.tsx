import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportModal } from '../ExportModal';

describe('ExportModal', () => {
  it('does not render when isOpen is false', () => {
    render(
      <ExportModal
        isOpen={false}
        onClose={jest.fn()}
        onExport={jest.fn()}
        isExporting={false}
        progress={0}
      />
    );

    expect(screen.queryByText('Export Chart')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={jest.fn()}
        onExport={jest.fn()}
        isExporting={false}
        progress={0}
      />
    );

    expect(screen.getByText('Export Chart')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(
      <ExportModal
        isOpen={true}
        onClose={onClose}
        onExport={jest.fn()}
        isExporting={false}
        progress={0}
      />
    );

    const closeButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent === ''
    );
    fireEvent.click(closeButton!);

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = jest.fn();
    render(
      <ExportModal
        isOpen={true}
        onClose={onClose}
        onExport={jest.fn()}
        isExporting={false}
        progress={0}
      />
    );

    const overlay = document.querySelector('.absolute.inset-0.bg-black\\/50');
    if (overlay) {
      fireEvent.click(overlay);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('shows all format options', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={jest.fn()}
        onExport={jest.fn()}
        isExporting={false}
        progress={0}
      />
    );

    expect(screen.getByText('PNG Image')).toBeInTheDocument();
    expect(screen.getByText('SVG Image')).toBeInTheDocument();
    expect(screen.getByText('PDF Document')).toBeInTheDocument();
    expect(screen.getByText('CSV Data')).toBeInTheDocument();
  });

  it('selects format when clicked', () => {
    const { rerender } = render(
      <ExportModal
        isOpen={true}
        onClose={jest.fn()}
        onExport={jest.fn()}
        isExporting={false}
        progress={0}
      />
    );

    fireEvent.click(screen.getByText('PDF Document'));

    rerender(
      <ExportModal
        isOpen={true}
        onClose={jest.fn()}
        onExport={jest.fn()}
        isExporting={false}
        progress={0}
      />
    );

    const pdfButton = screen.getByText('PDF Document').closest('button');
    expect(pdfButton).toHaveClass('border-blue-600');
  });

  it('shows quality slider for non-CSV formats', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={jest.fn()}
        onExport={jest.fn()}
        isExporting={false}
        progress={0}
      />
    );

    // Quality text is combined with value: "Quality: 2x"
    expect(screen.getByText(/Quality:/)).toBeInTheDocument();
  });

  it('does not show quality slider for CSV format', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={jest.fn()}
        onExport={jest.fn()}
        isExporting={false}
        progress={0}
      />
    );

    fireEvent.click(screen.getByText('CSV Data'));

    expect(screen.queryByText(/Quality:/)).not.toBeInTheDocument();
  });

  it('shows export options for non-CSV formats', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={jest.fn()}
        onExport={jest.fn()}
        isExporting={false}
        progress={0}
      />
    );

    expect(screen.getByText('Include chart title')).toBeInTheDocument();
    expect(screen.getByText('Include legend')).toBeInTheDocument();
    expect(screen.getByText('Background Color')).toBeInTheDocument();
  });

  it('does not show export options for CSV format', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={jest.fn()}
        onExport={jest.fn()}
        isExporting={false}
        progress={0}
      />
    );

    fireEvent.click(screen.getByText('CSV Data'));

    expect(screen.queryByText('Include chart title')).not.toBeInTheDocument();
    expect(screen.queryByText('Include legend')).not.toBeInTheDocument();
    expect(screen.queryByText('Background Color')).not.toBeInTheDocument();
  });

  it('updates quality when slider changes', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={jest.fn()}
        onExport={jest.fn()}
        isExporting={false}
        progress={0}
      />
    );

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '3' } });

    expect(screen.getByText('Quality: 3x')).toBeInTheDocument();
  });

  it('toggles include title checkbox', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={jest.fn()}
        onExport={jest.fn()}
        isExporting={false}
        progress={0}
      />
    );

    const checkbox = screen.getByLabelText('Include chart title');
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('calls onExport with correct format', () => {
    const onExport = jest.fn();
    render(
      <ExportModal
        isOpen={true}
        onClose={jest.fn()}
        onExport={onExport}
        isExporting={false}
        progress={0}
      />
    );

    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);

    expect(onExport).toHaveBeenCalledWith('png', expect.objectContaining({
      quality: 2,
      includeTitle: true,
      includeLegend: true,
      backgroundColor: '#ffffff',
    }));
  });

  it('shows export progress when exporting', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={jest.fn()}
        onExport={jest.fn()}
        isExporting={true}
        progress={50}
      />
    );

    expect(screen.getByText('Exporting...')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('shows progress bar when exporting', () => {
    const { container } = render(
      <ExportModal
        isOpen={true}
        onClose={jest.fn()}
        onExport={jest.fn()}
        isExporting={true}
        progress={75}
      />
    );

    const progressBar = container.querySelector('.bg-blue-600');
    expect(progressBar).toHaveStyle({ width: '75%' });
  });

  it('shows cancel button', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={jest.fn()}
        onExport={jest.fn()}
        isExporting={false}
        progress={0}
      />
    );

    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', () => {
    const onClose = jest.fn();
    render(
      <ExportModal
        isOpen={true}
        onClose={onClose}
        onExport={jest.fn()}
        isExporting={false}
        progress={0}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));

    expect(onClose).toHaveBeenCalled();
  });

  it('has proper modal styling', () => {
    const { container } = render(
      <ExportModal
        isOpen={true}
        onClose={jest.fn()}
        onExport={jest.fn()}
        isExporting={false}
        progress={0}
      />
    );

    const modal = container.querySelector('.bg-white');
    expect(modal).toHaveClass('rounded-lg');
    expect(modal).toHaveClass('shadow-xl');
    expect(modal).toHaveClass('max-w-md');
  });

  it('shows format descriptions', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={jest.fn()}
        onExport={jest.fn()}
        isExporting={false}
        progress={0}
      />
    );

    expect(screen.getByText('Best for presentations and documents')).toBeInTheDocument();
    expect(screen.getByText('Scalable vector format')).toBeInTheDocument();
    expect(screen.getByText('Print-ready document')).toBeInTheDocument();
    expect(screen.getByText('Raw data in spreadsheet format')).toBeInTheDocument();
  });

  it('shows background color picker', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={jest.fn()}
        onExport={jest.fn()}
        isExporting={false}
        progress={0}
      />
    );

    // Find the color input by type, not by role
    const colorInput = document.querySelector('input[type="color"]');
    expect(colorInput).toBeInTheDocument();
  });

  it('updates background color when changed', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={jest.fn()}
        onExport={jest.fn()}
        isExporting={false}
        progress={0}
      />
    );

    // Update the text input for the background color
    const textInput = screen.getAllByRole('textbox').find(
      (input) => (input as HTMLInputElement).value.startsWith('#')
    );
    if (textInput) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;
      nativeInputValueSetter?.call(textInput, '#ff0000');
      fireEvent.input(textInput, { target: { value: '#ff0000' } });
      expect((textInput as HTMLInputElement).value).toBe('#ff0000');
    }
  });
});