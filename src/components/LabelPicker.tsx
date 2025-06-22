import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Label = Database['public']['Tables']['labels']['Row'];

interface LabelPickerProps {
  selectedLabels: Label[];
  onToggleLabel: (label: Label) => void;
}

export function LabelPicker({ selectedLabels, onToggleLabel }: LabelPickerProps) {
  const { data: labels } = useQuery({
    queryKey: ['labels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('labels')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Label[];
    },
  });

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <div className="space-y-2">
        {labels?.map((label) => (
          <div
            key={label.id}
            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
            onClick={() => onToggleLabel(label)}
          >
            <input
              type="checkbox"
              checked={selectedLabels.some((l) => l.id === label.id)}
              onChange={() => onToggleLabel(label)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: label.color }}
            />
            <span className="text-sm text-gray-700">{label.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}