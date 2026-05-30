import type { MedicineRecord } from './medicineInventory';

const normalizeHeader = (value: string) =>
  value.trim().toLowerCase().replace(/[\s_-]+/g, '');

const splitCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
};

const getCell = (row: Record<string, string>, keys: string[]) => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== '') {
      return value;
    }
  }
  return '';
};

export const parseMedicineCsv = (csvText: string): MedicineRecord[] => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = splitCsvLine(lines[0]).map(normalizeHeader);

  return lines
    .slice(1)
    .map((line) => {
      const values = splitCsvLine(line);
      const row = headers.reduce<Record<string, string>>((acc, header, index) => {
        acc[header] = (values[index] ?? '').trim();
        return acc;
      }, {});

      const id = getCell(row, ['medicineid', 'id', 'code']);
      const name = getCell(row, ['medicinename', 'name']);

      if (!id || !name) {
        return null;
      }

      return {
        id,
        name,
        stock: Number.parseInt(getCell(row, ['openingstock', 'stock', 'quantity']), 10) || 0,
        reorderLevel: Number.parseInt(getCell(row, ['reorderlevel', 'reorder', 'minimumstock']), 10) || 0,
        unit: getCell(row, ['unit']) || 'tablets',
        batch: getCell(row, ['batch', 'batchno', 'batchnumber']),
        expiry: getCell(row, ['expiry', 'expirydate']),
        supplier: getCell(row, ['supplier', 'suppliername']),
      } satisfies MedicineRecord;
    })
    .filter((record): record is MedicineRecord => Boolean(record));
};
