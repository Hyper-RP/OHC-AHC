import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../tests/test-utils';
import { MedicineManagement } from '../MedicineManagement';

describe('MedicineManagement', () => {
  it('renders the page header and summary cards', () => {
    renderWithProviders(<MedicineManagement />, {
      routerProps: { initialEntries: ['/medicine-management'] },
    });

    expect(screen.getByText('Medicine Management')).toBeInTheDocument();
    expect(screen.getByText('Total Medicines')).toBeInTheDocument();
    expect(screen.getByText('Low Stock Items')).toBeInTheDocument();
  });

  it('renders the single-page management sections', () => {
    renderWithProviders(<MedicineManagement />, {
      routerProps: { initialEntries: ['/medicine-management'] },
    });

    expect(screen.getByText('Add Medicine')).toBeInTheDocument();
    expect(screen.getByText('Medicine Catalog')).toBeInTheDocument();
    expect(screen.getByText('Low Stock Watch')).toBeInTheDocument();
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  it('shows empty states when no medicine data is available', () => {
    renderWithProviders(<MedicineManagement />, {
      routerProps: { initialEntries: ['/medicine-management'] },
    });

    expect(screen.getByText('No medicine inventory available yet.')).toBeInTheDocument();
    expect(screen.getByText('No low stock medicines to show.')).toBeInTheDocument();
    expect(screen.getByText('No medicine activity has been recorded yet.')).toBeInTheDocument();
  });

  it('shows add medicine section link even when inventory is empty', () => {
    renderWithProviders(<MedicineManagement />, {
      routerProps: { initialEntries: ['/medicine-management'] },
    });

    expect(screen.getByRole('link', { name: /Add Medicine/i })).toBeInTheDocument();
  });
});
