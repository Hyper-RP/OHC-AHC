import { beforeEach, describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../tests/test-utils';
import { AddMedicine } from '../AddMedicine';

describe('AddMedicine', () => {
  beforeEach(() => {
    window.localStorage.clear();
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

    fireEvent.click(screen.getByRole('button', { name: 'Add Medicine' }));

    const stored = window.localStorage.getItem('medicine_inventory_records');
    expect(stored).toContain('Paracetamol 650');
  });
});