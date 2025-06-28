import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface TimeTrackingProps {
  taskId: number;
}

/**
 * Time Tracking Component
 * 
 * This component displays the total actual hours for a task.
 * The value is retrieved directly from the task's actual_hours field.
 */
export function TimeTracking({ taskId }: TimeTrackingProps) {
  const { data: task } = useQuery({
    queryKey: ['task-actual-hours', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('actual_hours')
        .eq('id', taskId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const formatDuration = (hours: number) => {
    if (!hours) return '0h';
    return `${hours}h`;
  };

  const totalHours = task?.actual_hours || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-700">Time Tracking</h4>
          <p className="text-sm text-gray-600">
            Total time: {formatDuration(totalHours)}
          </p>
        </div>
      </div>
    </div>
  );
}