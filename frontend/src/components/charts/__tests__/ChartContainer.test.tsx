import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChartContainer } from '../ChartContainer';

describe('ChartContainer', () => {
  const mockOnExport = vi.fn();

  it('renders with title and description', () => {
    render(
      <ChartContainer
        title="Test Chart"
        description="Test description"
        loading={false}
        error={null}
        empty={false}
      >
        <div data-testid="chart-content">Chart Content</div>
      </ChartContainer>
    );

    expect(screen.getByText('Test Chart')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByTestId('chart-content')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(
      <ChartContainer
        title="Test Chart"
        loading={true}
        error={null}
        empty={false}
      >
        <div>Chart Content</div>
      </ChartContainer>
    );

    expect(screen.getByText('Loading chart...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(
      <ChartContainer
        title="Test Chart"
        loading={false}
        error="Failed to load data"
        empty={false}
      >
        <div>Chart Content</div>
      </ChartContainer>
    );

    expect(screen.getByText('⚠️')).toBeInTheDocument();
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(
      <ChartContainer
        title="Test Chart"
        loading={false}
        error={null}
        empty={true}
      >
        <div>Chart Content</div>
      </ChartContainer>
    );

    expect(screen.getByText('📊')).toBeInTheDocument();
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('shows export button when onExport provided', () => {
    render(
      <ChartContainer
        title="Test Chart"
        loading={false}
        error={null}
        empty={false}
        onExport={mockOnExport}
      >
        <div>Chart Content</div>
      </ChartContainer>
    );

    expect(screen.getByText('⬇ Export')).toBeInTheDocument();
  });

  it('does not show export button when onExport not provided', () => {
    render(
      <ChartContainer
        title="Test Chart"
        loading={false}
        error={null}
        empty={false}
      >
        <div>Chart Content</div>
      </ChartContainer>
    );

    expect(screen.queryByText('⬇ Export')).not.toBeInTheDocument();
  });

  it('opens export dropdown when export button clicked', () => {
    render(
      <ChartContainer
        title="Test Chart"
        loading={false}
        error={null}
        empty={false}
        onExport={mockOnExport}
      >
        <div>Chart Content</div>
      </ChartContainer>
    );

    const exportButton = screen.getByText('⬇ Export');
    fireEvent.click(exportButton);

    expect(screen.getByText('PNG Image')).toBeInTheDocument();
    expect(screen.getByText('SVG Image')).toBeInTheDocument();
  });

  it('calls onExport with PNG format when PNG clicked', () => {
    render(
      <ChartContainer
        title="Test Chart"
        loading={false}
        error={null}
        empty={false}
        onExport={mockOnExport}
      >
        <div>Chart Content</div>
      </ChartContainer>
    );

    const exportButton = screen.getByText('⬇ Export');
    fireEvent.click(exportButton);

    const pngOption = screen.getByText('PNG Image');
    fireEvent.click(pngOption);

    expect(mockOnExport).toHaveBeenCalledWith('png');
  });

  it('calls onExport with SVG format when SVG clicked', () => {
    render(
      <ChartContainer
        title="Test Chart"
        loading={false}
        error={null}
        empty={false}
        onExport={mockOnExport}
      >
        <div>Chart Content</div>
      </ChartContainer>
    );

    const exportButton = screen.getByText('⬇ Export');
    fireEvent.click(exportButton);

    const svgOption = screen.getByText('SVG Image');
    fireEvent.click(svgOption);

    expect(mockOnExport).toHaveBeenCalledWith('svg');
  });

  it('closes export dropdown after selecting format', () => {
    render(
      <ChartContainer
        title="Test Chart"
        loading={false}
        error={null}
        empty={false}
        onExport={mockOnExport}
      >
        <div>Chart Content</div>
      </ChartContainer>
    );

    const exportButton = screen.getByText('⬇ Export');
    fireEvent.click(exportButton);

    const pngOption = screen.getByText('PNG Image');
    fireEvent.click(pngOption);

    expect(screen.queryByText('PNG Image')).not.toBeInTheDocument();
    expect(screen.queryByText('SVG Image')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ChartContainer
        title="Test Chart"
        loading={false}
        error={null}
        empty={false}
        className="custom-class"
      >
        <div>Chart Content</div>
      </ChartContainer>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
