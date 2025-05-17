import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { toast } from 'react-hot-toast';

type Label = Database['public']['Tables']['labels']['Row'];

interface LabelPickerProps {
  taskId: number;
  selectedLabels: Label[];
  onToggleLabel: (label: Label) => void;
}

export function LabelPicker({ taskId, selectedLabels, onToggleLabel }: LabelPickerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3B82F6');
  const queryClient = useQueryClient();

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

  const createLabel = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('labels')
        .insert([
          {
            name: newLabelName,
            color: newLabelColor,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newLabel) => {
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      setIsCreating(false);
      setNewLabelName('');
      toast.success('Label created successfully');
      onToggleLabel(newLabel);
    },
    onError: () => {
      toast.error('Failed to create label');
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

      {isCreating ? (
        <div className="mt-4 space-y-2">
          <input
            type="text"
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            placeholder="Label name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <input
            type="color"
            value={newLabelColor}
            onChange={(e) => setNewLabelColor(e.target.value)}
            className="w-full h-10 p-1 rounded-md"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsCreating(false)}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={() => createLabel.mutate()}
              disabled={!newLabelName.trim()}
              className="px-3 py-1 text-sm text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="mt-4 w-full px-3 py-2 text-sm text-primary-600 border border-primary-600 rounded-md hover:bg-primary-50"
        >
          Create new label
        </button>
      )}
    </div>
  );
}