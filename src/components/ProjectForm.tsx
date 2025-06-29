import { useForm } from 'react-hook-form';
import { PlusIcon } from '@heroicons/react/24/outline';
import { formatSecondsToHHMMSS, parseHHMMSSToSeconds } from '../lib/utils';
import { Database } from '../lib/database.types';

type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type Project = Database['public']['Tables']['projects']['Row'];

interface ProjectFormData {
  title: string;
  estimated_value: string;
  actual_value: string;
  estimated_end_date: string;
  actual_end_date: string;
  analyst: string;
  description: string;
  estimated_hours: string;
  actual_hours: string;
}

interface ProjectFormProps {
  initialData?: Project | null;
  onSubmit: (project: ProjectInsert) => void;
  onCancel: () => void;
}

export function ProjectForm({ initialData, onSubmit, onCancel }: ProjectFormProps) {
  const isEditing = !!initialData;
  
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProjectFormData>({
    defaultValues: {
      title: initialData?.title || '',
      estimated_value: initialData?.estimated_value?.toString() || '',
      actual_value: initialData?.actual_value?.toString() || '',
      estimated_end_date: initialData?.estimated_end_date || '',
      actual_end_date: initialData?.actual_end_date || '',
      analyst: initialData?.analyst || '',
      description: initialData?.description || '',
      estimated_hours: formatSecondsToHHMMSS(initialData?.estimated_hours ?? null),
      actual_hours: formatSecondsToHHMMSS(initialData?.actual_hours ?? null),
    },
  });

  const handleFormSubmit = (data: ProjectFormData) => {
    const projectData: ProjectInsert = {
      title: data.title.trim(),
      position: 0,
      estimated_value: data.estimated_value ? parseFloat(data.estimated_value) : null,
      actual_value: data.actual_value ? parseFloat(data.actual_value) : null,
      estimated_end_date: data.estimated_end_date || null,
      actual_end_date: data.actual_end_date || null,
      analyst: data.analyst.trim() || null,
      description: data.description.trim() || null,
      estimated_hours: data.estimated_hours && data.estimated_hours !== '00:00:00' ? parseHHMMSSToSeconds(data.estimated_hours) : null,
      actual_hours: data.actual_hours && data.actual_hours !== '00:00:00' ? parseHHMMSSToSeconds(data.actual_hours) : null,
    };

    onSubmit(projectData);
  };

  const handleCancel = () => {
    if (isDirty) {
      if (confirm('Você tem alterações não salvas. Deseja realmente sair sem salvar?')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6 mb-8 w-full max-w-2xl">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label htmlFor="project-title" className="block text-sm font-medium text-gray-700 mb-2">
              Título do Projeto *
            </label>
            <input
              id="project-title"
              type="text"
              {...register('title', { required: 'O título do projeto é obrigatório' })}
              placeholder="Digite o título do projeto"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="estimated-value" className="block text-sm font-medium text-gray-700 mb-2">
                Valor Previsto
              </label>
              <input
                id="estimated-value"
                type="number"
                step="0.01"
                {...register('estimated_value')}
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label htmlFor="actual-value" className="block text-sm font-medium text-gray-700 mb-2">
                Valor Real
              </label>
              <input
                id="actual-value"
                type="number"
                step="0.01"
                {...register('actual_value')}
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="estimated-end-date" className="block text-sm font-medium text-gray-700 mb-2">
                Data Prevista para Término
              </label>
              <input
                id="estimated-end-date"
                type="date"
                {...register('estimated_end_date')}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label htmlFor="actual-end-date" className="block text-sm font-medium text-gray-700 mb-2">
                Data Real de Término
              </label>
              <input
                id="actual-end-date"
                type="date"
                {...register('actual_end_date')}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label htmlFor="analyst" className="block text-sm font-medium text-gray-700 mb-2">
              Analista do Projeto
            </label>
            <input
              id="analyst"
              type="text"
              {...register('analyst')}
              placeholder="Nome do analista responsável"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descrição do Projeto
            </label>
            <textarea
              id="description"
              {...register('description')}
              placeholder="Descreva o projeto"
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="estimated-hours" className="block text-sm font-medium text-gray-700 mb-2">
                Horas Previstas (hh:mm:ss)
              </label>
              <input
                id="estimated-hours"
                type="text"
                placeholder="00:00:00"
                {...register('estimated_hours')}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label htmlFor="actual-hours" className="block text-sm font-medium text-gray-700 mb-2">
                Horas Reais (hh:mm:ss)
              </label>
              <input
                id="actual-hours"
                type="text"
                placeholder="00:00:00"
                {...register('actual_hours')}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors duration-200"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            {isEditing ? 'Salvar Alterações' : 'Criar Projeto'}
          </button>
        </div>
      </form>
    </div>
  );
}