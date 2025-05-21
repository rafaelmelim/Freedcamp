import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { toast } from 'react-hot-toast';
import { Dialog } from '@headlessui/react';
import { EmailSettings } from '../components/EmailSettings';
import { Header } from '../components/Header';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Role = Database['public']['Tables']['roles']['Row'];
type UserRole = Database['public']['Tables']['user_roles']['Row'];

export function AdminPage() {
  const queryClient = useQueryClient();
  const [isEmailSettingsOpen, setIsEmailSettingsOpen] = useState(false);

  const { data: profiles, isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at');

      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: roles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Role[];
    },
  });

  const { data: userRoles, isLoading: isLoadingUserRoles } = useQuery({
    queryKey: ['user_roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');

      if (error) throw error;
      return data as UserRole[];
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ profileId, roleId }: { profileId: string; roleId: number }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert([{ profile_id: profileId, role_id: roleId }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_roles'] });
      toast.success('Role assigned successfully');
    },
    onError: () => {
      toast.error('Failed to assign role');
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ profileId, roleId }: { profileId: string; roleId: number }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('profile_id', profileId)
        .eq('role_id', roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_roles'] });
      toast.success('Role removed successfully');
    },
    onError: () => {
      toast.error('Failed to remove role');
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Profile updated successfully');
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  if (isLoadingProfiles || isLoadingRoles || isLoadingUserRoles) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500/10 to-primary-700/20">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">User Management</h2>
        
            <div className="bg-white/80 backdrop-blur-sm shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {profiles?.map((profile) => (
                <tr key={profile.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <input
                      type="text"
                      defaultValue={profile.name}
                      onBlur={(e) => {
                        const newName = e.target.value.trim();
                        if (newName && newName !== profile.name) {
                          updateProfileMutation.mutate({
                            id: profile.id,
                            name: newName,
                          });
                        }
                      }}
                      className="w-full px-2 py-1 border border-transparent rounded-md focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {profile.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-wrap gap-2">
                      {roles?.filter(role => 
                        userRoles?.some(ur => 
                          ur.profile_id === profile.id && ur.role_id === role.id
                        )
                      ).map(role => (
                        <span
                          key={role.id}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          {role.name}
                          <button
                            onClick={() => removeRoleMutation.mutate({
                              profileId: profile.id,
                              roleId: role.id,
                            })}
                            className="ml-1 text-primary-600 hover:text-primary-900"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <select
                      onChange={(e) => {
                        const roleId = parseInt(e.target.value);
                        if (roleId) {
                          assignRoleMutation.mutate({
                            profileId: profile.id,
                            roleId,
                          });
                          e.target.value = '';
                        }
                      }}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                      defaultValue=""
                    >
                      <option value="">Assign role...</option>
                      {roles?.filter(role =>
                        !userRoles?.some(ur =>
                          ur.profile_id === profile.id && ur.role_id === role.id
                        )
                      ).map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
          </div>
          
          <button
            onClick={() => setIsEmailSettingsOpen(true)}
            className="mt-8 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Configure Email Settings
          </button>

          <Dialog
            open={isEmailSettingsOpen}
            onClose={() => setIsEmailSettingsOpen(false)}
            className="relative z-50"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title className="text-xl font-semibold text-gray-900">
                    Email Configuration
                  </Dialog.Title>
                  <button
                    onClick={() => setIsEmailSettingsOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <EmailSettings />
              </Dialog.Panel>
            </div>
          </Dialog>
        </div>
      </div>
    </div>
  );
}