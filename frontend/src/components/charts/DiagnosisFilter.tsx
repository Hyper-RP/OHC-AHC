import React from 'react';

interface DiagnosisFilterProps {
  diagnoses: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  searchable?: boolean;
  maxDisplay?: number;
}

export const DiagnosisFilter: React.FC<DiagnosisFilterProps> = ({
  diagnoses,
  selected,
  onChange,
  searchable = true,
  maxDisplay = 10,
}) => {
  const [search, setSearch] = React.useState('');
  const [showAll, setShowAll] = React.useState(false);

  const filtered = diagnoses.filter((d) =>
    d.toLowerCase().includes(search.toLowerCase())
  );

  const displayed = showAll ? filtered : filtered.slice(0, maxDisplay);

  const toggleDiagnosis = (diagnosis: string) => {
    const newSelected = selected.includes(diagnosis)
      ? selected.filter((d) => d !== diagnosis)
      : [...selected, diagnosis];
    onChange(newSelected);
  };

  const toggleAll = () => {
    if (selected.length === filtered.length) {
      onChange([]);
    } else {
      onChange(filtered);
    }
  };

  return (
    <div className="space-y-3">
      {searchable && (
        <input
          type="text"
          placeholder="Search diagnoses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}

      <button
        onClick={toggleAll}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        {selected.length === filtered.length ? 'Deselect All' : 'Select All'}
      </button>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {displayed.map((diagnosis) => (
          <label
            key={diagnosis}
            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selected.includes(diagnosis)}
              onChange={() => toggleDiagnosis(diagnosis)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{diagnosis}</span>
          </label>
        ))}
      </div>

      {filtered.length > maxDisplay && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showAll ? 'Show less' : `Show ${filtered.length - maxDisplay} more`}
        </button>
      )}
    </div>
  );
};