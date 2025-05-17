import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Database } from '../lib/database.types';

type Task = Database['public']['Tables']['tasks']['Insert'];

interface TaskFormProps {
  projectId: number;
  onSubmit: (data: Task) => void;
  onCancel: () => void;
}

export function TaskForm({ projectId, onSubmit, onCancel }: TaskFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<Task>();

  const onFormSubmit = (data: Task) => {
    onSubmit({
      ...data,
      project_id: projectId,
      position: 0,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 bg-white rounded-md p-4 shadow-sm">
      <div>
        <input
          type="text"
          {...register('title', { required: 'Title is required' })}
          placeholder="Task title"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div>
        <textarea
          {...register('description')}
          placeholder="Description (optional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
          rows={3}
        />
      </div>

      <div>
        <input
          type="date"
          {...register('due_date')}
          min={format(new Date(), 'yyyy-MM-dd')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Add Task
        </button>
      </div>
    </form>
  );
}