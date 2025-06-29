import { Fragment } from 'react';
import { format } from 'date-fns';
import { Menu, Transition } from '@headlessui/react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { Database, TaskPriority, TaskStatus } from '../lib/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];
type Label = Database['public']['Tables']['labels']['Row'];

interface TaskItemProps {
  task: Task & { 
    task_labels: { label: Label }[]; 
    parent_task?: { id: number; title: string } | null;
    subtasks?: { id: number; title: string; status: TaskStatus; priority: TaskPriority; completed: boolean }[];
  };
  isSubtask?: boolean;
  onEdit: (task: any) => void;
  onDelete: (taskId: number) => void;
  onAddSubtask?: (taskId: number) => void;
  onAddTask?: (projectId: number) => void;
}

const priorityColors = {
  high: 'bg-red-100 text-red-800 ring-red-600/20',
  medium: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
  low: 'bg-blue-100 text-blue-800 ring-blue-600/20',
};

const statusColors = {
  concluida: 'text-green-600',
  em_andamento: 'text-yellow-600',
  nao_iniciada: 'text-gray-600',
};

const statusLabels = {
  concluida: 'Concluída',
  em_andamento: 'Em andamento',
  nao_iniciada: 'Não iniciada',
};

export function TaskItem({ 
  task, 
  isSubtask = false, 
  onEdit, 
  onDelete, 
  onAddSubtask, 
  onAddTask 
}: TaskItemProps) {
  const getTaskStatus = (task: Task) => {
    const status = task.status || 'nao_iniciada';
    return {
      label: statusLabels[status],
      color: statusColors[status],
    };
  };

  const baseClasses = isSubtask 
    ? "ml-8 mt-2 bg-gray-50 rounded-md shadow-sm p-3 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-primary-200"
    : "bg-white rounded-md shadow-sm p-3 hover:shadow-md transition-shadow cursor-pointer";

  const textClasses = isSubtask 
    ? "text-sm font-medium text-gray-800"
    : "font-medium text-gray-900";

  const dateClasses = isSubtask 
    ? "text-xs text-gray-500 min-w-[100px]"
    : "text-sm text-gray-600 min-w-[100px]";

  const statusClasses = isSubtask 
    ? "text-xs font-medium min-w-[120px] text-right"
    : "text-sm font-medium min-w-[120px] text-right";

  const menuButtonClasses = isSubtask 
    ? "flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full hover:bg-gray-100"
    : "flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full hover:bg-gray-100";

  const iconClasses = isSubtask ? "w-4 h-4" : "w-5 h-5";

  return (
    <div
      className={`${baseClasses} ${task.completed ? 'opacity-50' : ''}`}
      onClick={() => onEdit(task)}
    >
      <div className="flex items-center gap-3">
        {/* Subtask Indicator */}
        {isSubtask && (
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
            Subtarefa
          </span>
        )}
        
        {/* Priority */}
        <span
          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
            priorityColors[task.priority]
          }`}
        >
          {task.priority}
        </span>
        
        {/* Task Name */}
        <div className="flex-1">
          <h4 className={`${textClasses} ${
            task.status === 'concluida' ? 'line-through' : ''
          }`}>
            {task.title}
          </h4>
        </div>
        
        {/* Due Date */}
        <div className={dateClasses}>
          {task.due_date ? format(new Date(task.due_date), 'dd/MM/yyyy') : '-'}
        </div>
        
        {/* Status */}
        <div className={`${statusClasses} ${getTaskStatus(task).color}`}>
          {getTaskStatus(task).label}
        </div>

        {/* Context Menu */}
        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button 
            className={menuButtonClasses}
            onClick={(e) => e.stopPropagation()}
          >
            <EllipsisVerticalIcon className={iconClasses} />
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <Menu.Items className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              
              <Menu.Item>
                {({ focus }) => (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(task);
                    }}
                    className={`${
                      focus ? 'bg-gray-100' : ''
                    } block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100`}
                  >
                    {isSubtask ? 'Editar Subtarefa' : 'Editar Tarefa'}
                  </button>
                )}
              </Menu.Item>
              
              <Menu.Item>
                {({ focus }) => (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Tem certeza que deseja excluir esta ${isSubtask ? 'subtarefa' : 'tarefa'}?`)) {
                        onDelete(task.id);
                      }
                    }}
                    className={`${
                      focus ? 'bg-gray-100' : ''
                    } block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100`}
                  >
                    {isSubtask ? 'Excluir Subtarefa' : 'Excluir Tarefa'}
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </div>
  );
}