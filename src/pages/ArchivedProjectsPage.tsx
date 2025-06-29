import { useQuery } from '@tanstack/react-query';
import { format, isPast, isToday } from 'date-fns';
import { supabase } from '../lib/supabase';
import { Database, TaskPriority } from '../lib/database.types';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { HomeIcon, ArchiveBoxIcon, ArrowRightOnRectangleIcon, ChevronUpIcon, ChevronDownIcon, ChartBarIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { formatSecondsToHHMMSS } from '../lib/utils';

type Task = Database['public']['Tables']['tasks']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];
type Label = Database['public']['Tables']['labels']['Row'];

const priorityColors = {
  high: 'bg-red-100 text-red-800 ring-red-600/20',
  medium: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
  low: 'bg-blue-100 text-blue-800 ring-blue-600/20',
};

const statusColors = {
  concluida: 'text-green-600',
  em_andamento: 'text-yellow-600',
  nao_iniciada: 'text-gray-600',
};

const statusLabels = {
  concluida: 'Concluída',
  em_andamento: 'Em andamento',
  nao_iniciada: 'Não iniciada',
};

export function ArchivedProjectsPage() {
  const { signOut, hasRole } = useAuth();
  const [collapsedProjects, setCollapsedProjects] = useState<Record<number, boolean>>({});
  const [reportsMenuOpen, setReportsMenuOpen] = useState(false);

  const { data: archivedProjects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['archived-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('archived', true)
        .order('sequence_number');

      if (error) throw error;
      return data as Project[];
    },
  });

  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_labels (
            label: labels (*)
          )
        `)
        .order('position');

      if (error) throw error;
      return (data || []).map(task => ({
        ...task,
        task_labels: task.task_labels || []
      })) as (Task & { task_labels: { label: Label }[] })[];
    },
  });

  // Initialize all archived projects as collapsed when data is loaded
  useEffect(() => {
    if (archivedProjects && archivedProjects.length > 0 && Object.keys(collapsedProjects).length === 0) {
      const initialCollapsedState: Record<number, boolean> = {};
      archivedProjects.forEach(project => {
        initialCollapsedState[project.id] = true;
      });
      setCollapsedProjects(initialCollapsedState);
    }
  }, [archivedProjects, collapsedProjects]);

  const toggleCollapse = (projectId: number) => {
    setCollapsedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const getTaskStatus = (task: Task) => {
    const status = task.status || 'nao_iniciada';
    return {
      label: statusLabels[status],
      color: statusColors[status],
    };
  };

  const filterTasks = (tasks: (Task & { task_labels: { label: Label }[] })[] | undefined, projectId: number) => {
    if (!tasks) return [];

    const projectTasks = tasks
      .filter(task => task.project_id === projectId);

    // Separate main tasks and subtasks
    const mainTasks = projectTasks.filter(task => !task.parent_task_id);
    const subtasks = projectTasks.filter(task => task.parent_task_id);

    // Sort main tasks by priority and position
    mainTasks.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.position - b.position;
    });

    // Build hierarchical list
    const result: typeof projectTasks = [];
    mainTasks.forEach(mainTask => {
      result.push(mainTask);
      // Add subtasks immediately after their parent
      const taskSubtasks = subtasks
        .filter(subtask => subtask.parent_task_id === mainTask.id)
        .sort((a, b) => a.position - b.position);
      result.push(...taskSubtasks);
    });

    return result;
  };

  const getParentTask = (taskId: number) => {
    return tasks?.find(t => t.id === taskId);
  };

  const calculateProjectProgress = (projectId: number) => {
    const projectTasks = tasks?.filter(t => t.project_id === projectId) || [];
    const totalTasks = projectTasks.length;
    
    if (totalTasks === 0) {
      return { completed: 0, inProgress: 0, notStarted: 0, completedPercentage: 0, inProgressPercentage: 0, notStartedPercentage: 0 };
    }
    
    const completed = projectTasks.filter(t => t.status === 'concluida').length;
    const inProgress = projectTasks.filter(t => t.status === 'em_andamento').length;
    const notStarted = projectTasks.filter(t => t.status === 'nao_iniciada').length;
    
    const completedPercentage = Math.round((completed / totalTasks) * 100);
    const inProgressPercentage = Math.round((inProgress / totalTasks) * 100);
    const notStartedPercentage = Math.round((notStarted / totalTasks) * 100);
    
    return {
      completed,
      inProgress,
      notStarted,
      completedPercentage,
      inProgressPercentage,
      notStartedPercentage
    };
  };

  if (isLoadingProjects || isLoadingTasks) {
    return <div>Carregando...</div>;
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
                <span>Projetos Arquivados</span>
              </Link>
              <button
                onClick={() => setReportsMenuOpen(!reportsMenuOpen)}
                className="flex items-center justify-between w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                <div className="flex items-center space-x-2">
                  <ChartBarIcon className="w-5 h-5" />
                  <span>Relatórios Gerenciais</span>
                </div>
                {reportsMenuOpen ? (
                  <ChevronDownIcon className="w-4 h-4" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </button>
              {reportsMenuOpen && (
                <div className="ml-4 space-y-2">
                  <Link
                    to="/reports/charts"
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    <ChartBarIcon className="w-4 h-4" />
                    <span>Gráficos</span>
                  </Link>
                </div>
              )}
            </div>
            <div className="pt-4 mt-4 border-t border-gray-200">
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
            <h2 className="text-2xl font-bold text-gray-900">Projetos Arquivados</h2>
          </div>

          <div className="space-y-6 mb-8">
            {archivedProjects?.map((project) => (
              <div
                key={project.id}
                className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-4 w-full"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    #{project.sequence_number} - {project.title}
                  </h3>
                  <div className="flex items-center space-x-4">
                    {/* Project Values */}
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        {project.estimated_value && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            Previsto: {project.estimated_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        )}
                        {project.actual_value && project.actual_value > 0 && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            Real: {project.actual_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        )}
                        {project.estimated_hours && (
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                            Horas Previstas: {formatSecondsToHHMMSS(project.estimated_hours)}
                          </span>
                        )}
                        {project.actual_hours && project.actual_hours > 0 && (
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                            Horas Realizadas: {formatSecondsToHHMMSS(project.actual_hours)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleCollapse(project.id)}
                      className="flex items-center px-2 py-1 text-sm text-gray-600 hover:text-gray-800 focus:outline-none"
                      title={collapsedProjects[project.id] ? 'Expandir tarefas' : 'Recolher tarefas'}
                    >
                      {collapsedProjects[project.id] ? (
                        <ChevronDownIcon className="w-5 h-5" />
                      ) : (
                        <ChevronUpIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="mb-4">
                  {(() => {
                    const progress = calculateProjectProgress(project.id);
                    const totalTasks = tasks?.filter(t => t.project_id === project.id).length || 0;
                    
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Progresso do Projeto ({totalTasks} tarefas)</span>
                          <span>{progress.completedPercentage}% concluído</span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden" style={{ width: '8cm' }}>
                          <div className="h-full flex">
                            {/* Green for completed tasks */}
                            <div 
                              className="bg-green-500 h-full transition-all duration-300"
                              style={{ width: `${progress.completedPercentage}%` }}
                              title={`${progress.completed} tarefas concluídas (${progress.completedPercentage}%)`}
                            />
                            {/* Yellow for in-progress tasks */}
                            <div 
                              className="bg-yellow-500 h-full transition-all duration-300"
                              style={{ width: `${progress.inProgressPercentage}%` }}
                              title={`${progress.inProgress} tarefas em andamento (${progress.inProgressPercentage}%)`}
                            />
                            {/* Gray for not-started tasks */}
                            <div 
                              className="bg-gray-400 h-full transition-all duration-300"
                              style={{ width: `${progress.notStartedPercentage}%` }}
                              title={`${progress.notStarted} tarefas não iniciadas (${progress.notStartedPercentage}%)`}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                            Concluídas: {progress.completed}
                          </span>
                          <span className="flex items-center">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
                            Em andamento: {progress.inProgress}
                          </span>
                          <span className="flex items-center">
                            <div className="w-3 h-3 bg-gray-400 rounded-full mr-1"></div>
                            Não iniciadas: {progress.notStarted}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className={collapsedProjects[project.id] ? 'hidden' : ''}>
                  <div className="space-y-2">
                    {filterTasks(tasks, project.id).map((task) => (
                      <div
                        key={task.id}
                        className={`bg-white rounded-md shadow-sm ${
                          task.completed ? 'opacity-50' : ''
                        } ${task.parent_task_id ? 'ml-8 mr-2 border-l-4 border-primary-300 bg-gray-50' : 'p-3'}`}
                      >
                        {task.parent_task_id && (
                          <div className="flex items-center text-xs text-primary-600 mb-2 pl-3 pt-2">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">Subtarefa de:</span>
                            <span className="ml-1 font-semibold">{getParentTask(task.parent_task_id)?.title}</span>
                          </div>
                        )}
                        <div className={`flex items-center gap-3 ${task.parent_task_id ? 'pl-3 pb-2' : ''}`}>
                          {/* Priority */}
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                              priorityColors[task.priority]
                            }`}
                          >
                            {task.priority}
                          </span>
                          
                          {/* Task Name */}
                          <div className="flex-1">
                            <h4 className={`font-medium ${
                              task.parent_task_id ? 'text-gray-700 text-sm' : 'text-gray-900'
                            } ${
                              task.status === 'concluida' ? 'line-through' : ''
                            }`}>
                              {task.parent_task_id && (
                                <span className="inline-flex items-center mr-2 text-primary-600">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </span>
                              )}
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                            )}
                          </div>
                          
                          {/* Due Date */}
                          <div className="text-sm text-gray-600 min-w-[100px]">
                            {task.due_date ? format(new Date(task.due_date), 'dd/MM/yyyy') : '-'}
                          </div>
                          
                          {/* Status */}
                          <div className={`text-sm font-medium min-w-[120px] text-right ${getTaskStatus(task).color}`}>
                            {getTaskStatus(task).label}
                          </div>

                          {/* Value */}
                          {task.value && task.value > 0 && (
                            <div className="text-sm text-gray-600 min-w-[80px] text-right">
                              {task.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                          )}

                          {/* Hours */}
                          {task.actual_hours && task.actual_hours > 0 && (
                            <div className="text-sm text-gray-600 min-w-[80px] text-right">
                              {formatSecondsToHHMMSS(task.actual_hours)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {(!archivedProjects || archivedProjects.length === 0) && (
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-8 text-center">
              <ArchiveBoxIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum projeto arquivado</h3>
              <p className="text-gray-600">
                Quando você arquivar projetos, eles aparecerão aqui para consulta.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}