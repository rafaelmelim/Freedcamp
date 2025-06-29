import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { EmailTestForm } from '../components/EmailTestForm';
import { Header } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { HomeIcon, ArchiveBoxIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, EnvelopeIcon, UsersIcon, ComputerDesktopIcon, ArrowDownTrayIcon, UserCircleIcon } from '@heroicons/react/24/outline';

type EmailSettings = Database['public']['Tables']['email_settings']['Row'];
type EmailTemplate = Database['public']['Tables']['email_templates']['Row'];

const defaultSettings: Partial<EmailSettings> = {
  smtp_host: '',
  smtp_port: 587,
  smtp_ssl: true,
  smtp_username: '',
  smtp_password: '',
  sender_email: '',
  sender_name: '',
};

export function EmailSettingsPage() {
  const { signOut, hasRole } = useAuth();
  const [formSettings, setFormSettings] = useState<Partial<EmailSettings>>(defaultSettings);
  const [editedTemplates, setEditedTemplates] = useState<Record<string, EmailTemplate>>({});
  const queryClient = useQueryClient();

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['email-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_settings')
        .select('*')
        .limit(1);

      if (error) throw error;
      return data?.[0] || null;
    },
  });

  useEffect(() => {
    if (settings) {
      setFormSettings(settings);
    }
  }, [settings]);

  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*');

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (templates) {
      const templatesMap: Record<string, EmailTemplate> = {};
      templates.forEach(template => {
        templatesMap[template.id] = template;
      });
      setEditedTemplates(templatesMap);
    }
  }, [templates]);

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<EmailSettings>) => {
      if (settings?.id) {
        const { error } = await supabase
          .from('email_settings')
          .update({
            ...newSettings,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('email_settings')
          .insert([{
            ...newSettings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-settings'] });
      toast.success('Email settings saved successfully');
    },
    onError: () => {
      toast.error('Failed to update email settings');
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async (template: Partial<EmailTemplate>) => {
      const { error } = await supabase
        .from('email_templates')
        .upsert([{
          ...template,
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Email template saved successfully');
    },
    onError: () => {
      toast.error('Failed to update email template');
    },
  });

  if (isLoadingSettings || isLoadingTemplates) {
    return <div>Loading...</div>;
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
            </div>
            <div className="pt-4 mt-4 border-t border-gray-200">
              {hasRole('admin') && (<>
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
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-md"
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
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    <span>Importação e Exportação</span>
                  </Link>
                </div>
              </>)}
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md w-full text-left"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span>Sign out</span>
              </button>
            </div>
          </nav>
        </aside>
        <main className="flex-1 ml-64 p-8 space-y-8">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">SMTP Configuration</h3>
            <p className="text-sm text-gray-500 mb-6">Configure your email server settings to enable sending emails from your application.</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    SMTP Server *
                  </label>
                  <p className="text-xs text-gray-500 mb-1">The hostname of your SMTP server (e.g., smtp.gmail.com)</p>
                  <div className="flex">
                    <input
                      type="text"
                      value={formSettings.smtp_host}
                      onChange={(e) => setFormSettings({ ...formSettings, smtp_host: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="smtp.example.com"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Port *
                  </label>
                  <p className="text-xs text-gray-500 mb-1">SMTP port number (usually 465 for SSL or 587 for TLS)</p>
                  <div className="flex">
                    <input
                      type="number"
                      value={formSettings.smtp_port}
                      onChange={(e) => setFormSettings({ ...formSettings, smtp_port: parseInt(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="587"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formSettings.smtp_ssl}
                    onChange={(e) => setFormSettings({ ...formSettings, smtp_ssl: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2">
                    <span className="text-sm text-gray-700">Use SSL/TLS</span>
                    <p className="text-xs text-gray-500">Enable secure connection to your SMTP server</p>
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Username *
                  </label>
                  <p className="text-xs text-gray-500 mb-1">Your SMTP account username or email address</p>
                  <div className="flex">
                    <input
                      type="text"
                      value={formSettings.smtp_username}
                      onChange={(e) => setFormSettings({ ...formSettings, smtp_username: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password *
                  </label>
                  <p className="text-xs text-gray-500 mb-1">Your SMTP account password or app-specific password</p>
                  <div className="flex">
                    <input
                      type="password"
                      value={formSettings.smtp_password}
                      onChange={(e) => setFormSettings({ ...formSettings, smtp_password: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Sender Email *
                  </label>
                  <p className="text-xs text-gray-500 mb-1">The email address that will appear in the "From" field</p>
                  <div className="flex">
                    <input
                      type="email"
                      value={formSettings.sender_email}
                      onChange={(e) => setFormSettings({ ...formSettings, sender_email: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="noreply@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Sender Name
                  </label>
                  <p className="text-xs text-gray-500 mb-1">The name that will appear in the "From" field</p>
                  <div className="flex">
                    <input
                      type="text"
                      value={formSettings.sender_name}
                      onChange={(e) => setFormSettings({ ...formSettings, sender_name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="Your Company Name"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => updateSettings.mutate(formSettings)}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Email Templates</h3>
            <div className="space-y-6">
              {templates?.map((template) => (
                <div key={template.id} className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700">
                    {template.type === 'reset_password' ? 'Reset Password Email' : 'Registration Email'}
                  </h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={editedTemplates[template.id]?.subject || template.subject}
                        onChange={(e) => {
                          setEditedTemplates({
                            ...editedTemplates,
                            [template.id]: {
                              ...editedTemplates[template.id] || template,
                              subject: e.target.value
                            }
                          });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Body
                    </label>
                    <div className="flex">
                      <textarea
                        value={editedTemplates[template.id]?.body || template.body}
                        onChange={(e) => {
                          setEditedTemplates({
                            ...editedTemplates,
                            [template.id]: {
                              ...editedTemplates[template.id] || template,
                              body: e.target.value
                            }
                          });
                        }}
                        rows={6}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        placeholder="Available variables: {{name}}, {{link}}"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => updateTemplate.mutate(editedTemplates[template.id])}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Save Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-8 border-t border-gray-200">
              <EmailTestForm onClose={() => {}} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}