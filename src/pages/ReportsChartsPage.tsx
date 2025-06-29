import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import {
  HomeIcon,
  ArchiveBoxIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  EnvelopeIcon,
  UsersIcon,
  ComputerDesktopIcon,
  ArrowDownTrayIcon,
  UserCircleIcon,
  ChartBarIcon,
  ChartPieIcon,
  UserGroupIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isWithinInterval } from 'date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type Task = Database['public']['Tables']['tasks']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface ChartData {
  labels: string[];
  datasets: any[];
}

export function ReportsChartsPage() {
  const { signOut, hasRole } = useAuth();
  const [reportsMenuOpen, setReportsMenuOpen] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [showCharts, setShowCharts] = useState(false);

  // Fetch projects
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('archived', false)
        .order('sequence_number');

      if (error) throw error;
      return data as Project[];
    },
  });

  // Fetch tasks
  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:profiles(name)
        `)
        .eq('archived', false);

      if (error) throw error;
      return data as (Task & { assignee: Pick<Profile, 'name'> | null })[];
    },
  });

  // Calculate week range
  const weekRange = useMemo(() => {
    const startDate = startOfWeek(parseISO(selectedWeek), { weekStartsOn: 1 });
    const endDate = endOfWeek(parseISO(selectedWeek), { weekStartsOn: 1 });
    return { startDate, endDate };
  }, [selectedWeek]);

  // Calculate previous week range
  const previousWeekRange = useMemo(() => {
    const selectedDate = parseISO(selectedWeek);
    const previousWeekStart = startOfWeek(new Date(selectedDate.getTime() - 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 1 });
    const previousWeekEnd = endOfWeek(new Date(selectedDate.getTime() - 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 1 });
    return { startDate: previousWeekStart, endDate: previousWeekEnd };
  }, [selectedWeek]);

  // Filter tasks by selected projects and week
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    
    return tasks.filter(task => {
      // Filter by selected projects
      if (selectedProjects.length > 0 && !selectedProjects.includes(task.project_id!)) {
        return false;
      }
      
      // Filter by week range (using created_at or due_date)
      const taskDate = task.due_date ? parseISO(task.due_date) : parseISO(task.created_at!);
      return isWithinInterval(taskDate, weekRange);
    });
  }, [tasks, selectedProjects, weekRange]);

  // Filter tasks for previous week
  const previousWeekTasks = useMemo(() => {
    if (!tasks) return [];
    
    return tasks.filter(task => {
      // Filter by selected projects
      if (selectedProjects.length > 0 && !selectedProjects.includes(task.project_id!)) {
        return false;
      }
      
      // Filter by previous week range
      const taskDate = task.due_date ? parseISO(task.due_date) : parseISO(task.created_at!);
      return isWithinInterval(taskDate, previousWeekRange);
    });
  }, [tasks, selectedProjects, previousWeekRange]);

  // Chart 6: Weekly Comparison Chart
  const weeklyComparisonChartData: ChartData = useMemo(() => {
    // Calculate metrics for current week
    const currentWeekCompletedTasks = filteredTasks.filter(t => t.status === 'concluida').length;
    const currentWeekTotalHours = filteredTasks.reduce((sum, task) => sum + ((task.actual_hours || 0) / 3600), 0);
    const currentWeekTotalTasks = filteredTasks.length;
    const currentWeekProgressPercentage = currentWeekTotalTasks > 0 ? (currentWeekCompletedTasks / currentWeekTotalTasks) * 100 : 0;
    
    // Calculate metrics for previous week
    const previousWeekCompletedTasks = previousWeekTasks.filter(t => t.status === 'concluida').length;
    const previousWeekTotalHours = previousWeekTasks.reduce((sum, task) => sum + ((task.actual_hours || 0) / 3600), 0);
    const previousWeekTotalTasks = previousWeekTasks.length;
    const previousWeekProgressPercentage = previousWeekTotalTasks > 0 ? (previousWeekCompletedTasks / previousWeekTotalTasks) * 100 : 0;

    return {
      labels: ['Tarefas Concluídas', 'Horas Trabalhadas', 'Total de Tarefas', 'Progresso (%)'],
      datasets: [
        {
          label: 'Semana Atual',
          data: [currentWeekCompletedTasks, currentWeekTotalHours, currentWeekTotalTasks, currentWeekProgressPercentage],
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
        },
        {
          label: 'Semana Anterior',
          data: [previousWeekCompletedTasks, previousWeekTotalHours, previousWeekTotalTasks, previousWeekProgressPercentage],
          backgroundColor: 'rgba(156, 163, 175, 0.8)',
          borderColor: 'rgb(156, 163, 175)',
          borderWidth: 1,
        },
      ],
    };
  }, [filteredTasks, previousWeekTasks]);

  // Chart 1: Bar Chart - Horas previstas vs realizadas por dia da semana
  const hoursBarChartData: ChartData = useMemo(() => {
    const daysOfWeek = eachDayOfInterval(weekRange);
    const labels = daysOfWeek.map(day => format(day, 'EEE'));
    
    const estimatedHours = daysOfWeek.map(day => {
      const dayTasks = filteredTasks.filter(task => {
        const taskDate = task.due_date ? parseISO(task.due_date) : parseISO(task.created_at!);
        return format(taskDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      });
      
      return dayTasks.reduce((sum, task) => {
        const projectEstimatedHours = projects?.find(p => p.id === task.project_id)?.estimated_hours || 0;
        return sum + (projectEstimatedHours / Math.max(tasks?.filter(t => t.project_id === task.project_id).length || 1, 1));
      }, 0) / 3600; // Convert seconds to hours
    });
    
    const actualHours = daysOfWeek.map(day => {
      const dayTasks = filteredTasks.filter(task => {
        const taskDate = task.due_date ? parseISO(task.due_date) : parseISO(task.created_at!);
        return format(taskDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      });
      
      return dayTasks.reduce((sum, task) => sum + ((task.actual_hours || 0) / 3600), 0); // Convert seconds to hours
    });

    return {
      labels,
      datasets: [
        {
          label: 'Horas Previstas',
          data: estimatedHours,
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
        },
        {
          label: 'Horas Realizadas',
          data: actualHours,
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1,
        },
      ],
    };
  }, [filteredTasks, projects, weekRange, tasks]);

  // Chart 2: Line Chart - Progresso de tarefas concluídas no período
  const progressLineChartData: ChartData = useMemo(() => {
    const daysOfWeek = eachDayOfInterval(weekRange);
    const labels = daysOfWeek.map(day => format(day, 'dd/MM'));
    
    const completedTasks = daysOfWeek.map(day => {
      return filteredTasks.filter(task => {
        const taskDate = task.due_date ? parseISO(task.due_date) : parseISO(task.created_at!);
        return format(taskDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') && task.status === 'concluida';
      }).length;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Tarefas Concluídas',
          data: completedTasks,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          tension: 0.1,
          fill: true,
        },
      ],
    };
  }, [filteredTasks, weekRange]);

  // Chart 3: Pie Chart - Distribuição percentual de tarefas por status
  const statusPieChartData: ChartData = useMemo(() => {
    const statusCounts = {
      'concluida': filteredTasks.filter(t => t.status === 'concluida').length,
      'em_andamento': filteredTasks.filter(t => t.status === 'em_andamento').length,
      'nao_iniciada': filteredTasks.filter(t => t.status === 'nao_iniciada').length,
    };

    return {
      labels: ['Concluídas', 'Em Andamento', 'Não Iniciadas'],
      datasets: [
        {
          data: [statusCounts.concluida, statusCounts.em_andamento, statusCounts.nao_iniciada],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 191, 36, 0.8)',
            'rgba(156, 163, 175, 0.8)',
          ],
          borderColor: [
            'rgb(34, 197, 94)',
            'rgb(251, 191, 36)',
            'rgb(156, 163, 175)',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [filteredTasks]);

  // Chart 4: Area Chart - Acúmulo de tarefas por prioridade
  const priorityAreaChartData: ChartData = useMemo(() => {
    const daysOfWeek = eachDayOfInterval(weekRange);
    const labels = daysOfWeek.map(day => format(day, 'dd/MM'));
    
    const highPriorityTasks = daysOfWeek.map(day => {
      return filteredTasks.filter(task => {
        const taskDate = task.due_date ? parseISO(task.due_date) : parseISO(task.created_at!);
        return format(taskDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') && task.priority === 'high';
      }).length;
    });
    
    const mediumPriorityTasks = daysOfWeek.map(day => {
      return filteredTasks.filter(task => {
        const taskDate = task.due_date ? parseISO(task.due_date) : parseISO(task.created_at!);
        return format(taskDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') && task.priority === 'medium';
      }).length;
    });
    
    const lowPriorityTasks = daysOfWeek.map(day => {
      return filteredTasks.filter(task => {
        const taskDate = task.due_date ? parseISO(task.due_date) : parseISO(task.created_at!);
        return format(taskDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') && task.priority === 'low';
      }).length;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Alta Prioridade',
          data: highPriorityTasks,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.3)',
          fill: true,
        },
        {
          label: 'Média Prioridade',
          data: mediumPriorityTasks,
          borderColor: 'rgb(251, 191, 36)',
          backgroundColor: 'rgba(251, 191, 36, 0.3)',
          fill: true,
        },
        {
          label: 'Baixa Prioridade',
          data: lowPriorityTasks,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.3)',
          fill: true,
        },
      ],
    };
  }, [filteredTasks, weekRange]);

  // Chart 5: Stacked Column Chart - Tarefas por responsável e status
  const assigneeStackedChartData: ChartData = useMemo(() => {
    const assignees = Array.from(new Set(filteredTasks.map(t => t.assignee?.name || 'Não Atribuído')));
    
    const completedData = assignees.map(assignee => 
      filteredTasks.filter(t => (t.assignee?.name || 'Não Atribuído') === assignee && t.status === 'concluida').length
    );
    
    const inProgressData = assignees.map(assignee => 
      filteredTasks.filter(t => (t.assignee?.name || 'Não Atribuído') === assignee && t.status === 'em_andamento').length
    );
    
    const notStartedData = assignees.map(assignee => 
      filteredTasks.filter(t => (t.assignee?.name || 'Não Atribuído') === assignee && t.status === 'nao_iniciada').length
    );

    return {
      labels: assignees,
      datasets: [
        {
          label: 'Concluídas',
          data: completedData,
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
        },
        {
          label: 'Em Andamento',
          data: inProgressData,
          backgroundColor: 'rgba(251, 191, 36, 0.8)',
        },
        {
          label: 'Não Iniciadas',
          data: notStartedData,
          backgroundColor: 'rgba(156, 163, 175, 0.8)',
        },
      ],
    };
  }, [filteredTasks]);

  const handleProjectToggle = (projectId: number) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const stackedChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        beginAtZero: true,
      },
    },
  };

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
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-md"
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
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Gráficos de Evolução de Projetos</h2>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Week Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecionar Semana
                  </label>
                  <input
                    type="date"
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Semana de {format(weekRange.startDate, 'dd/MM/yyyy')} a {format(weekRange.endDate, 'dd/MM/yyyy')}
                  </p>
                </div>

                {/* Project Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecionar Projetos
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                    <div className="space-y-2">
                      {projects?.map((project) => (
                        <label key={project.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedProjects.includes(project.id)}
                            onChange={() => handleProjectToggle(project.id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            #{project.sequence_number} - {project.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedProjects.length === 0 ? 'Todos os projetos' : `${selectedProjects.length} projeto(s) selecionado(s)`}
                  </p>
                </div>
              </div>
            </div>

            {/* Generate Charts Button */}
            <div className="flex justify-center mb-8">
              <button
                onClick={() => setShowCharts(true)}
                className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-primary-600 rounded-lg shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 transform hover:scale-105"
              >
                <ChartBarIcon className="w-5 h-5 mr-2" />
                Gerar Gráficos
              </button>
            </div>

            {/* Charts Grid */}
            {showCharts && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Chart 1: Bar Chart - Hours */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Horas Previstas vs. Realizadas por Dia
                </h3>
                <Bar data={hoursBarChartData} options={chartOptions} />
              </div>

              {/* Chart 2: Line Chart - Progress */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Progresso de Tarefas Concluídas
                </h3>
                <Line data={progressLineChartData} options={chartOptions} />
              </div>

              {/* Chart 3: Pie Chart - Status Distribution */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Distribuição de Tarefas por Status
                </h3>
                <Pie data={statusPieChartData} options={{ responsive: true, plugins: { legend: { position: 'top' as const } } }} />
              </div>

              {/* Chart 4: Area Chart - Priority */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Acúmulo de Tarefas por Prioridade
                </h3>
                <Line data={priorityAreaChartData} options={chartOptions} />
              </div>

              {/* Chart 5: Stacked Column Chart - Assignees */}
              <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Tarefas por Responsável e Status
                </h3>
                <Bar data={assigneeStackedChartData} options={stackedChartOptions} />
              </div>

              {/* Chart 6: Weekly Comparison Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Comparação Semanal: Atual vs. Anterior
                </h3>
                <div className="mb-4 text-sm text-gray-600">
                  <p>
                    <strong>Semana Atual:</strong> {format(weekRange.startDate, 'dd/MM/yyyy')} a {format(weekRange.endDate, 'dd/MM/yyyy')}
                  </p>
                  <p>
                    <strong>Semana Anterior:</strong> {format(previousWeekRange.startDate, 'dd/MM/yyyy')} a {format(previousWeekRange.endDate, 'dd/MM/yyyy')}
                  </p>
                </div>
                <Bar data={weeklyComparisonChartData} options={chartOptions} />
              </div>
            </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}