import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { toast } from 'react-hot-toast';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

type EmailSettings = Database['public']['Tables']['email_settings']['Row'];
type EmailTemplate = Database['public']['Tables']['email_templates']['Row'];

interface TestEmailData {
  email: string;
  subject: string;
  body: string;
}

export function EmailSettings() {
  const [testData, setTestData] = useState<TestEmailData>({
    email: '',
    subject: 'Test Email Configuration',
    body: 'This is a test email to verify your SMTP configuration.',
  });
  const queryClient = useQueryClient();

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['email-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_settings')
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
  });

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
      const { error } = await supabase
        .from('email_settings')
        .upsert([{ 
          id: settings?.id || '', 
          ...settings, 
          ...newSettings,
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;
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
      const { error } = await supabase.functions.invoke('test-email', {
        body: data,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Test email sent successfully');
      setTestData({
        email: '',
        subject: 'Test Email Configuration',
        body: 'This is a test email to verify your SMTP configuration.',
      });
    },
    onError: () => {
      toast.error('Failed to send test email');
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
                defaultValue={settings?.smtp_host || ''}
                onChange={(e) => {
                  const newSettings = { ...settings, smtp_host: e.target.value };
                  settings = newSettings;
                }}
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
                defaultValue={settings?.smtp_port || ''}
                onChange={(e) => {
                  const newSettings = { ...settings, smtp_port: parseInt(e.target.value) };
                  settings = newSettings;
                }}
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
                defaultChecked={settings?.smtp_ssl || false}
                onChange={(e) => {
                  const newSettings = { ...settings, smtp_ssl: e.target.checked };
                  settings = newSettings;
                }}
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
                defaultValue={settings?.smtp_username || ''}
                onChange={(e) => {
                  const newSettings = { ...settings, smtp_username: e.target.value };
                  settings = newSettings;
                }}
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
                defaultValue={settings?.smtp_password || ''}
                onChange={(e) => {
                  const newSettings = { ...settings, smtp_password: e.target.value };
                  settings = newSettings;
                }}
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
                value={settings?.sender_email || ''}
                onChange={(e) => updateSettings.mutate({ sender_email: e.target.value })}
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
                value={settings?.sender_name || ''}
                onChange={(e) => updateSettings.mutate({ sender_name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Your Company Name"
              />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <button
              onClick={() => {
                updateSettings.mutate(settings || {});
                toast.success('Email settings saved successfully');
              }}
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
                  onClick={() => {
                    updateTemplate.mutate(template);
                    toast.success('Template saved successfully');
                  }}
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
            <button
              onClick={() => testEmailConfig.mutate(testData)}
              disabled={!testData.email || testEmailConfig.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {testEmailConfig.isPending ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}