import { describe, it, expect } from 'vitest';
import { parseMedicineCsv } from '../medicineImport';

describe('parseMedicineCsv', () => {
  it('parses excel-style csv rows into medicine records', () => {
    const csv = [
      'Medicine ID,Medicine Name,Opening Stock,Reorder Level,Unit,Batch,Expiry Date,Supplier',
      'MED-001,Paracetamol 650,120,25,tablets,PCM-24-A,2027-01-30,MediSupply Pharma',
    ].join('\n');

    const result = parseMedicineCsv(csv);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'MED-001',
      name: 'Paracetamol 650',
      stock: 120,
      reorderLevel: 25,
      unit: 'tablets',
      batch: 'PCM-24-A',
      expiry: '2027-01-30',
      supplier: 'MediSupply Pharma',
    });
  });

  it('ignores rows without required medicine id or name', () => {
    const csv = [
      'Medicine ID,Medicine Name,Opening Stock',
      ',Paracetamol 650,120',
      'MED-002,,40',
      'MED-003,ORS Sachet,50',
    ].join('\n');

    const result = parseMedicineCsv(csv);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('MED-003');
  });
});
