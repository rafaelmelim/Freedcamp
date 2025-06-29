import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database, TaskStatus } from '../lib/database.types';
import { toast } from 'react-hot-toast';
import { parseHHMMSSToSeconds, formatSecondsToHHMMSS } from '../lib/utils';
import { ConfirmationModal } from './ConfirmationModal';
import { TimeTracking } from './TimeTracking';
import { TrashIcon } from '@heroicons/react/24/outline';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];

interface SubtaskFormProps {
  projectId: number;
  parentTaskId: number;
  initialData?: Task | null;
  onSubmit: (data: TaskInsert) => Promise<any>;
  onUpdate?: (taskId: number, data: Partial<Task>) => void;
  onDelete?: (taskId: number) => void;
  onCancel: () => void;
}

interface SubtaskFormData {
  title: string;
  description: string;
  due_date: string;
  value: string;
  actual_hours: string;
  status: TaskStatus;
}

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'concluida', label: 'Concluída' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'nao_iniciada', label: 'Não iniciada' },
];

export function SubtaskForm({ 
  projectId, 
  parentTaskId, 
  initialData, 
  onSubmit, 
  onUpdate, 
  onDelete, 
  onCancel 
}: SubtaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const isEditing = !!initialData;

  const { register, handleSubmit, formState: { errors } } = useForm<SubtaskFormData>({
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      due_date: initialData?.due_date || '',
      value: initialData?.value?.toString() || '',
      actual_hours: formatSecondsToHHMMSS(initialData?.actual_hours ?? null),
      status: initialData?.status || 'nao_iniciada',
    },
  });

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

  const onFormSubmit = async (data: SubtaskFormData) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);

    try {
      if (isEditing && initialData && onUpdate) {
        // Update existing subtask
        const updateData: Partial<Task> = {
          title: data.title.trim(),
          description: data.description.trim() || null,
          due_date: data.due_date || null,
          value: data.value ? parseFloat(data.value) : null,
          actual_hours: data.actual_hours && data.actual_hours !== '00:00:00' ? parseHHMMSSToSeconds(data.actual_hours) : null,
          status: data.status,
        };

        onUpdate(initialData.id, updateData);
        toast.success('Subtarefa atualizada com sucesso');
      } else {
        // Create new subtask
        const taskData: TaskInsert = {
          title: data.title.trim(),
          description: data.description.trim() || null,
          project_id: projectId,
          parent_task_id: parentTaskId,
          position: 0,
          due_date: data.due_date || null,
          priority: 'medium',
          value: data.value ? parseFloat(data.value) : null,
          actual_hours: data.actual_hours && data.actual_hours !== '00:00:00' ? parseHHMMSSToSeconds(data.actual_hours) : null,
          status: data.status,
        };

        await onSubmit(taskData);
        toast.success('Subtarefa criada com sucesso');
      }
    } catch (error) {
      console.error('Error with subtask:', error);
      toast.error(isEditing ? 'Erro ao atualizar subtarefa' : 'Erro ao criar subtarefa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (initialData && onDelete) {
      onDelete(initialData.id);
      setShowDeleteConfirmation(false);
      toast.success('Subtarefa excluída com sucesso');
    }
  };

  return (
    <>
      <div className="w-full max-w-2xl">
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

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Subtarefa *
            </label>
            <input
              type="text"
              {...register('title', { required: 'O nome da subtarefa é obrigatório' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Digite o nome da subtarefa"
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              {...register('description')}
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
              {...register('due_date')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status da Subtarefa
            </label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isSubmitting}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={!isEditing ? 'hidden' : ''}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor da Subtarefa (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register('value')}
              placeholder="0,00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isSubmitting}
            />
          </div>

          <div className={!isEditing ? 'hidden' : ''}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Horas Realizadas (hh:mm:ss)
            </label>
            <input
              type="text"
              {...register('actual_hours')}
              placeholder="00:00:00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isSubmitting}
            />
          </div>

          {/* Time Tracking - only show in edit mode when task ID exists */}
          {isEditing && initialData && (
            <div>
              <TimeTracking taskId={initialData.id} />
            </div>
          )}

          <div className="flex justify-between pt-4">
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirmation(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 focus:outline-none"
                disabled={isSubmitting}
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Excluir Subtarefa
              </button>
            )}

            <div className="flex justify-end space-x-3 ml-auto">
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
                {isSubmitting ? 
                  (isEditing ? 'Salvando...' : 'Criando...') : 
                  (isEditing ? 'Salvar Alterações' : 'Criar Subtarefa')
                }
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDelete}
        title="Excluir Subtarefa"
        message="Tem certeza que deseja excluir esta subtarefa? Esta ação não pode ser desfeita."
        confirmText="Confirmar exclusão"
        isLoading={false}
      />
    </>
  );
}