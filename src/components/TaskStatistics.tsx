import { useMemo } from 'react';
import { isPast, isToday } from 'date-fns';
import { Database, TaskPriority } from '../lib/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskStatisticsProps {
  tasks: Task[];
}

export function TaskStatistics({ tasks }: TaskStatisticsProps) {
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const overdue = tasks.filter(t => 
      t.due_date && 
      !t.completed && 
      isPast(new Date(t.due_date)) && 
      !isToday(new Date(t.due_date))
    ).length;
    const dueToday = tasks.filter(t => 
      t.due_date && 
      !t.completed && 
      isToday(new Date(t.due_date))
    ).length;

    const priorityCount = tasks.reduce((acc, task) => {
      if (!task.completed) {
        acc[task.priority]++;
      }
      return acc;
    }, {
      high: 0,
      medium: 0,
      low: 0,
    } as Record<TaskPriority, number>);

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      overdue,
      dueToday,
      priorityCount,
      completionRate,
    };
  }, [tasks]);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm">
      <h4 className="text-sm font-medium text-gray-700 mb-3">Task Statistics</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-2xl font-semibold text-primary-600">
            {stats.completionRate}%
          </div>
          <div className="text-sm text-gray-600">Completion Rate</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-gray-900">
            {stats.total}
          </div>
          <div className="text-sm text-gray-600">Total Tasks</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-red-600">
            {stats.overdue}
          </div>
          <div className="text-sm text-gray-600">Overdue</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-orange-600">
            {stats.dueToday}
          </div>
          <div className="text-sm text-gray-600">Due Today</div>
        </div>
      </div>
      
      <div className="mt-4">
        <h5 className="text-sm font-medium text-gray-700 mb-2">Priority Distribution</h5>
        <div className="space-y-2">
          <div className="flex items-center">
            <div className="w-24 text-sm text-gray-600">High</div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full"
                style={{
                  width: `${stats.total > 0 ? (stats.priorityCount.high / stats.total) * 100 : 0}%`
                }}
              />
            </div>
            <div className="w-8 text-right text-sm text-gray-600">{stats.priorityCount.high}</div>
          </div>
          <div className="flex items-center">
            <div className="w-24 text-sm text-gray-600">Medium</div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 rounded-full"
                style={{
                  width: `${stats.total > 0 ? (stats.priorityCount.medium / stats.total) * 100 : 0}%`
                }}
              />
            </div>
            <div className="w-8 text-right text-sm text-gray-600">{stats.priorityCount.medium}</div>
          </div>
          <div className="flex items-center">
            <div className="w-24 text-sm text-gray-600">Low</div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{
                  width: `${stats.total > 0 ? (stats.priorityCount.low / stats.total) * 100 : 0}%`
                }}
              />
            </div>
            <div className="w-8 text-right text-sm text-gray-600">{stats.priorityCount.low}</div>
          </div>
        </div>
      </div>
    </div>
  );
}