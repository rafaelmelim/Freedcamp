import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { toast } from 'react-hot-toast';
import { EnvelopeIcon, CheckCircleIcon, XCircleIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

type EmailSettings = Database['public']['Tables']['email_settings']['Row'];

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

export function EmailTestForm() {
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

  const { data: settings } = useQuery({
    queryKey: ['email-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_settings')
        .select('*')
        .limit(1);

      if (error) throw error;
      return data?.[0] as EmailSettings | null;
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

  return (
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
  );
}