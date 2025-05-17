import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import Papa from 'papaparse';
import { toast } from 'react-hot-toast';

type Task = Database['public']['Tables']['tasks']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];

export function ExportCSV() {
  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          project:projects(title)
        `);

      if (error) throw error;
      return data as (Task & { project: Pick<Project, 'title'> })[];
    },
  });

  const handleExport = () => {
    if (!tasks) return;

    const csvData = tasks.map(task => ({
      Project: task.project?.title || '',
      Title: task.title,
      Description: task.description || '',
      Priority: task.priority,
      'Due Date': task.due_date || '',
      Status: task.completed ? 'Completed' : 'In Progress',
      'Created At': new Date(task.created_at!).toLocaleDateString(),
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `tasks-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Tasks exported successfully');
  };

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
    >
      Export CSV
    </button>
  );
}