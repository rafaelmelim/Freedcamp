import { supabase } from './supabase';
import { Database } from './database.types';

type Role = Database['public']['Tables']['roles']['Row'];
type UserRole = Database['public']['Tables']['user_roles']['Row'];

export async function getUserRoles(userId: string): Promise<Role[]> {
  const { data: userRoles, error: userRolesError } = await supabase
    .from('user_roles')
    .select('role_id')
    .eq('profile_id', userId);

  if (userRolesError) throw userRolesError;

  const roleIds = userRoles.map(ur => ur.role_id);

  const { data: roles, error: rolesError } = await supabase
    .from('roles')
    .select('*')
    .in('id', roleIds);

  if (rolesError) throw rolesError;

  return roles;
}

export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  const { data: roles, error } = await supabase
    .from('roles')
    .select('id')
    .eq('name', roleName)
    .single();

  if (error) return false;

  const { data: userRoles, error: userRolesError } = await supabase
    .from('user_roles')
    .select('id')
    .eq('profile_id', userId)
    .eq('role_id', roles.id)
    .single();

  if (userRolesError) return false;

  return !!userRoles;
}