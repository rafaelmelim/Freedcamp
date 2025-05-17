import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { toast } from 'react-hot-toast';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Role = Database['public']['Tables']['roles']['Row'];
type UserRole = Database['public']['Tables']['user_roles']['Row'];

export function AdminPage() {
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

  const assignRole = async (profileId: string, roleId: number) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert([{ profile_id: profileId, role_id: roleId }]);

      if (error) throw error;
      toast.success('Role assigned successfully');
    } catch (error) {
      toast.error('Failed to assign role');
    }
  };

  const removeRole = async (profileId: string, roleId: number) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('profile_id', profileId)
        .eq('role_id', roleId);

      if (error) throw error;
      toast.success('Role removed successfully');
    } catch (error) {
      toast.error('Failed to remove role');
    }
  };

  if (isLoadingProfiles || isLoadingRoles || isLoadingUserRoles) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500/10 to-primary-700/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">User Management</h1>
        
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
                    {profile.name}
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
                            onClick={() => removeRole(profile.id, role.id)}
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
                          assignRole(profile.id, roleId);
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
    </div>
  );
}