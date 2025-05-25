import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { toast } from 'react-hot-toast';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Role = Database['public']['Tables']['roles']['Row'];
type UserRole = Database['public']['Tables']['user_roles']['Row'];

export function RoleManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const queryClient = useQueryClient();

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('name');

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: roles } = useQuery({
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

  const { data: userRoles } = useQuery({
    queryKey: ['user-roles', selectedUser?.id],
    enabled: !!selectedUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role_id')
        .eq('profile_id', selectedUser!.id);

      if (error) throw error;
      return data as UserRole[];
    },
  });

  const toggleRole = useMutation({
    mutationFn: async ({ userId, roleId, isAdding }: { userId: string; roleId: number; isAdding: boolean }) => {
      if (isAdding) {
        const { error } = await supabase
          .from('user_roles')
          .insert([{ profile_id: userId, role_id: roleId }]);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('profile_id', userId)
          .eq('role_id', roleId);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast.success('User roles updated successfully');
    },
    onError: () => {
      toast.error('Failed to update user roles');
    },
  });

  const handleUserSelect = (user: Profile) => {
    setSelectedUser(user);
  };

  const handleRoleToggle = (roleId: number) => {
    if (!selectedUser) return;

    const hasRole = userRoles?.some(ur => ur.role_id === roleId);
    toggleRole.mutate({
      userId: selectedUser.id,
      roleId,
      isAdding: !hasRole,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Gerenciamento de Perfis</h3>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar usuário por nome ou email..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        {isLoadingUsers ? (
          <div className="mt-4 text-center">Carregando...</div>
        ) : (
          <div className="mt-4 divide-y divide-gray-200">
            {users?.map((user) => (
              <div
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className={`py-4 cursor-pointer hover:bg-gray-50 ${
                  selectedUser?.id === user.id ? 'bg-primary-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{user.name}</h4>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(user.created_at!).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
            {users?.length === 0 && (
              <div className="py-4 text-center text-gray-500">
                Nenhum usuário encontrado
              </div>
            )}
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900">Perfis do Usuário</h3>
            <p className="text-sm text-gray-500">
              Selecione os perfis que o usuário {selectedUser.name} terá acesso
            </p>
          </div>

          <div className="space-y-3">
            {roles?.map((role) => (
              <div key={role.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`role-${role.id}`}
                  checked={userRoles?.some(ur => ur.role_id === role.id)}
                  onChange={() => handleRoleToggle(role.id)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor={`role-${role.id}`}
                  className="ml-3 block text-sm font-medium text-gray-700"
                >
                  {role.name}
                  {role.description && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({role.description})
                    </span>
                  )}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}