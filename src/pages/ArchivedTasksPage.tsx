import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isPast, isToday } from 'date-fns';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { HomeIcon, ArchiveBoxIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

type Task = Database['public']['Tables']['tasks']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];

const priorityColors = {
  high: 'bg-red-100 text-red-800 ring-red-600/20',
  medium: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
  low: 'bg-blue-100 text-blue-800 ring-blue-600/20',
};

export function ArchivedTasksPage() {
  const queryClient = useQueryClient();
  const { signOut, hasRole } = useAuth();

  const { data: archivedTasks, isLoading } = useQuery({
    queryKey: ['archived-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          project:projects(title)
        `)
        .eq('archived', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as (Task & { project: Pick<Project, 'title'> })[];
    },
  });

  const restoreTask = useMutation({
    mutationFn: async (taskId: number) => {
      const { error } = await supabase
        .from('tasks')
        .update({ archived: false })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archived-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task restored successfully');
    },
    onError: () => {
      toast.error('Failed to restore task');
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: number) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archived-tasks'] });
      toast.success('Task deleted permanently');
    },
    onError: () => {
      toast.error('Failed to delete task');
    },
  });

  if (isLoading) {
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
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-md"
            >
              <ArchiveBoxIcon className="w-5 h-5" />
              <span>Arquivo</span>
            </Link>
            </div>
            <div className="pt-4 mt-4 border-t border-gray-200">
              {hasRole('admin') && (
                <Link
                  to="/admin"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  <Cog6ToothIcon className="w-5 h-5" />
                  <span>Configurações</span>
                </Link>
              )}
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md w-full text-left"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </div>
          </nav>
        </aside>
        <main className="flex-1 ml-64 p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Archived Tasks</h2>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-200">
              {archivedTasks?.map((task) => (
                <div key={task.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            priorityColors[task.priority]
                          }`}
                        >
                          {task.priority}
                        </span>
                        <h3 className="text-lg font-medium text-gray-900">
                          {task.title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Project: {task.project.title}
                      </p>
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      )}
                      {task.due_date && (
                        <p
                          className={`text-sm ${
                            isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date))
                              ? 'text-red-600'
                              : isToday(new Date(task.due_date))
                              ? 'text-orange-600'
                              : 'text-gray-600'
                          }`}
                        >
                          Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => restoreTask.mutate(task.id)}
                        className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to permanently delete this task?')) {
                            deleteTask.mutate(task.id);
                          }
                        }}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {(!archivedTasks || archivedTasks.length === 0) && (
                <div className="p-6 text-center text-gray-500">
                  No archived tasks found
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}