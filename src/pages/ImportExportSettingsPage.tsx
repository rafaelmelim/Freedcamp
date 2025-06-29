import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import {
  HomeIcon,
  ArchiveBoxIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  EnvelopeIcon,
  UsersIcon,
  ComputerDesktopIcon,
  ArrowDownTrayIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

type ImportExportSetting = Database['public']['Tables']['import_export_settings']['Row'];

export function ImportExportSettingsPage() {
  const { signOut, hasRole, user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: settings, isLoading } = useQuery({
    queryKey: ['import-export-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('import_export_settings')
        .select('*')
        .order('field_name');

      if (error) throw error;
      return data as ImportExportSetting[];
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('import_export_settings')
        .update({ 
          enabled,
          owner_id: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-export-settings'] });
      toast.success('Configurações atualizadas com sucesso');
    },
    onError: () => {
      toast.error('Erro ao atualizar configurações');
    },
  });

  const handleFieldToggle = (setting: ImportExportSetting) => {
    updateSetting.mutate({
      id: setting.id,
      enabled: !setting.enabled,
    });
  };

  const projectFields = settings?.filter(s => s.entity_type === 'project') || [];
  const taskFields = settings?.filter(s => s.entity_type === 'task') || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500/10 to-primary-700/20">
      <Header />
      <div className="flex h-screen pt-16">
        <aside className="w-64 bg-white border-r border-gray-200 fixed left-0 top-16 bottom-0 overflow-y-auto">
          <nav className="p-4 space-y-2">
            <div className="pb-4 mb-4 border-b border-gray-200">
              <Link
                to="/board"
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                <HomeIcon className="w-5 h-5" />
                <span>Página Inicial</span>
              </Link>
              <Link
                to="/archived"
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                <ArchiveBoxIcon className="w-5 h-5" />
                <span>Projetos Arquivados</span>
              </Link>
            </div>
            <div className="pt-4 mt-4 border-t border-gray-200">
              {hasRole('admin') && (
                <>
                  <Link
                    to="/admin"
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    <Cog6ToothIcon className="w-5 h-5" />
                    <span>Configurações</span>
                  </Link>
                  <div className="mt-2 pl-4 space-y-2">
                    <Link
                      to="/admin/email"
                      className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                      <EnvelopeIcon className="w-5 h-5" />
                      <span>E-mail</span>
                    </Link>
                    <Link
                      to="/admin/user-profiles"
                      className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                      <UserCircleIcon className="w-5 h-5" />
                      <span>Cadastro de Usuários</span>
                    </Link>
                    <Link
                      to="/admin/users"
                      className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                      <UsersIcon className="w-5 h-5" />
                      <span>Cadastro de Perfis</span>
                    </Link>
                    <Link
                      to="/admin/system"
                      className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                      <ComputerDesktopIcon className="w-5 h-5" />
                      <span>Sistema</span>
                    </Link>
                    <Link
                      to="/admin/import-export"
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-md"
                    >
                      <ArrowDownTrayIcon className="w-5 h-5" />
                      <span>Importação e Exportação</span>
                    </Link>
                  </div>
                </>
              )}
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md w-full text-left"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </div>
          </nav>
        </aside>

        <main className="flex-1 ml-64 p-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Configurações de Importação e Exportação</h2>

            <div className="space-y-6">
              {/* Projects Section */}
              <div className="bg-white shadow-sm rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Campos de Projetos</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Selecione os campos que devem ser incluídos na importação e exportação de projetos.
                </p>
                <div className="space-y-4">
                  {projectFields.map((field) => (
                    <div key={field.id} className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          checked={field.enabled}
                          onChange={() => handleFieldToggle(field)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </div>
                      <div className="ml-3">
                        <label className="text-sm font-medium text-gray-700">
                          {field.label}
                        </label>
                        <p className="text-sm text-gray-500">{field.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tasks Section */}
              <div className="bg-white shadow-sm rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Campos de Tarefas</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Selecione os campos que devem ser incluídos na importação e exportação de tarefas.
                </p>
                <div className="space-y-4">
                  {taskFields.map((field) => (
                    <div key={field.id} className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          checked={field.enabled}
                          onChange={() => handleFieldToggle(field)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </div>
                      <div className="ml-3">
                        <label className="text-sm font-medium text-gray-700">
                          {field.label}
                        </label>
                        <p className="text-sm text-gray-500">{field.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}