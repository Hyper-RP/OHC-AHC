import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { Button } from '../ui';
import type { SavedFilter } from '../../hooks/useFilters';

interface SaveFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  savedFilters: SavedFilter[];
  onLoad: (filter: SavedFilter) => void;
  onDelete: (id: string) => void;
}

export const SaveFilterModal: React.FC<SaveFilterModalProps> = ({
  isOpen,
  onClose,
  onSave,
  savedFilters,
  onLoad,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [activeTab, setActiveTab] = useState<'save' | 'load'>('save');

  if (!isOpen) return null;

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      setName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Saved Filters</h3>
          <button onClick={onClose}>
            <X size={20} className="text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('save')}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'save'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Save Current
          </button>
          <button
            onClick={() => setActiveTab('load')}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'load'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Load Saved
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'save' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Q1 2026 - IT Department"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                />
              </div>
              <Button variant="brand" onClick={handleSave} disabled={!name.trim()} className="w-full">
                <Save size={16} className="mr-2" />
                Save Filter
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {savedFilters.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No saved filters yet.</p>
                  <p className="text-sm mt-1">Save your current filter configuration to reuse later.</p>
                </div>
              ) : (
                savedFilters.map((filter) => (
                  <div
                    key={filter.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <div>
                      <p className="font-medium text-sm">{filter.name}</p>
                      <p className="text-xs text-gray-500">
                        Saved {formatDate(filter.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline-brand"
                        size="sm"
                        onClick={() => onLoad(filter)}
                      >
                        Load
                      </Button>
                      <button
                        onClick={() => onDelete(filter.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}