import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { toast } from 'react-hot-toast';
import { EnvelopeIcon, CheckCircleIcon, XCircleIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

type EmailSettings = Database['public']['Tables']['email_settings']['Row'];
type EmailTemplate = Database['public']['Tables']['email_templates']['Row'];

interface TestEmailData {
  email: string;
  subject: string;
  body: string;
  status: {
    validatingSettings: boolean;
    connectingSmtp: boolean;
    sendingEmail: boolean;
    success: boolean;
    error: string | null;
  };
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

export function EmailSettings() {
  const [formSettings, setFormSettings] = useState<Partial<EmailSettings>>(defaultSettings);
  const [testStatus, setTestStatus] = useState<{
    step: 'idle' | 'validating' | 'connecting' | 'sending' | 'complete' | 'error';
    error?: string;
  }>({ step: 'idle' });
  const [testData, setTestData] = useState<TestEmailData>({
    email: '',
    subject: 'Test Email Configuration',
    body: 'This is a test email to verify your SMTP configuration.',
    status: {
      validatingSettings: false,
      connectingSmtp: false,
      sendingEmail: false,
      success: false,
      error: null
    }
  });
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
      // Reset status
      setTestData(prev => ({
        ...prev,
        status: {
          validatingSettings: true,
          connectingSmtp: false,
          sendingEmail: false,
          success: false,
          error: null
        }
      }));
      
      // Validate settings
      if (!settings?.smtp_host || !settings?.smtp_port || !settings?.smtp_username || !settings?.smtp_password) {
        throw new Error('Please configure SMTP settings before sending test email');
      }
      
      // Update status to connecting
      setTestData(prev => ({
        ...prev,
        status: {
          ...prev.status,
          validatingSettings: false,
          connectingSmtp: true
        }
      }));
      
      // Small delay to show the connecting state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update status to sending
      setTestData(prev => ({
        ...prev,
        status: {
          ...prev.status,
          connectingSmtp: false,
          sendingEmail: true
        }
      }));
      
      const { error } = await supabase.functions.invoke('test-email', {
        body: data,
      });

      if (error) throw error;
      
      // Update status to success
      setTestData(prev => ({
        ...prev,
        status: {
          ...prev.status,
          sendingEmail: false,
          success: true
        }
      }));
    },
    onSuccess: () => {
      toast.success('Test email sent successfully');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setTestData({
          email: '',
          subject: 'Test Email Configuration',
          body: 'This is a test email to verify your SMTP configuration.',
          status: {
            validatingSettings: false,
            connectingSmtp: false,
            sendingEmail: false,
            success: false,
            error: null
          }
        });
      }, 3000);
    },
    onError: (error: Error) => {
      setTestData(prev => ({
        ...prev,
        status: {
          validatingSettings: false,
          connectingSmtp: false,
          sendingEmail: false,
          success: false,
          error: error.message || 'Failed to send test email'
        }
      }));
      toast.error(error.message || 'Failed to send test email');
    },
  });

  if (isLoadingSettings || isLoadingTemplates) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
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
                    value={template.subject}
                    onChange={(e) => {
                      const newTemplate = { ...template, subject: e.target.value };
                      updateTemplate.mutate(newTemplate);
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
                    value={template.body}
                    onChange={(e) => {
                      const newTemplate = { ...template, body: e.target.value };
                      updateTemplate.mutate(newTemplate);
                    }}
                    rows={6}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Available variables: {{name}}, {{link}}"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => updateTemplate.mutate(template)}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Save Template
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Test Email Configuration</h3>
        <p className="text-sm text-gray-500 mb-6">Send a test email to verify your SMTP settings are working correctly.</p>
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
          
          <div className="flex justify-end">
            <div className="flex-1">
              {(testData.status.validatingSettings || 
                testData.status.connectingSmtp || 
                testData.status.sendingEmail || 
                testData.status.success || 
                testData.status.error) && (
                <div className="flex items-center space-x-2">
                  {testData.status.error ? (
                    <div className="flex items-center text-red-600">
                      <XCircleIcon className="w-5 h-5 mr-2" />
                      <span className="text-sm">{testData.status.error}</span>
                    </div>
                  ) : testData.status.success ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                      <span className="text-sm">Email sent successfully!</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center text-primary-600">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent mr-2" />
                        <span className="text-sm">
                          {testData.status.validatingSettings && 'Validating settings...'}
                          {testData.status.connectingSmtp && 'Connecting to SMTP server...'}
                          {testData.status.sendingEmail && 'Sending email...'}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <div className={`h-1 flex-1 rounded ${testData.status.validatingSettings ? 'bg-primary-600' : 'bg-gray-200'}`} />
                        <div className={`h-1 flex-1 rounded ${testData.status.connectingSmtp ? 'bg-primary-600' : 'bg-gray-200'}`} />
                        <div className={`h-1 flex-1 rounded ${testData.status.sendingEmail ? 'bg-primary-600' : 'bg-gray-200'}`} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => testEmailConfig.mutate(testData)}
              disabled={!testData.email || testData.status.validatingSettings || testData.status.connectingSmtp || testData.status.sendingEmail}
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