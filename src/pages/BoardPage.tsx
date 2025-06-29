import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ConnectionError } from '../components/ConnectionError';
import { toast } from 'react-hot-toast';
import { Database, TaskStatus } from '../lib/database.types';
import { TaskForm } from '../components/TaskForm';
import { Header } from '../components/Header';
import { TaskDetailsModal } from '../components/TaskDetailsModal';
import { ProjectForm } from '../components/ProjectForm';
import { SubtaskForm } from '../components/SubtaskForm';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { HomeIcon, ArchiveBoxIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, PlusIcon, ChevronUpIcon, ChevronDownIcon, MagnifyingGlassIcon, EllipsisVerticalIcon, TrashIcon, ArchiveBoxArrowDownIcon, ChartBarIcon, ChartPieIcon, UserGroupIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { formatSecondsToHHMMSS } from '../lib/utils';

type Project = Database['public']['Tables']['projects']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];
type Label = Database['public']['Tables']['labels']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];

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

export function BoardPage() {
  const { user, hasRole, signOut, loading, connectionError, retryConnection } = useAuth();
  const [addingTaskToProject, setAddingTaskToProject] = useState<number | null>(null);
  const [addingSubtaskToTask, setAddingSubtaskToTask] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<(Task & { task_labels: { label: Label }[] }) | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [inputProjectSearchTerm, setInputProjectSearchTerm] = useState('');
  const [actualProjectSearchTerm, setActualProjectSearchTerm] = useState('');
  const [collapsedProjects, setCollapsedProjects] = useState<Record<number, boolean>>({});
  const [reportsMenuOpen, setReportsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 10;
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'project' | 'task';
    id: number;
    title: string;
    isSubtask?: boolean;
  }>({
    isOpen: false,
    type: 'project',
    id: 0,
    title: '',
    isSubtask: false,
  });
  const queryClient = useQueryClient();

  // Query for total count of projects
  const { data: totalProjectsCount } = useQuery({
    queryKey: ['projects-count', actualProjectSearchTerm],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('archived', false);

      // Apply search filter if provided
      if (actualProjectSearchTerm.trim()) {
        query = query.or(`title.ilike.%${actualProjectSearchTerm}%,sequence_number.eq.${parseInt(actualProjectSearchTerm) || 0}`);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects', actualProjectSearchTerm, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * projectsPerPage;
      const to = from + projectsPerPage - 1;

      let query = supabase
        .from('projects')
        .select('*')
        .eq('archived', false)
        .order('sequence_number')
        .range(from, to);

      // Apply search filter if provided
      if (actualProjectSearchTerm.trim()) {
        query = query.or(`title.ilike.%${actualProjectSearchTerm}%,sequence_number.eq.${parseInt(actualProjectSearchTerm) || 0}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Project[];
    },
  });

  // Calculate pagination info
  const totalPages = Math.ceil((totalProjectsCount || 0) / projectsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_labels (
            label: labels (*)
          )
        `)
        .eq('archived', false)
        .order('position');

      if (error) throw error;
      return (data || []).map(task => ({
        ...task,
        task_labels: task.task_labels || []
      })) as (Task & { task_labels: { label: Label }[] })[];
    },
  });

  // Initialize all projects as collapsed when projects are loaded
  useEffect(() => {
    if (projects && projects.length > 0 && Object.keys(collapsedProjects).length === 0) {
      const initialCollapsedState: Record<number, boolean> = {};
      projects.forEach(project => {
        initialCollapsedState[project.id] = true;
      });
      setCollapsedProjects(initialCollapsedState);
    }
  }, [projects, collapsedProjects]);

  const createProject = useMutation({
    mutationFn: async (projectData: ProjectInsert) => {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          ...projectData,
          owner_id: user?.id,
          position: projects ? projects.length : 0,
        }])
        .select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowProjectForm(false);
      setProjectToEdit(null);
      toast.success('Project created successfully');
    },
    onError: () => {
      toast.error('Failed to create project');
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ projectId, projectData }: { projectId: number; projectData: Partial<Project> }) => {
      const { error } = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowProjectForm(false);
      setProjectToEdit(null);
      toast.success('Project updated successfully');
    },
    onError: () => {
      toast.error('Failed to update project');
    },
  });

  const createTask = useMutation({
    mutationFn: async ({ task, labels }: { task: TaskInsert, labels: Label[] }) => {
      // First create the task
      const { data, error } = await supabase
        .from('tasks')
        .insert([task])
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        throw new Error('Failed to create task: ' + error.message);
      }

      if (!data) {
        throw new Error('No data returned from task creation');
      }

      // Then create the task-label associations
      if (labels.length > 0) {
        const { error: labelError } = await supabase
          .from('task_labels')
          .insert(
            labels.map(label => ({
              task_id: data.id,
              label_id: label.id,
            }))
          );

        if (labelError) {
          console.error('Error creating task labels:', labelError);
          throw new Error('Failed to create task labels: ' + labelError.message);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created successfully');
    },
    onError: (error: Error) => {
      console.error('Task creation error:', error);
      toast.error(error.message || 'Failed to create task');
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (projectId: number) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setConfirmationModal({ isOpen: false, type: 'project', id: 0, title: '', isSubtask: false });
      toast.success('Projeto excluído com sucesso');
    },
    onError: () => {
      setConfirmationModal({ isOpen: false, type: 'project', id: 0, title: '', isSubtask: false });
      toast.error('Erro ao excluir projeto');
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: number, data: Partial<Task> }) => {
      // Update task data
      const { error: taskError } = await supabase
        .from('tasks')
        .update(data)
        .eq('id', taskId);

      if (taskError) throw taskError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Task updated successfully');
    },
    onError: () => {
      toast.error('Failed to update task');
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
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setConfirmationModal({ isOpen: false, type: 'task', id: 0, title: '', isSubtask: false });
      toast.success('Task deleted successfully');
    },
    onError: () => {
      setConfirmationModal({ isOpen: false, type: 'task', id: 0, title: '', isSubtask: false });
      toast.error('Failed to delete task');
    },
  });

  const importData = useMutation({
    mutationFn: async ({ projects, tasks }: { projects: ProjectInsert[], tasks: TaskInsert[] }) => {
      const { error: projectsError } = await supabase
        .from('projects')
        .insert(projects);

      if (projectsError) throw projectsError;

      const { error: tasksError } = await supabase
        .from('tasks')
        .insert(tasks);

      if (tasksError) throw tasksError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Data imported successfully');
    },
    onError: () => {
      toast.error('Failed to import data');
    },
  });

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId, type } = result;

    if (type === 'task') {
      const destinationProjectId = destination.droppableId;
      const taskId = parseInt(draggableId);

      const updatedPosition = destination.index;

      const { error } = await supabase
        .from('tasks')
        .update({
          project_id: parseInt(destinationProjectId),
          position: updatedPosition,
        })
        .eq('id', taskId);

      if (error) {
        toast.error('Failed to update task position');
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  };

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

  const handleSearch = () => {
    setActualProjectSearchTerm(inputProjectSearchTerm);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleProjectClick = (project: Project) => {
    setProjectToEdit(project);
    setShowProjectForm(true);
  };

  const handleNewProject = () => {
    setProjectToEdit(null);
    setShowProjectForm(true);
  };

  const handleProjectFormSubmit = (projectData: ProjectInsert) => {
    if (projectToEdit) {
      updateProject.mutate({ projectId: projectToEdit.id, projectData });
    } else {
      createProject.mutate(projectData);
    }
  };

  const handleProjectFormCancel = () => {
    setShowProjectForm(false);
    setProjectToEdit(null);
  };

  const getParentTask = (taskId: number) => {
    return tasks?.find(t => t.id === taskId);
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ConnectionError onRetry={retryConnection} />
        </div>
      </div>
    );
  }

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
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-md"
              >
                <HomeIcon className="w-5 h-5" />
                <span>Página Inicial</span>
              </Link>
              <Link
                to="/archived"
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
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
                  <Link
                    to="/reports/statistics"
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    <ChartPieIcon className="w-4 h-4" />
                    <span>Estatísticas</span>
                  </Link>
                  <Link
                    to="/reports/analysts"
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    <UserGroupIcon className="w-4 h-4" />
                    <span>Analistas</span>
                  </Link>
                </div>
              )}
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
            <h2 className="text-2xl font-bold text-gray-900">Projetos em Andamento</h2>
          </div>

          <div className="mb-6">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={inputProjectSearchTerm}
                  onChange={(e) => setInputProjectSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Pesquisar por nome ou número do projeto..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Pesquisar
              </button>
            </div>
          </div>

          <div className="space-y-6 mb-8">
            {projects?.map((project) => (
              <div
                key={project.id}
                className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-4 w-full"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <h3 
                      className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-primary-600 transition-colors"
                      onClick={() => handleProjectClick(project)}
                    >
                      #{project.sequence_number} - {project.title}
                    </h3>
                    
                    {/* Project Options Menu */}
                    <Menu as="div" className="relative inline-block text-left ml-2">
                      <Menu.Button className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full hover:bg-gray-100">
                        <EllipsisVerticalIcon className="w-5 h-5" />
                      </Menu.Button>

                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <Menu.Item>
                            {({ focus }) => (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmationModal({
                                    isOpen: true,
                                    type: 'project',
                                    id: project.id,
                                    title: project.title,
                                    isSubtask: false,
                                  });
                                }}
                                className={`${
                                  focus ? 'bg-gray-100' : ''
                                } flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100`}
                              >
                                <ArchiveBoxArrowDownIcon className="w-4 h-4 mr-2" />
                                Arquivar Projeto
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ focus }) => (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmationModal({
                                    isOpen: true,
                                    type: 'project',
                                    id: project.id,
                                    title: project.title,
                                    isSubtask: false,
                                  });
                                }}
                                className={`${
                                  focus ? 'bg-gray-100' : ''
                                } flex items-center w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100`}
                              >
                                <TrashIcon className="w-4 h-4 mr-2" />
                                Excluir Projeto
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Project Values */}
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap justify-end">
                        {project.estimated_value && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            Valor Previsto: {project.estimated_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        )}
                        {project.actual_value && project.actual_value > 0 && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            Valor Real: {project.actual_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
                    <button
                      onClick={() => setAddingTaskToProject(project.id)}
                      className="flex items-center px-3 py-1 text-sm text-primary-600 hover:text-primary-700 focus:outline-none"
                    >
                      <PlusIcon className="w-5 h-5 mr-1" />
                      Task
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

                {addingTaskToProject === project.id && (
                  <TaskForm
                    projectId={project.id}
                    onSubmit={(task, labels) => {
                      createTask.mutate({ task, labels });
                      setAddingTaskToProject(null);
                    }}
                    onCancel={() => setAddingTaskToProject(null)}
                  />
                )}

                <div className={collapsedProjects[project.id] ? 'hidden' : ''}>
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId={String(project.id)} type="task">
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="space-y-2"
                        >
                          {filterTasks(tasks, project.id).map((task, index) => (
                            <Draggable
                              key={task.id}
                              draggableId={String(task.id)}
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white rounded-md shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
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
                                    </div>
                                    
                                    {/* Due Date */}
                                    <div className="text-sm text-gray-600 min-w-[100px]">
                                      {task.due_date ? format(new Date(task.due_date), 'dd/MM/yyyy') : '-'}
                                    </div>
                                    
                                    {/* Status */}
                                    <div className={`text-sm font-medium min-w-[120px] text-right ${getTaskStatus(task).color}`}>
                                      {getTaskStatus(task).label}
                                    </div>

                                    {/* Context Menu */}
                                    <Menu as="div" className="relative inline-block text-left">
                                      <Menu.Button className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full hover:bg-gray-100">
                                        <EllipsisVerticalIcon className="w-5 h-5" />
                                      </Menu.Button>

                                      <Transition
                                        as={Fragment}
                                        enter="transition ease-out duration-100"
                                        enterFrom="transform opacity-0 scale-95"
                                        enterTo="transform opacity-100 scale-100"
                                        leave="transition ease-in duration-75"
                                        leaveFrom="transform opacity-100 scale-100"
                                        leaveTo="transform opacity-0 scale-95"
                                      >
                                        <Menu.Items className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                          {!task.parent_task_id && (
                                          <Menu.Item>
                                            {({ focus }) => (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  // Fechar outros formulários antes de abrir o de subtarefa
                                                  setAddingTaskToProject(null);
                                                  setAddingSubtaskToTask({ projectId: project.id, parentTaskId: task.id });
                                                }}
                                                className={`${
                                                  focus ? 'bg-gray-100' : ''
                                                } block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100`}
                                              >
                                                Adicionar Subtarefa
                                              </button>
                                            )}
                                          </Menu.Item>
                                          )}
                                          <Menu.Item>
                                            {({ focus }) => (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  // Fechar formulário de subtarefa se estiver aberto
                                                  setAddingSubtaskToTask(null);
                                                  setSelectedTask(task);
                                                }}
                                                className={`${
                                                  focus ? 'bg-gray-100' : ''
                                                } block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100`}
                                              >
                                                {task.parent_task_id ? 'Editar Subtarefa' : 'Editar Tarefa'}
                                              </button>
                                            )}
                                          </Menu.Item>
                                          <Menu.Item>
                                            {({ focus }) => (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  // Fechar formulário de subtarefa se estiver aberto
                                                  setAddingSubtaskToTask(null);
                                                  setConfirmationModal({
                                                    isOpen: true,
                                                    type: 'task',
                                                    id: task.id,
                                                    title: task.title,
                                                    isSubtask: !!task.parent_task_id,
                                                  });
                                                }}
                                                className={`${
                                                  focus ? 'bg-gray-100' : ''
                                                } block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100`}
                                              >
                                                {task.parent_task_id ? 'Excluir Subtarefa' : 'Excluir Tarefa'}
                                              </button>
                                            )}
                                          </Menu.Item>
                                        </Menu.Items>
                                      </Transition>
                                    </Menu>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              </div>
            ))}
          </div>

          <div className="fixed bottom-8 right-8 z-50">
            <button
              onClick={handleNewProject}
              className="flex items-center px-6 py-3 text-white bg-primary-600 rounded-full shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
            >
              <PlusIcon className="w-6 h-6 mr-2" />
              Novo Projeto
            </button>
          </div>

          {showProjectForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <ProjectForm
                initialData={projectToEdit}
                onSubmit={handleProjectFormSubmit}
                onCancel={handleProjectFormCancel}
              />
            </div>
          )}

          {selectedTask && (
            <TaskDetailsModal
              task={selectedTask}
              isOpen={true}
              onClose={() => setSelectedTask(null)}
              onUpdate={(taskId, data) => {
                updateTask.mutate({ taskId, data });
                setSelectedTask(null);
              }}
              onDelete={(taskId) => {
                deleteTask.mutate(taskId);
                setSelectedTask(null);
              }}
            />
          )}
        </main>

        {/* Render SubtaskForm globally, outside of project loop */}
        {addingSubtaskToTask && (
          <SubtaskForm
            projectId={addingSubtaskToTask.projectId}
            parentTaskId={addingSubtaskToTask.parentTaskId}
            onSubmit={async (task) => {
              try {
                await createTask.mutateAsync({ task, labels: [] });
                setAddingSubtaskToTask(null);
              } catch (error) {
                // Re-throw error to let SubtaskForm handle it properly
                throw error;
              }
            }}
            onCancel={() => setAddingSubtaskToTask(null)}
          />
        )}

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          onClose={() => setConfirmationModal({ isOpen: false, type: 'project', id: 0, title: '', isSubtask: false })}
          onConfirm={() => {
            if (confirmationModal.type === 'project') {
              deleteProject.mutate(confirmationModal.id);
            } else {
              deleteTask.mutate(confirmationModal.id);
            }
          }}
          title={`Excluir ${confirmationModal.type === 'project' ? 'Projeto' : confirmationModal.isSubtask ? 'Subtarefa' : 'Tarefa'}`}
          message={`Tem certeza que deseja excluir ${confirmationModal.type === 'project' ? 'o projeto' : confirmationModal.isSubtask ? 'a subtarefa' : 'a tarefa'} "${confirmationModal.title}"? ${confirmationModal.type === 'project' ? 'Esta ação não pode ser desfeita e todas as tarefas associadas também serão excluídas.' : 'Esta ação não pode ser desfeita.'}`}
          confirmText="Confirmar exclusão"
          isLoading={deleteProject.isPending || deleteTask.isPending}
        />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!hasPreviousPage}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current page
                  const showPage = 
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1);
                  
                  if (!showPage) {
                    // Show ellipsis for gaps
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <span key={page} className="px-2 py-1 text-gray-500">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        page === currentPage
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasNextPage}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
            
            <div className="mt-2 text-center text-sm text-gray-600">
              Página {currentPage} de {totalPages} ({totalProjectsCount} projetos)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}