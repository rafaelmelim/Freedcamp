import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Database, TaskPriority, TaskStatus } from '../lib/database.types';
import { TaskComments } from './TaskComments';
import { TimeTracking } from './TimeTracking';

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskDetailsModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: number, data: Partial<Task>) => void;
  onDelete: (taskId: number) => void;
  onArchive?: (taskId: number) => void;
}

const priorityColors: Record<TaskPriority, string> = {
  high: 'bg-red-100 text-red-800 ring-red-600/20',
  medium: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
  low: 'bg-blue-100 text-blue-800 ring-blue-600/20',
};

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'concluida', label: 'Concluída' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'nao_iniciada', label: 'Não iniciada' },
];

function TaskDetailsModal({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onArchive,
}: TaskDetailsModalProps) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      title: task.title,
      description: task.description || '',
      due_date: task.due_date || '',
      priority: task.priority,
      status: task.status || 'nao_iniciada',
      value: task.value || '',
      actual_hours: task.actual_hours || '',
    },
  });

  const onSubmit = (data: any) => {
    onUpdate(task.id, data);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Task Details
                </Dialog.Title>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      {...register('title', { required: 'Title is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <textarea
                      {...register('description')}
                      placeholder="Description"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        {...register('due_date')}
                        min={format(new Date(), 'yyyy-MM-dd')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        {...register('priority')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status da Tarefa
                    </label>
                    <select
                      {...register('status')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor da Tarefa (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('value', {
                        setValueAs: (value) => value === '' ? null : parseFloat(value)
                      })}
                      placeholder="0,00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>


                  <div>
                    <TimeTracking taskId={task.id} />
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Comments</h4>
                    <TaskComments taskId={task.id} />
                  </div>

                  <div className="flex justify-between pt-4">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this task?')) {
                            onDelete(task.id);
                            onClose();
                          }
                        }}
                        className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        Delete Task
                      </button>
                      {onArchive && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Are you sure you want to archive this task?')) {
                              onArchive(task.id);
                              onClose();
                            }
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700"
                        >
                          Archive Task
                        </button>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Horas Realizadas
            </label>
            <input
              type="number"
              min="0"
              {...register('actual_hours', {
                setValueAs: (value) => value === '' ? null : parseInt(value)
              })}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

      </Dialog>
    </Transition>
  );
}

export { TaskDetailsModal }