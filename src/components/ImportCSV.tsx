import { useRef } from 'react';
import Papa from 'papaparse';
import { toast } from 'react-hot-toast';
import { Database } from '../lib/database.types';

type Project = Database['public']['Tables']['projects']['Insert'];
type Task = Database['public']['Tables']['tasks']['Insert'];

interface ImportCSVProps {
  onImport: (projects: Project[], tasks: Task[]) => void;
}

export function ImportCSV({ onImport }: ImportCSVProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          const projects: Project[] = [];
          const tasks: Task[] = [];
          
          results.data.forEach((row: any) => {
            if (row.type === 'project') {
              projects.push({
                title: row.title,
                position: parseInt(row.position) || 0,
              });
            } else if (row.type === 'task') {
              tasks.push({
                title: row.title,
                description: row.description,
                due_date: row.due_date,
                position: parseInt(row.position) || 0,
                project_id: parseInt(row.project_id),
              });
            }
          });

          onImport(projects, tasks);
          toast.success('CSV imported successfully');
        } catch (error) {
          toast.error('Invalid CSV format');
        }
      },
      error: () => {
        toast.error('Error parsing CSV file');
      },
    });
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        Import CSV
      </button>
    </div>
  );
}