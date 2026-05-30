import { render, screen, fireEvent } from '@testing-library/react';
import { ExportButton } from '../ExportButton';

describe('ExportButton', () => {
  it('renders button with default label', () => {
    render(
      <ExportButton
        onExport={jest.fn()}
        isExporting={false}
      />
    );

    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(
      <ExportButton
        onExport={jest.fn()}
        isExporting={false}
        label="Download"
      />
    );

    expect(screen.getByText('Download')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', () => {
    render(
      <ExportButton
        onExport={jest.fn()}
        isExporting={false}
      />
    );

    fireEvent.click(screen.getByText('Export'));

    expect(screen.getByText('PNG Image')).toBeInTheDocument();
    expect(screen.getByText('SVG Image')).toBeInTheDocument();
    expect(screen.getByText('PDF Document')).toBeInTheDocument();
  });

  it('closes dropdown when format is selected', () => {
    const onExport = jest.fn();
    render(
      <ExportButton
        onExport={onExport}
        isExporting={false}
      />
    );

    fireEvent.click(screen.getByText('Export'));
    fireEvent.click(screen.getByText('PNG Image'));

    expect(onExport).toHaveBeenCalledWith('png');
    expect(screen.queryByText('PNG Image')).not.toBeInTheDocument();
  });

  it('calls onExport with correct format', () => {
    const onExport = jest.fn();
    render(
      <ExportButton
        onExport={onExport}
        isExporting={false}
      />
    );

    fireEvent.click(screen.getByText('Export'));
    fireEvent.click(screen.getByText('PDF Document'));

    expect(onExport).toHaveBeenCalledWith('pdf');
  });

  it('shows only available formats', () => {
    render(
      <ExportButton
        onExport={jest.fn()}
        isExporting={false}
        availableFormats={['png', 'csv']}
      />
    );

    fireEvent.click(screen.getByText('Export'));

    expect(screen.getByText('PNG Image')).toBeInTheDocument();
    expect(screen.getByText('CSV Data')).toBeInTheDocument();
    expect(screen.queryByText('PDF Document')).not.toBeInTheDocument();
  });

  it('disables button when isExporting is true', () => {
    render(
      <ExportButton
        onExport={jest.fn()}
        isExporting={true}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('disables dropdown options when isExporting is true', () => {
    render(
      <ExportButton
        onExport={jest.fn()}
        isExporting={true}
      />
    );

    fireEvent.click(screen.getByText('Export'));

    const options = screen.getAllByRole('menuitem');
    options.forEach((option) => {
      expect(option).toBeDisabled();
    });
  });

  it('does not open dropdown when disabled', () => {
    render(
      <ExportButton
        onExport={jest.fn()}
        isExporting={true}
      />
    );

    fireEvent.click(screen.getByText('Export'));

    expect(screen.queryByText('PNG Image')).not.toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', () => {
    render(
      <ExportButton
        onExport={jest.fn()}
        isExporting={false}
      />
    );

    fireEvent.click(screen.getByText('Export'));
    expect(screen.getByText('PNG Image')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByText('PNG Image')).not.toBeInTheDocument();
  });

  it('shows download icon', () => {
    const { container } = render(
      <ExportButton
        onExport={jest.fn()}
        isExporting={false}
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});