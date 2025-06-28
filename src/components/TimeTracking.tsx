import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { Database } from '../lib/database.types';
import { useQueryClient } from '@tanstack/react-query';

type TimeEntry = Database['public']['Tables']['time_entries']['Row'];

interface TimeTrackingProps {
  taskId: number;
}

/**
 * Time Tracking Component
 * 
 * This component provides session-based time tracking within the modal.
 * The timer starts when "Start" is clicked and stops when "Stop" is clicked.
 * Time is tracked in seconds for precision and stored as duration in the database.
 * 
 * Note: If the modal is closed without explicitly stopping the timer,
 * the current session's elapsed time will not be saved. For persistent tracking
 * across sessions or modal closures, a more complex solution involving
 * server-side updates or persistent client-side storage would be necessary.
 */
export function TimeTracking({ taskId }: TimeTrackingProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const queryClient = useQueryClient();

  const { data: timeEntries } = useQuery({
    queryKey: ['time_entries', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('task_id', taskId)
        .order('start_time', { ascending: false });

      if (error) throw error;
      return data as TimeEntry[];
    },
  });

  const createTimeEntry = useMutation({
    mutationFn: async ({ startTime, endTime, duration }: { startTime: Date; endTime: Date; duration: number }) => {
      const { error } = await supabase
        .from('time_entries')
        .insert([
          {
            task_id: taskId,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            duration,
          },
        ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time_entries', taskId] });
      
      // Update task actual_hours with total time in seconds (exact value)
      const totalDuration = getTotalDuration();
      
      supabase
        .from('tasks')
        .update({ actual_hours: totalDuration })
        .eq('id', taskId)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['projects'] });
        });
      
      toast.success('Time entry saved');
    },
    onError: () => {
      toast.error('Failed to save time entry');
    },
  });

  useEffect(() => {
    let interval: number;

    if (isTracking && startTime) {
      interval = window.setInterval(() => {
        const now = new Date();
        setElapsedTime(Math.floor((now.getTime() - startTime.getTime()) / 1000));
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTracking, startTime]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    return timeEntries?.reduce((total, entry) => total + entry.duration, 0) || 0;
  };

  const handleStartTracking = () => {
    setIsTracking(true);
    setStartTime(new Date());
    setElapsedTime(0);
  };

  const handleStopTracking = () => {
    if (startTime) {
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      createTimeEntry.mutate({
        startTime,
        endTime,
        duration,
      });
    }

    setIsTracking(false);
    setStartTime(null);
    setElapsedTime(0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-700">Time Tracking</h4>
          <p className="text-sm text-gray-600">
            Total time: {formatDuration(getTotalDuration())}
          </p>
        </div>
        <button
          type="button"
          onClick={isTracking ? handleStopTracking : handleStartTracking}
          className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isTracking
              ? 'text-red-600 hover:text-red-700 focus:ring-red-500'
              : 'text-primary-600 hover:text-primary-700 focus:ring-primary-500'
          }`}
        >
          {isTracking ? 'Stop' : 'Start'} Tracking
        </button>
      </div>

      {isTracking && (
        <div className="text-lg font-semibold text-primary-600">
          {formatDuration(elapsedTime)}
        </div>
      )}

      {timeEntries && timeEntries.length > 0 && (
        <div className="mt-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Recent Time Entries</h5>
          <div className="space-y-2">
            {timeEntries.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex justify-between text-sm text-gray-600 py-1 border-b border-gray-100"
              >
                <span>{format(new Date(entry.start_time), 'MMM d, HH:mm')}</span>
                <span>{formatDuration(entry.duration)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}