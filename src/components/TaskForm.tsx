import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { toast } from 'react-hot-toast';
import { parseHHMMSSToSeconds } from '../lib/utils';

type Task = Database['public']['Tables']['tasks']['Insert'];
type Label = Database['public']['Tables']['labels']['Row'];

interface TaskFormProps {
  projectId: number;
  parentTaskId?: number;
  onSubmit: (data: Task, labels: Label[]) => Promise<any>;
  onCancel: () => void;
}

interface IssueLink {
  id: string;
  url: string;
}

export function TaskForm({ projectId, parentTaskId, onSubmit, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [issueLinks, setIssueLinks] = useState<IssueLink[]>([{ id: '1', url: '' }]);
  const [value, setValue] = useState('');
  const [actualHours, setActualHours] = useState('00:00:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch parent task information if parentTaskId is provided
  const { data: parentTask } = useQuery({
    queryKey: ['parent-task', parentTaskId],
    queryFn: async () => {
      if (!parentTaskId) return null;
      
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title')
        .eq('id', parentTaskId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!parentTaskId,
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Validate required fields
    if (!title.trim()) {
      toast.error(parentTaskId ? 'O nome da subtarefa é obrigatório' : 'O nome da tarefa é obrigatório');
      return;
    }

    // Validate dates
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      toast.error('A data inicial não pode ser maior que a data final');
      return;
    }

    setIsSubmitting(true);

    try {
      // Format issue links as part of the description
      const issueLinksText = issueLinks
        .filter(link => link.url.trim())
        .map(link => link.url.trim())
        .join('\n');

      const fullDescription = description.trim() + (issueLinksText ? `\n\nIssues:\n${issueLinksText}` : '');

      const taskData: Task = {
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

      await onSubmit(taskData, []); // Pass empty array for labels
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(parentTaskId ? 'Erro ao criar subtarefa' : 'Erro ao criar tarefa');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition.Root show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}} static>
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
              <Dialog.Panel 
                className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      {parentTaskId ? 'Cadastro de Subtarefa' : 'Nova Tarefa'}
                    </Dialog.Title>
                    <div className="mt-4">
                      <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Parent Task Reference - Only show for subtasks */}
                        {parentTaskId && parentTask && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tarefa Pai
                            </label>
                            <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700">
                              {parentTask.title}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                              Esta subtarefa será associada hierarquicamente à tarefa acima
                            </p>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {parentTaskId ? 'Nome da Subtarefa *' : 'Nome da Tarefa *'}
                          </label>
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
                            placeholder={parentTaskId ? "Digite o nome da subtarefa" : "Digite o nome da tarefa"}
                            required
                            disabled={isSubmitting}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {parentTaskId ? 'Descrição da subtarefa' : 'Descrição da tarefa'}
                          </label>
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
                            placeholder={parentTaskId ? "Descreva a subtarefa" : "Descreva a tarefa"}
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {parentTaskId ? 'Data inicial da subtarefa' : 'Data inicial da tarefa'}
                            </label>
                            <input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 cursor-pointer"
                              disabled={isSubmitting}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {parentTaskId ? 'Data fim da subtarefa' : 'Data fim da tarefa'}
                            </label>
                            <input
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 cursor-pointer"
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {parentTaskId ? 'Valor da Subtarefa (R$)' : 'Valor da Tarefa (R$)'}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder="0,00"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
                            disabled={isSubmitting}
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
                            disabled={isSubmitting}
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
                              className="text-sm text-primary-600 hover:text-primary-700 flex items-center disabled:opacity-50"
                              disabled={isSubmitting}
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
                                  disabled={isSubmitting}
                                />
                                {issueLinks.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveIssueLink(link.id)}
                                    className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                    disabled={isSubmitting}
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
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                            disabled={isSubmitting}
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                {parentTaskId ? 'Criando...' : 'Criando...'}
                              </>
                            ) : (
                              parentTaskId ? 'Criar Subtarefa' : 'Criar Tarefa'
                            )}
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
}