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
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    
    // Reset errors
    setErrors({});
    const newErrors: Record<string, string> = {};
    
    // Validate required fields
    if (!title.trim()) {
      newErrors.title = parentTaskId ? 'O nome da subtarefa é obrigatório' : 'O nome da tarefa é obrigatório';
    }

    // Validate dates
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      newErrors.endDate = 'A data final não pode ser anterior à data inicial';
    }

    // Validate value if provided
    if (value && (isNaN(parseFloat(value)) || parseFloat(value) < 0)) {
      newErrors.value = 'O valor deve ser um número positivo';
    }

    // Validate actual hours format
    if (actualHours && actualHours !== '00:00:00') {
      const timeRegex = /^([0-9]{1,2}):([0-5][0-9]):([0-5][0-9])$/;
      if (!timeRegex.test(actualHours)) {
        newErrors.actualHours = 'Formato deve ser hh:mm:ss (ex: 02:30:00)';
      }
    }

    // If there are errors, show them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Por favor, corrija os campos destacados em vermelho');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 grid place-items-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-4">
          {parentTaskId ? 'Cadastro de Subtarefa' : 'Nova Tarefa'}
        </h3>
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
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors duration-200 ${
                              errors.title 
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                : 'border-gray-300 focus:ring-primary-500'
                            }`}
                            placeholder={parentTaskId ? "Digite o nome da subtarefa" : "Digite o nome da tarefa"}
                            required
                            disabled={isSubmitting}
                          />
                          {errors.title && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {errors.title}
                            </p>
                          )}
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
                            <div className="relative">
                              <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 transition-colors duration-200 ${
                                  errors.startDate 
                                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                    : 'border-gray-300 focus:ring-primary-500'
                                }`}
                                disabled={isSubmitting}
                                style={{
                                  colorScheme: 'light',
                                  cursor: 'pointer'
                                }}
                              />
                              <div 
                                className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                                style={{ pointerEvents: 'none' }}
                              >
                                <svg 
                                  className="w-5 h-5 text-gray-400" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                                  />
                                </svg>
                              </div>
                            </div>
                            {errors.startDate && (
                              <p className="mt-1 text-sm text-red-600 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.startDate}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {parentTaskId ? 'Data fim da subtarefa' : 'Data fim da tarefa'}
                            </label>
                            <div className="relative">
                              <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 transition-colors duration-200 ${
                                  errors.endDate 
                                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                    : 'border-gray-300 focus:ring-primary-500'
                                }`}
                                disabled={isSubmitting}
                                style={{
                                  colorScheme: 'light',
                                  cursor: 'pointer'
                                }}
                              />
                              <div 
                                className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                                style={{ pointerEvents: 'none' }}
                              >
                                <svg 
                                  className="w-5 h-5 text-gray-400" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                                  />
                                </svg>
                              </div>
                            </div>
                            {errors.endDate && (
                              <p className="mt-1 text-sm text-red-600 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.endDate}
                              </p>
                            )}
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
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors duration-200 ${
                              errors.value 
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                : 'border-gray-300 focus:ring-primary-500'
                            }`}
                            disabled={isSubmitting}
                          />
                          {errors.value && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {errors.value}
                            </p>
                          )}
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
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors duration-200 ${
                              errors.actualHours 
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                : 'border-gray-300 focus:ring-primary-500'
                            }`}
                            disabled={isSubmitting}
                          />
                          {errors.actualHours && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {errors.actualHours}
                            </p>
                          )}
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

                        {/* Required Fields Notice */}
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                          <div className="flex items-start">
                            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <h4 className="text-sm font-medium text-blue-800 mb-1">
                                Campos Obrigatórios
                              </h4>
                              <ul className="text-sm text-blue-700 space-y-1">
                                <li className="flex items-center">
                                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                                  <strong>{parentTaskId ? 'Nome da Subtarefa' : 'Nome da Tarefa'}</strong> - Campo obrigatório
                                </li>
                              </ul>
                              <div className="mt-2 text-xs text-blue-600">
                                <strong>Campos Opcionais:</strong> Descrição, Datas, Valor, Horas Realizadas, Links de Issues
                              </div>
                            </div>
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
                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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
  );
}