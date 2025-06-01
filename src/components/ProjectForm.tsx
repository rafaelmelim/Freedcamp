import { useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';

type ProjectInsert = Database['public']['Tables']['projects']['Insert'];

interface ProjectFormProps {
  onSubmit: (project: ProjectInsert) => void;
  onCancel: () => void;
}

export function ProjectForm({ onSubmit, onCancel }: ProjectFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [position, setPosition] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('O título do projeto é obrigatório');
      return;
    }

    onSubmit({
      title: title.trim(),
      position,
      owner_id: user?.id,
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Novo Projeto</h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-500"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="project-title" className="block text-sm font-medium text-gray-700 mb-2">
            Título do Projeto
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

        <div>
          <label htmlFor="project-position" className="block text-sm font-medium text-gray-700 mb-2">
            Posição
          </label>
          <input
            id="project-position"
            type="number"
            value={position}
            onChange={(e) => setPosition(parseInt(e.target.value) || 0)}
            min="0"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
          />
          <p className="mt-1 text-sm text-gray-500">
            Ordem de exibição do projeto no quadro
          </p>
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