import { useState, useEffect } from 'react';
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
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

type SystemSettings = Database['public']['Tables']['system_settings']['Row'];

const layoutOptions = [
  { value: 'default', label: 'Padrão' },
  { value: 'compact', label: 'Compacto' },
  { value: 'comfortable', label: 'Confortável' },
];

const formPositionOptions = [
  { value: 'left', label: 'Esquerda' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Direita' },
];

const styleOptions = [
  { value: 'default', label: 'Padrão' },
  { value: 'minimal', label: 'Minimalista' },
  { value: 'modern', label: 'Moderno' },
  { value: 'classic', label: 'Clássico' },
];

export function SystemSettingsPage() {
  const { signOut, hasRole } = useAuth();
  const [reportsMenuOpen, setReportsMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Partial<SystemSettings>>({
    site_name: '',
    site_description: '',
    primary_color: '#0EA5E9',
    form_position: 'center',
    header_style: 'default',
    footer_style: 'default',
    system_font_color: '#000000',
    default_header_description: '',
    form_layout: 'default',
    logo_url: '',
    favicon_url: '',
    footer_text: '',
    layout_type: 'default'
  });
  const [previewColor, setPreviewColor] = useState(settings.primary_color || '#0EA5E9');
  const [previewFontColor, setPreviewFontColor] = useState(settings.system_font_color || '#000000');

  const { data: currentSettings, isLoading, error } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching settings:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      if (data) {
        setSettings(data);
        setPreviewColor(data.primary_color || '#0EA5E9');
        
        // Apply settings to document
        document.documentElement.style.setProperty('--primary-50', `${data.primary_color}10`);
        document.documentElement.style.setProperty('--primary-100', `${data.primary_color}20`);
        document.documentElement.style.setProperty('--primary-200', `${data.primary_color}30`);
        document.documentElement.style.setProperty('--primary-300', `${data.primary_color}40`);
        document.documentElement.style.setProperty('--primary-400', `${data.primary_color}50`);
        document.documentElement.style.setProperty('--primary-500', data.primary_color);
        document.documentElement.style.setProperty('--primary-600', `${data.primary_color}70`);
        document.documentElement.style.setProperty('--primary-700', `${data.primary_color}80`);
        document.documentElement.style.setProperty('--primary-800', `${data.primary_color}90`);
        document.documentElement.style.setProperty('--primary-900', `${data.primary_color}95`);
        document.documentElement.style.setProperty('--primary-950', `${data.primary_color}99`);

        // Update favicon if set
        if (data.favicon_url) {
          const favicon = document.querySelector('link[rel="icon"]');
          if (favicon) {
            favicon.setAttribute('href', data.favicon_url);
          } else {
            const newFavicon = document.createElement('link');
            newFavicon.rel = 'icon';
            newFavicon.href = data.favicon_url;
            document.head.appendChild(newFavicon);
          }
        }

        // Update document title
        if (data.site_name) {
          document.title = data.site_name;
        }
      }
    },
    onError: (error) => {
      toast.error('Erro ao carregar configurações');
      console.error('Error:', error);
    }
  });

  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings);
      setPreviewColor(currentSettings.primary_color || '#0EA5E9');
    }
  }, [currentSettings]);

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<SystemSettings>) => {
      const { error } = await supabase
        .from('system_settings')
        .update({
          ...newSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentSettings?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Refresh settings
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success('Configurações atualizadas com sucesso');
      
      // Update preview immediately
      if (settings.primary_color) {
        document.documentElement.style.setProperty('--primary-50', `${settings.primary_color}10`);
        document.documentElement.style.setProperty('--primary-100', `${settings.primary_color}20`);
        document.documentElement.style.setProperty('--primary-200', `${settings.primary_color}30`);
        document.documentElement.style.setProperty('--primary-300', `${settings.primary_color}40`);
        document.documentElement.style.setProperty('--primary-400', `${settings.primary_color}50`);
        document.documentElement.style.setProperty('--primary-500', settings.primary_color);
        document.documentElement.style.setProperty('--primary-600', `${settings.primary_color}70`);
        document.documentElement.style.setProperty('--primary-700', `${settings.primary_color}80`);
        document.documentElement.style.setProperty('--primary-800', `${settings.primary_color}90`);
        document.documentElement.style.setProperty('--primary-900', `${settings.primary_color}95`);
        document.documentElement.style.setProperty('--primary-950', `${settings.primary_color}99`);
      }

      // Update favicon
      if (settings.favicon_url) {
        const favicon = document.querySelector('link[rel="icon"]');
        if (favicon) {
          favicon.setAttribute('href', settings.favicon_url);
        }
      }

      // Update document title
      if (settings.site_name) {
        document.title = settings.site_name;
      }
    },
    onError: () => {
      toast.error('Erro ao atualizar configurações');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate(settings);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

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
              <button
                onClick={() => setReportsMenuOpen(!reportsMenuOpen)}
                className="flex items-center justify-between w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                <div className="flex items-center space-x-2">
                  <ChartBarIcon className="w-5 h-5" />
                  <span>Relatórios Gerenciais</span>
                </div>
                {reportsMenuOpen ? (
                  <ChevronDownIcon className="w-4 h-4" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </button>
              {reportsMenuOpen && (
                <div className="ml-4 space-y-2">
                  <Link
                    to="/reports/charts"
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    <ChartBarIcon className="w-4 h-4" />
                    <span>Gráficos</span>
                  </Link>
                </div>
              )}
            </div>
            <div className="pt-4 mt-4 border-t border-gray-200">
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
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Configurações do Sistema</h2>
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white shadow-sm rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nome do Sistema
                    </label>
                    <input
                      type="text"
                      value={settings.site_name || ''}
                      onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Descrição
                    </label>
                    <textarea
                      value={settings.site_description || ''}
                      onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-sm rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Aparência</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Posição do Formulário
                    </label>
                    <select
                      value={settings.form_position || 'center'}
                      onChange={(e) => setSettings({ ...settings, form_position: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      {formPositionOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Estilo do Cabeçalho
                    </label>
                    <select
                      value={settings.header_style || 'default'}
                      onChange={(e) => setSettings({ ...settings, header_style: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      {styleOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Estilo do Rodapé
                    </label>
                    <select
                      value={settings.footer_style || 'default'}
                      onChange={(e) => setSettings({ ...settings, footer_style: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      {styleOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Cor da Fonte do Sistema
                    </label>
                    <div className="mt-1 flex items-center gap-4">
                      <input
                        type="color"
                        value={previewFontColor}
                        onChange={(e) => {
                          setPreviewFontColor(e.target.value);
                          setSettings({ ...settings, system_font_color: e.target.value });
                        }}
                        className="h-10 w-20"
                      />
                      <input
                        type="text"
                        value={previewFontColor}
                        onChange={(e) => {
                          setPreviewFontColor(e.target.value);
                          setSettings({ ...settings, system_font_color: e.target.value });
                        }}
                        className="w-28 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Descrição Padrão dos Cabeçalhos
                    </label>
                    <textarea
                      value={settings.default_header_description || ''}
                      onChange={(e) => setSettings({ ...settings, default_header_description: e.target.value })}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="Descrição padrão que aparecerá nos cabeçalhos do sistema"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Layout do Formulário
                    </label>
                    <select
                      value={settings.form_layout || 'default'}
                      onChange={(e) => setSettings({ ...settings, form_layout: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      {styleOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Cor Primária
                    </label>
                    <div className="mt-1 flex items-center gap-4">
                      <input
                        type="color"
                        value={previewColor}
                        onChange={(e) => {
                          setPreviewColor(e.target.value);
                          setSettings({ ...settings, primary_color: e.target.value });
                        }}
                        className="h-10 w-20"
                      />
                      <input
                        type="text"
                        value={previewColor}
                        onChange={(e) => {
                          setPreviewColor(e.target.value);
                          setSettings({ ...settings, primary_color: e.target.value });
                        }}
                        className="w-28 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      URL do Logo
                    </label>
                    <input
                      type="url"
                      value={settings.logo_url || ''}
                      onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="https://exemplo.com/logo.png"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      URL do Favicon
                    </label>
                    <input
                      type="url"
                      value={settings.favicon_url || ''}
                      onChange={(e) => setSettings({ ...settings, favicon_url: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="https://exemplo.com/favicon.ico"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Layout
                    </label>
                    <select
                      value={settings.layout_type || 'default'}
                      onChange={(e) => setSettings({ ...settings, layout_type: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      {layoutOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-sm rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Rodapé</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Texto do Rodapé
                  </label>
                  <textarea
                    value={settings.footer_text || ''}
                    onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Salvar Configurações
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}