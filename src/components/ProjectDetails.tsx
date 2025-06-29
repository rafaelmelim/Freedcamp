import { useMemo } from 'react';
import { format, isPast, isToday } from 'date-fns';
import { Database, TaskPriority } from '../lib/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];

interface ProjectDetailsProps {
  project: Project;
  tasks: Task[];
}

export function ProjectDetails({ project, tasks }: ProjectDetailsProps) {
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const overdue = tasks.filter(t => 
      t.due_date && 
      !t.completed && 
      isPast(new Date(t.due_date)) && 
      !isToday(new Date(t.due_date))
    ).length;
    const dueToday = tasks.filter(t => 
      t.due_date && 
      !t.completed && 
      isToday(new Date(t.due_date))
    ).length;

    const priorityCount = tasks.reduce((acc, task) => {
      if (!task.completed) {
        acc[task.priority]++;
      }
      return acc;
    }, {
      high: 0,
      medium: 0,
      low: 0,
    } as Record<TaskPriority, number>);

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      overdue,
      dueToday,
      priorityCount,
      completionRate,
    };
  }, [tasks]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{project.title}</h2>
          <p className="text-sm text-gray-500">
            Criado em {format(new Date(project.created_at!), 'dd/MM/yyyy')}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary-600">
            {stats.completionRate}%
          </div>
          <div className="text-sm text-gray-600">Concluído</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-lg font-semibold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total de Tarefas</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-lg font-semibold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-600">Concluídas</div>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <div className="text-lg font-semibold text-red-600">{stats.overdue}</div>
          <div className="text-sm text-gray-600">Atrasadas</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3">
          <div className="text-lg font-semibold text-yellow-600">{stats.dueToday}</div>
          <div className="text-sm text-gray-600">Para Hoje</div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Distribuição por Prioridade</h3>
        <div className="space-y-2">
          <div className="flex items-center">
            <div className="w-24 text-sm text-gray-600">Alta</div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full"
                style={{
                  width: `${stats.total > 0 ? (stats.priorityCount.high / stats.total) * 100 : 0}%`
                }}
              />
            </div>
            <div className="w-8 text-right text-sm text-gray-600">{stats.priorityCount.high}</div>
          </div>
          <div className="flex items-center">
            <div className="w-24 text-sm text-gray-600">Média</div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 rounded-full"
                style={{
                  width: `${stats.total > 0 ? (stats.priorityCount.medium / stats.total) * 100 : 0}%`
                }}
              />
            </div>
            <div className="w-8 text-right text-sm text-gray-600">{stats.priorityCount.medium}</div>
          </div>
          <div className="flex items-center">
            <div className="w-24 text-sm text-gray-600">Baixa</div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{
                  width: `${stats.total > 0 ? (stats.priorityCount.low / stats.total) * 100 : 0}%`
                }}
              />
            </div>
            <div className="w-8 text-right text-sm text-gray-600">{stats.priorityCount.low}</div>
          </div>
        </div>
      </div>
    </div>
  );
}