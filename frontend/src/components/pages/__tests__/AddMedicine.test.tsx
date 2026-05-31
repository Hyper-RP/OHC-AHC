import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../tests/test-utils';
import { AddMedicine } from '../AddMedicine';

describe('AddMedicine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-30T10:00:00Z'));
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the add medicine page fields', () => {
    renderWithProviders(<AddMedicine />, {
      routerProps: { initialEntries: ['/medicine-management/add'] },
    });

    expect(screen.getAllByText('Add Medicine')).toHaveLength(2);
    expect(screen.getByLabelText('Medicine ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Medicine Name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Medicine' })).toBeInTheDocument();
  });

  it('stores a new medicine and keeps the add action available', () => {
    renderWithProviders(<AddMedicine />, {
      routerProps: { initialEntries: ['/medicine-management/add'] },
    });

    fireEvent.change(screen.getByLabelText('Medicine ID'), {
      target: { value: 'MED-001' },
    });
    fireEvent.change(screen.getByLabelText('Medicine Name'), {
      target: { value: 'Paracetamol 650' },
    });
    fireEvent.change(screen.getByLabelText('Unit'), {
      target: { value: 'tablets' },
    });
    fireEvent.change(screen.getByLabelText('Opening Stock'), {
      target: { value: '120' },
    });
    fireEvent.change(screen.getByLabelText('Reorder Level'), {
      target: { value: '25' },
    });
    fireEvent.change(screen.getByLabelText('Expiry Date'), {
      target: { value: '2026-06-15' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add Medicine' }));

    const stored = window.localStorage.getItem('medicine_inventory_records');
    expect(stored).toContain('Paracetamol 650');
  });

  it('only allows expiry dates from tomorrow onward and blocks today or past dates', () => {
    renderWithProviders(<AddMedicine />, {
      routerProps: { initialEntries: ['/medicine-management/add'] },
    });

    const expiryInput = screen.getByLabelText('Expiry Date');
    expect(expiryInput).toHaveAttribute('min', '2026-05-31');

    fireEvent.change(screen.getByLabelText('Medicine ID'), {
      target: { value: 'MED-002' },
    });
    fireEvent.change(screen.getByLabelText('Medicine Name'), {
      target: { value: 'ORS Sachet' },
    });
    fireEvent.change(screen.getByLabelText('Unit'), {
      target: { value: 'sachets' },
    });
    fireEvent.change(expiryInput, {
      target: { value: '2026-05-30' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add Medicine' }));

    expect(screen.getByText('Expiry date must be after today.')).toBeInTheDocument();
    expect(window.localStorage.getItem('medicine_inventory_records')).toBeNull();
  });
});
