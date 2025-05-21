import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { HomeIcon, ArchiveBoxIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { EmailSettings } from '../components/EmailSettings';
import { Header } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Role = Database['public']['Tables']['roles']['Row'];
type UserRole = Database['public']['Tables']['user_roles']['Row'];

export function AdminPage() {
  const { signOut, hasRole } = useAuth();
  const queryClient = useQueryClient();

  const { data: profiles, isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;
      return data;
    },
  });

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
        <main className="flex-1 ml-64 p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <Link
              to="/board"
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white rounded-md shadow-sm hover:bg-gray-50"
            >
              Close
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-8">
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
          </div>
        </main>
      </div>
    </div>
  );
}