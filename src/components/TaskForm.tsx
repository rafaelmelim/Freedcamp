import { Fragment, useState, forwardRef, useImperativeHandle } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Database } from '../lib/database.types';
import { toast } from 'react-hot-toast';
import { parseHHMMSSToSeconds } from '../lib/utils';

type Task = Database['public']['Tables']['tasks']['Insert'];
type Label = Database['public']['Tables']['labels']['Row'];

export interface TaskFormRef {
  resetForm: () => void;
}

interface TaskFormProps {
  projectId: number;
  parentTaskId?: number;
  onSubmit: (data: Task, labels: Label[]) => void;
  onCancel: () => void;
}

interface IssueLink {
  id: string;
  url: string;
}

export const TaskForm = forwardRef<TaskFormRef, TaskFormProps>(({ projectId, parentTaskId, onSubmit, onCancel }, ref) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [issueLinks, setIssueLinks] = useState<IssueLink[]>([{ id: '1', url: '' }]);
  const [value, setValue] = useState('');
  const [actualHours, setActualHours] = useState('00:00:00');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setIssueLinks([{ id: '1', url: '' }]);
    setValue('');
    setActualHours('00:00:00');
  };

  useImperativeHandle(ref, () => ({
    resetForm,
  }));

  const handleAddIssueLink = () => {
    setIssueLinks([...issueLinks, { id: Date.now().toString(), url: '' }]);
  };

  const handleRemoveIssueLink = (id: string) => {
    setIssueLinks(issueLinks.filter(link => link.id !== id));
  };

  const handleUpdateIssueLink = (id: string, url: string) => {
    setIssueLinks(issueLinks.map(link => 
      link.id === id ? { ...link, url } : link
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!title.trim()) {
      return;
    }

    // Validate dates
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return;
    }

    // Format issue links as part of the description
    const issueLinksText = issueLinks
      .filter(link => link.url.trim())
      .map(link => link.url.trim())
      .join('\n');

    const fullDescription = description.trim() + (issueLinksText ? `\n\nIssues:\n${issueLinksText}` : '');

    const taskData = {
      title: title.trim(),
      description: fullDescription || null,
      project_id: projectId,
      parent_task_id: parentTaskId || null,
      position: 0,
      due_date: endDate || startDate || null,
      priority: 'medium',
      value: value ? parseFloat(value) : null,
      actual_hours: actualHours !== '00:00:00' ? parseHHMMSSToSeconds(actualHours) : null,
    };

    onSubmit(taskData, []); // Pass empty array for labels
  };

  return (
    <Transition.Root show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onCancel}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    onClick={onCancel}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      {parentTaskId ? 'Cadastro de Subtarefa' : 'Nova Tarefa'}
                    </Dialog.Title>
                    <div className="mt-4">
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome da Tarefa *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
            placeholder="Digite o nome da tarefa"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição da tarefa
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
            placeholder="Descreva a tarefa"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data inicial da tarefa
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data fim da tarefa
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor da Tarefa (R$)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0,00"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Horas Realizadas (hh:mm:ss)
          </label>
          <input
            type="text"
            value={actualHours}
            onChange={(e) => setActualHours(e.target.value)}
            placeholder="00:00:00"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Vincular Link da Issue
            </label>
            <button
              type="button"
              onClick={handleAddIssueLink}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Adicionar Issue
            </button>
          </div>
          <div className="space-y-2">
            {issueLinks.map((link) => (
              <div key={link.id} className="flex gap-2">
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => handleUpdateIssueLink(link.id, e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
                />
                {issueLinks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveIssueLink(link.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

                        <div className="flex justify-end space-x-2 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {parentTaskId ? 'Criar Subtarefa' : 'Criar Tarefa'}
          </button>
        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});

TaskForm.displayName = 'TaskForm';