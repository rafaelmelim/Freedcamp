import { useState } from 'react';
import { TaskPriority } from '../lib/database.types';

interface TaskFiltersProps {
  onFilterChange: (filters: {
    search: string;
    showCompleted: boolean;
    dueDateFilter: 'all' | 'overdue' | 'today' | 'upcoming' | 'none';
    priorityFilter: TaskPriority | 'all';
  }) => void;
}

export function TaskFilters({ onFilterChange }: TaskFiltersProps) {
  const [search, setSearch] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);
  const [dueDateFilter, setDueDateFilter] = useState<'all' | 'overdue' | 'today' | 'upcoming' | 'none'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFilterChange({ search: value, showCompleted, dueDateFilter, priorityFilter });
  };

  const handleShowCompletedChange = (value: boolean) => {
    setShowCompleted(value);
    onFilterChange({ search, showCompleted: value, dueDateFilter, priorityFilter });
  };

  const handleDueDateFilterChange = (value: 'all' | 'overdue' | 'today' | 'upcoming' | 'none') => {
    setDueDateFilter(value);
    onFilterChange({ search, showCompleted, dueDateFilter: value, priorityFilter });
  };

  const handlePriorityFilterChange = (value: TaskPriority | 'all') => {
    setPriorityFilter(value);
    onFilterChange({ search, showCompleted, dueDateFilter, priorityFilter: value });
  };

  return (
    <div className="flex flex-wrap gap-4 items-center mb-6">
      <div className="flex-1 min-w-[200px]">
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showCompleted"
          checked={showCompleted}
          onChange={(e) => handleShowCompletedChange(e.target.checked)}
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor="showCompleted" className="text-sm text-gray-700">
          Show completed
        </label>
      </div>

      <select
        value={dueDateFilter}
        onChange={(e) => handleDueDateFilterChange(e.target.value as any)}
        className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="all">All due dates</option>
        <option value="overdue">Overdue</option>
        <option value="today">Due today</option>
        <option value="upcoming">Upcoming</option>
        <option value="none">No due date</option>
      </select>

      <select
        value={priorityFilter}
        onChange={(e) => handlePriorityFilterChange(e.target.value as TaskPriority | 'all')}
        className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="all">All priorities</option>
        <option value="high">High priority</option>
        <option value="medium">Medium priority</option>
        <option value="low">Low priority</option>
      </select>
    </div>
  );
}