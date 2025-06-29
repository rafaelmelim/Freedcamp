import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { toast } from 'react-hot-toast';
import { parseHHMMSSToSeconds } from '../lib/utils';
import { XMarkIcon } from '@heroicons/react/24/outline';

type Task = Database['public']['Tables']['tasks']['Insert'];

interface SubtaskFormProps {
  projectId: number;
  parentTaskId: number;
  onSubmit: (data: Task) => Promise<any>;
  onCancel: () => void;
}

export function SubtaskForm({ projectId, parentTaskId, onSubmit, onCancel }: SubtaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [value, setValue] = useState('');
  const [actualHours, setActualHours] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch parent task information
  const { data: parentTask } = useQuery({
    queryKey: ['parent-task', parentTaskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title')
        .eq('id', parentTaskId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Validate required fields
    if (!title.trim()) {
      toast.error('O nome da subtarefa é obrigatório');
      return;
    }

    setIsSubmitting(true);

    try {
      const taskData: Task = {
        title: title.trim(),
        description: description.trim() || null,
        project_id: projectId,
        parent_task_id: parentTaskId,
        position: 0,
        due_date: dueDate || null,
        priority: 'medium',
        value: value ? parseFloat(value) : null,
        actual_hours: actualHours ? parseHHMMSSToSeconds(actualHours) : null,
      };

      await onSubmit(taskData);
      
      // Reset form
      setTitle('');
      setDescription('');
      setDueDate('');
      setValue('');
      setActualHours('');
      
      toast.success('Subtarefa criada com sucesso');
    } catch (error) {
      console.error('Error creating subtask:', error);
      toast.error('Erro ao criar subtarefa');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Nova Subtarefa
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Parent Task Reference */}
        {parentTask && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center text-sm text-blue-800">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Tarefa Pai:</span>
              <span className="ml-1 font-semibold">{parentTask.title}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Subtarefa *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Digite o nome da subtarefa"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Descreva a subtarefa"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Entrega
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0,00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Criando...' : 'Criar Subtarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}