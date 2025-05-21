import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { toast } from 'react-hot-toast';
import { EmailTestForm } from '../components/EmailTestForm';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { HomeIcon, ArchiveBoxIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, XMarkIcon, EnvelopeIcon, XCircleIcon, CheckCircleIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

type EmailSettings = Database['public']['Tables']['email_settings']['Row'];
type EmailTemplate = Database['public']['Tables']['email_templates']['Row'];

interface TestEmailData {
  email: string;
  subject: string;
  body: string;
}

const defaultSettings: Partial<EmailSettings> = {
  smtp_host: '',
  smtp_port: 587,
  smtp_ssl: true,
  smtp_username: '',
  smtp_password: '',
  sender_email: '',
  sender_name: '',
};

export function AdminPage() {
  const { signOut, hasRole } = useAuth();
  const [formSettings, setFormSettings] = useState<Partial<EmailSettings>>(defaultSettings);
  const [testStatus, setTestStatus] = useState<{
    step: 'idle' | 'validating' | 'connecting' | 'sending' | 'complete' | 'error';
    error?: string;
  }>({ step: 'idle' });
  const [testData, setTestData] = useState<TestEmailData>({
    email: '',
    subject: 'Test Email Configuration',
    body: 'This is a test email to verify your SMTP configuration.',
  });
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

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<EmailSettings>) => {
      if (settings?.id) {
        // Update existing settings
        const { error } = await supabase
          .from('email_settings')
          .update({
            ...newSettings,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        // Insert new settings
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

  useEffect(() => {
    if (templates) {
      const templatesMap: Record<string, EmailTemplate> = {};
      templates.forEach(template => {
        templatesMap[template.id] = template;
      });
      setEditedTemplates(templatesMap);
    }
  }, [templates]);

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

  const testEmailConfig = useMutation({
    mutationFn: async (data: TestEmailData) => {
      setTestStatus({ step: 'validating' });
      
      // Validate settings
      if (!settings?.smtp_host || !settings?.smtp_port || !settings?.smtp_username || !settings?.smtp_password) {
        throw new Error('Please configure SMTP settings before sending test email');
      }
      
      setTestStatus({ step: 'connecting' });
      
      // Small delay to show the connecting state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTestStatus({ step: 'sending' });
      
      const { error } = await supabase.functions.invoke('test-email', {
        body: data,
      });

      if (error) throw error;
      
      setTestStatus({ step: 'complete' });
    },
    onSuccess: () => {
      toast.success('Test email sent successfully');
      setTestData({
        email: '',
        subject: 'Test Email Configuration',
        body: 'This is a test email to verify your SMTP configuration.',
      });
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setTestStatus({ step: 'idle' });
      }, 3000);
    },
    onError: (error: Error) => {
      setTestStatus({ 
        step: 'error',
        error: error.message || 'Failed to send test email'
      });
      toast.error(error.message || 'Failed to send test email');
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
                <span>My Board</span>
              </Link>
              <Link
                to="/archived"
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                <ArchiveBoxIcon className="w-5 h-5" />
                <span>Archived</span>
              </Link>
            </div>
            <div className="pt-4 mt-4 border-t border-gray-200">
              {hasRole('admin') && (
                <Link
                  to="/admin"
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-md"
                >
                  <Cog6ToothIcon className="w-5 h-5" />
                  <span>Settings</span>
                </Link>
              )}
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
          </div>
        </main>
      </div>

      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setTestStatus({ step: 'idle' })}
              className="absolute top-4 left-4 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-medium text-gray-900 ml-8">Test Email Configuration</h3>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Recipient Email
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                    <EnvelopeIcon className="h-5 w-5" />
                  </span>
                  <input
                    type="email"
                    value={testData.email}
                    onChange={(e) => setTestData({ ...testData, email: e.target.value })}
                    placeholder="test@example.com"
                    className="flex-1 rounded-none rounded-r-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Subject
                </label>
                <input
                  type="text"
                  value={testData.subject}
                  onChange={(e) => setTestData({ ...testData, subject: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  value={testData.body}
                  onChange={(e) => setTestData({ ...testData, body: e.target.value })}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="border-l border-gray-200 pl-8">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Status</h4>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                      testStatus.step === 'validating' ? 'bg-primary-100' :
                      testStatus.step === 'error' ? 'bg-red-100' :
                      testStatus.step === 'complete' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {testStatus.step === 'validating' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent" />
                      ) : testStatus.step === 'error' ? (
                        <XCircleIcon className="h-4 w-4 text-red-600" />
                      ) : testStatus.step === 'complete' ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <span className="h-4 w-4 rounded-full bg-gray-300" />
                      )}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">Validating Settings</p>
                      <p className="text-sm text-gray-500">Checking SMTP configuration</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                      testStatus.step === 'connecting' ? 'bg-primary-100' :
                      testStatus.step === 'error' && testStatus.step !== 'validating' ? 'bg-red-100' :
                      testStatus.step === 'complete' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {testStatus.step === 'connecting' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent" />
                      ) : testStatus.step === 'error' && testStatus.step !== 'validating' ? (
                        <XCircleIcon className="h-4 w-4 text-red-600" />
                      ) : testStatus.step === 'complete' ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <span className="h-4 w-4 rounded-full bg-gray-300" />
                      )}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">Connecting to SMTP Server</p>
                      <p className="text-sm text-gray-500">Establishing secure connection</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                      testStatus.step === 'sending' ? 'bg-primary-100' :
                      testStatus.step === 'error' && testStatus.step !== 'validating' && testStatus.step !== 'connecting' ? 'bg-red-100' :
                      testStatus.step === 'complete' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {testStatus.step === 'sending' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent" />
                      ) : testStatus.step === 'error' && testStatus.step !== 'validating' && testStatus.step !== 'connecting' ? (
                        <XCircleIcon className="h-4 w-4 text-red-600" />
                      ) : testStatus.step === 'complete' ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <span className="h-4 w-4 rounded-full bg-gray-300" />
                      )}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">Sending Email</p>
                      <p className="text-sm text-gray-500">Delivering test message</p>
                    </div>
                  </div>
                </div>

                {testStatus.step === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <XCircleIcon className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{testStatus.error}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {testStatus.step === 'complete' && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex">
                      <CheckCircleIcon className="h-5 w-5 text-green-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">Success</h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>Test email sent successfully!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={() => testEmailConfig.mutate(testData)}
              disabled={!testData.email || testStatus.step !== 'idle'}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <PaperAirplaneIcon className="h-4 w-4 mr-2" />
              Send Test Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}