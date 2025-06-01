import { useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Database } from '../lib/database.types';
import { toast } from 'react-hot-toast';

type Task = Database['public']['Tables']['tasks']['Insert'];

interface TaskFormProps {
  projectId: number;
  onSubmit: (data: Task) => void;
  onCancel: () => void;
}

interface IssueLink {
  id: string;
  url: string;
}

export function TaskForm({ projectId, onSubmit, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [issueLinks, setIssueLinks] = useState<IssueLink[]>([{ id: '1', url: '' }]);

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
    
    if (!title.trim()) {
      toast.error('O nome da tarefa é obrigatório');
      return;
    }

    // Format issue links as part of the description
    const issueLinksText = issueLinks
      .filter(link => link.url.trim())
      .map(link => link.url.trim())
      .join('\n');

    const fullDescription = description.trim() + (issueLinksText ? `\n\nIssues:\n${issueLinksText}` : '');

    onSubmit({
      title: title.trim(),
      description: fullDescription || null,
      project_id: projectId,
      position: 0,
      due_date: endDate || null,
      priority: 'medium',
    });
  };

  return (
    <div className="glass-card p-4 animate-fade-in">
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
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
          >
            Criar Tarefa
          </button>
        </div>
      </form>
    </div>
  );
}