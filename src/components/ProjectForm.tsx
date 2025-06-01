import { useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { Database } from '../lib/database.types';

type ProjectInsert = Database['public']['Tables']['projects']['Insert'];

interface ProjectFormProps {
  onSubmit: (project: ProjectInsert) => void;
  onCancel: () => void;
}

export function ProjectForm({ onSubmit, onCancel }: ProjectFormProps) {
  const [title, setTitle] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [actualValue, setActualValue] = useState('');
  const [estimatedEndDate, setEstimatedEndDate] = useState('');
  const [actualEndDate, setActualEndDate] = useState('');
  const [analyst, setAnalyst] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [actualHours, setActualHours] = useState('');
  const [showActivities, setShowActivities] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('O título do projeto é obrigatório');
      return;
    }

    onSubmit({
      title: title.trim(),
      position: 0,
      estimated_value: estimatedValue ? parseFloat(estimatedValue) : null,
      actual_value: actualValue ? parseFloat(actualValue) : null,
      estimated_end_date: estimatedEndDate || null,
      actual_end_date: actualEndDate || null,
      analyst: analyst.trim() || null,
      description: description.trim() || null,
      estimated_hours: estimatedHours ? parseInt(estimatedHours) : null,
      actual_hours: actualHours ? parseInt(actualHours) : null,
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6 mb-8 w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label htmlFor="project-title" className="block text-sm font-medium text-gray-700 mb-2">
              Título do Projeto *
            </label>
            <input
              id="project-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título do projeto"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              required
            />
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
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
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
                value={actualValue}
                onChange={(e) => setActualValue(e.target.value)}
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
                value={estimatedEndDate}
                onChange={(e) => setEstimatedEndDate(e.target.value)}
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
                value={actualEndDate}
                onChange={(e) => setActualEndDate(e.target.value)}
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
              value={analyst}
              onChange={(e) => setAnalyst(e.target.value)}
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o projeto"
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="estimated-hours" className="block text-sm font-medium text-gray-700 mb-2">
                Horas Previstas
              </label>
              <input
                id="estimated-hours"
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label htmlFor="actual-hours" className="block text-sm font-medium text-gray-700 mb-2">
                Horas Reais
              </label>
              <input
                id="actual-hours"
                type="number"
                value={actualHours}
                onChange={(e) => setActualHours(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowActivities(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Adicionar Atividades
            </button>
          </div>

          {showActivities && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Atividades</h3>
                <button
                  type="button"
                  onClick={() => setShowActivities(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              {/* Activities form content will be added here */}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors duration-200"
            disabled={!title.trim()}
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Criar Projeto
          </button>
        </div>
      </form>
    </div>
  );
}