import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Database, TaskPriority } from '../lib/database.types';
import { LabelPicker } from './LabelPicker';
import { useState } from 'react';

type Task = Database['public']['Tables']['tasks']['Insert'];
type Label = Database['public']['Tables']['labels']['Row'];

interface TaskFormProps {
  projectId: number;
  onSubmit: (data: Task, labels: Label[]) => void;
  onCancel: () => void;
}

export function TaskForm({ projectId, onSubmit, onCancel }: TaskFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<Task>();
  const [selectedLabels, setSelectedLabels] = useState<Label[]>([]);

  const onFormSubmit = (data: Task) => {
    onSubmit({
      ...data,
      project_id: projectId,
      position: 0,
    }, selectedLabels);
  };

  const handleToggleLabel = (label: Label) => {
    setSelectedLabels(prev => 
      prev.some(l => l.id === label.id)
        ? prev.filter(l => l.id !== label.id)
        : [...prev, label]
    );
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="glass-card p-4 animate-fade-in">
      <div className="space-y-4">
        <div>
          <input
            type="text"
            {...register('title', { required: 'Title is required' })}
            placeholder="Task title"
            className="w-full px-3 py-2 border border-gray-300 rounded-md 
                     focus:outline-none focus:ring-2 focus:ring-primary-500 
                     transition-colors duration-200"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600 animate-fade-in">{errors.title.message}</p>
          )}
        </div>

        <div>
          <textarea
            {...register('description')}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md 
                     focus:outline-none focus:ring-2 focus:ring-primary-500 
                     transition-colors duration-200"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              type="date"
              {...register('due_date')}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md 
                       focus:outline-none focus:ring-2 focus:ring-primary-500 
                       transition-colors duration-200"
            />
          </div>

          <div>
            <select
              {...register('priority')}
              defaultValue="medium"
              className="w-full px-3 py-2 border border-gray-300 rounded-md 
                       focus:outline-none focus:ring-2 focus:ring-primary-500 
                       transition-colors duration-200"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Labels
          </label>
          <LabelPicker
            taskId={0}
            selectedLabels={selectedLabels}
            onToggleLabel={handleToggleLabel}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 
                     transition-colors duration-200 hover-effect"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary hover-effect"
          >
            Add Task
          </button>
        </div>
      </div>
    </form>
  );
}