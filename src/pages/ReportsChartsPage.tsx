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
  ChartBarIcon,
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
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isWithinInterval, differenceInDays, addDays } from 'date-fns';

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
  const [selectedStartDate, setSelectedStartDate] = useState(format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [selectedEndDate, setSelectedEndDate] = useState(format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
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

  // Fetch tasks with assignee information
  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:profiles(id, name)
        `)
        .eq('archived', false);

      if (error) throw error;
      return data as (Task & { assignee: Pick<Profile, 'id' | 'name'> | null })[];
    },
  });

  // Fetch all profiles for assignee filter
  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data as Pick<Profile, 'id' | 'name'>[];
    },
  });

  // Format selected project names for display
  const selectedProjectsText = useMemo(() => {
    if (selectedProjects.length === 0) {
      return 'Todos os projetos';
    }
    
    const selectedProjectNames = projects
      ?.filter(p => selectedProjects.includes(p.id))
      .map(p => `#${p.sequence_number} - ${p.title}`)
      .join(', ') || '';
    
    return selectedProjectNames;
  }, [selectedProjects, projects]);

  // Format selected assignees for display
  const selectedAssigneesText = useMemo(() => {
    if (selectedAssignees.length === 0) {
      return 'Todos os colaboradores';
    }
    
    const selectedAssigneeNames = profiles
      ?.filter(p => selectedAssignees.includes(p.id))
      .map(p => p.name)
      .join(', ') || '';
    
    return selectedAssigneeNames;
  }, [selectedAssignees, profiles]);

  // Calculate date range
  const dateRange = useMemo(() => {
    const startDate = parseISO(selectedStartDate);
    const endDate = parseISO(selectedEndDate);
    return { startDate, endDate };
  }, [selectedStartDate, selectedEndDate]);

  // Calculate previous period range (same duration as selected range)
  const previousPeriodRange = useMemo(() => {
    const startDate = parseISO(selectedStartDate);
    const endDate = parseISO(selectedEndDate);
    const duration = differenceInDays(endDate, startDate);
    
    const previousEndDate = addDays(startDate, -1);
    const previousStartDate = addDays(previousEndDate, -duration);
    
    return { startDate: previousStartDate, endDate: previousEndDate };
  }, [selectedStartDate, selectedEndDate]);

  // Filter tasks by selected projects, date range, and assignees
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    
    return tasks.filter(task => {
      // Filter by selected projects
      if (selectedProjects.length > 0 && !selectedProjects.includes(task.project_id!)) {
        return false;
      }
      
      // Filter by selected assignees
      if (selectedAssignees.length > 0 && (!task.assignee || !selectedAssignees.includes(task.assignee.id))) {
        return false;
      }
      
      // Filter by date range (using created_at or due_date)
      const taskDate = task.due_date ? parseISO(task.due_date) : parseISO(task.created_at!);
      return isWithinInterval(taskDate, dateRange);
    });
  }, [tasks, selectedProjects, selectedAssignees, dateRange]);

  // Filter tasks for previous period
  const previousPeriodTasks = useMemo(() => {
    if (!tasks) return [];
    
    return tasks.filter(task => {
      // Filter by selected projects
      if (selectedProjects.length > 0 && !selectedProjects.includes(task.project_id!)) {
        return false;
      }
      
      // Filter by selected assignees
      if (selectedAssignees.length > 0 && (!task.assignee || !selectedAssignees.includes(task.assignee.id))) {
        return false;
      }
      
      // Filter by previous period range
      const taskDate = task.due_date ? parseISO(task.due_date) : parseISO(task.created_at!);
      return isWithinInterval(taskDate, previousPeriodRange);
    });
  }, [tasks, selectedProjects, selectedAssignees, previousPeriodRange]);

  // Get filtered projects for financial calculations
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    
    return projects.filter(project => {
      if (selectedProjects.length > 0) {
        return selectedProjects.includes(project.id);
      }
      return true;
    });
  }, [projects, selectedProjects]);

  // Financial Indicators Charts
  const financialCostComparisonChartData: ChartData = useMemo(() => {
    const totalPlannedCost = filteredProjects.reduce((sum, project) => sum + (project.estimated_value || 0), 0);
    const totalActualCost = filteredProjects.reduce((sum, project) => sum + (project.actual_value || 0), 0);

    return {
      labels: ['Custo Planejado', 'Custo Real'],
      datasets: [
        {
          label: 'Valores (R$)',
          data: [totalPlannedCost, totalActualCost],
          backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(239, 68, 68, 0.8)'],
          borderColor: ['rgb(59, 130, 246)', 'rgb(239, 68, 68)'],
          borderWidth: 1,
        },
      ],
    };
  }, [filteredProjects]);

  const financialBudgetComparisonChartData: ChartData = useMemo(() => {
    const totalBudget = filteredProjects.reduce((sum, project) => sum + (project.estimated_value || 0), 0);
    const utilizedBudget = filteredTasks.reduce((sum, task) => sum + (task.value || 0), 0);

    return {
      labels: ['Orçamento Total', 'Orçamento Utilizado'],
      datasets: [
        {
          label: 'Valores (R$)',
          data: [totalBudget, utilizedBudget],
          backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(251, 191, 36, 0.8)'],
          borderColor: ['rgb(34, 197, 94)', 'rgb(251, 191, 36)'],
          borderWidth: 1,
        },
      ],
    };
  }, [filteredProjects, filteredTasks]);

  const financialROIChartData: ChartData = useMemo(() => {
    const projectROI = filteredProjects.map(project => {
      const estimatedValue = project.estimated_value || 0;
      const actualValue = project.actual_value || 0;
      const roi = estimatedValue > 0 ? ((actualValue - estimatedValue) / estimatedValue) * 100 : 0;
      return {
        name: `#${project.sequence_number} - ${project.title}`,
        roi: roi
      };
    });

    return {
      labels: projectROI.map(p => p.name),
      datasets: [
        {
          label: 'ROI (%)',
          data: projectROI.map(p => p.roi),
          backgroundColor: projectROI.map(p => p.roi >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'),
          borderColor: projectROI.map(p => p.roi >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'),
          borderWidth: 1,
        },
      ],
    };
  }, [filteredProjects]);

  // Time Indicators Charts
  const timeAverageTaskDurationChartData: ChartData = useMemo(() => {
    const tasksByAssignee = filteredTasks.reduce((acc, task) => {
      const assigneeName = task.assignee?.name || 'Não Atribuído';
      if (!acc[assigneeName]) {
        acc[assigneeName] = [];
      }
      acc[assigneeName].push(task.actual_hours || 0);
      return acc;
    }, {} as Record<string, number[]>);

    const averageDurations = Object.entries(tasksByAssignee).map(([assignee, hours]) => {
      const avgHours = hours.length > 0 ? hours.reduce((sum, h) => sum + h, 0) / hours.length : 0;
      return {
        assignee,
        avgHours: avgHours / 3600 // Convert seconds to hours
      };
    });

    return {
      labels: averageDurations.map(d => d.assignee),
      datasets: [
        {
          label: 'Duração Média (horas)',
          data: averageDurations.map(d => d.avgHours),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
        },
      ],
    };
  }, [filteredTasks]);

  const timeDeliveryByPhaseChartData: ChartData = useMemo(() => {
    const projectDelivery = filteredProjects.map(project => {
      const plannedDuration = project.estimated_end_date && project.created_at 
        ? differenceInDays(parseISO(project.estimated_end_date), parseISO(project.created_at))
        : 0;
      const actualDuration = project.actual_end_date && project.created_at
        ? differenceInDays(parseISO(project.actual_end_date), parseISO(project.created_at))
        : 0;
      
      return {
        name: `#${project.sequence_number}`,
        planned: plannedDuration,
        actual: actualDuration
      };
    });

    return {
      labels: projectDelivery.map(p => p.name),
      datasets: [
        {
          label: 'Duração Planejada (dias)',
          data: projectDelivery.map(p => p.planned),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
        },
        {
          label: 'Duração Real (dias)',
          data: projectDelivery.map(p => p.actual),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 1,
        },
      ],
    };
  }, [filteredProjects]);

  const timeStartEndDatesChartData: ChartData = useMemo(() => {
    const today = new Date();
    const projectDates = filteredProjects.map(project => {
      const estimatedDays = project.estimated_end_date 
        ? differenceInDays(parseISO(project.estimated_end_date), today)
        : 0;
      const actualDays = project.actual_end_date
        ? differenceInDays(parseISO(project.actual_end_date), today)
        : 0;
      
      return {
        name: `#${project.sequence_number}`,
        estimated: estimatedDays,
        actual: actualDays
      };
    });

    return {
      labels: projectDates.map(p => p.name),
      datasets: [
        {
          label: 'Data Planejada (dias até hoje)',
          data: projectDates.map(p => p.estimated),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 1,
        },
        {
          label: 'Data Real (dias até hoje)',
          data: projectDates.map(p => p.actual),
          backgroundColor: 'rgba(251, 191, 36, 0.8)',
          borderColor: 'rgb(251, 191, 36)',
          borderWidth: 1,
        },
      ],
    };
  }, [filteredProjects]);

  // Team Indicators Charts
  const teamProductivityChartData: ChartData = useMemo(() => {
    const productivityByAssignee = filteredTasks.reduce((acc, task) => {
      const assigneeName = task.assignee?.name || 'Não Atribuído';
      if (!acc[assigneeName]) {
        acc[assigneeName] = { completed: 0, total: 0 };
      }
      acc[assigneeName].total++;
      if (task.status === 'concluida') {
        acc[assigneeName].completed++;
      }
      return acc;
    }, {} as Record<string, { completed: number; total: number }>);

    const productivity = Object.entries(productivityByAssignee).map(([assignee, data]) => ({
      assignee,
      completed: data.completed,
      productivity: data.total > 0 ? (data.completed / data.total) * 100 : 0
    }));

    return {
      labels: productivity.map(p => p.assignee),
      datasets: [
        {
          label: 'Tarefas Concluídas',
          data: productivity.map(p => p.completed),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 1,
        },
      ],
    };
  }, [filteredTasks]);

  const teamWorkloadDistributionChartData: ChartData = useMemo(() => {
    const workloadByAssignee = filteredTasks.reduce((acc, task) => {
      const assigneeName = task.assignee?.name || 'Não Atribuído';
      if (!acc[assigneeName]) {
        acc[assigneeName] = 0;
      }
      if (task.status !== 'concluida') {
        acc[assigneeName]++;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(workloadByAssignee),
      datasets: [
        {
          label: 'Tarefas Pendentes',
          data: Object.values(workloadByAssignee),
          backgroundColor: 'rgba(251, 191, 36, 0.8)',
          borderColor: 'rgb(251, 191, 36)',
          borderWidth: 1,
        },
      ],
    };
  }, [filteredTasks]);

  const teamHoursAllocatedChartData: ChartData = useMemo(() => {
    const hoursByAssignee = filteredTasks.reduce((acc, task) => {
      const assigneeName = task.assignee?.name || 'Não Atribuído';
      if (!acc[assigneeName]) {
        acc[assigneeName] = 0;
      }
      acc[assigneeName] += (task.actual_hours || 0) / 3600; // Convert seconds to hours
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(hoursByAssignee),
      datasets: [
        {
          label: 'Horas Alocadas',
          data: Object.values(hoursByAssignee),
          backgroundColor: 'rgba(147, 51, 234, 0.8)',
          borderColor: 'rgb(147, 51, 234)',
          borderWidth: 1,
        },
      ],
    };
  }, [filteredTasks]);

  // Weekly Comparison Chart
  const weeklyComparisonChartData: ChartData = useMemo(() => {
    // Calculate metrics for current period
    const currentPeriodCompletedTasks = filteredTasks.filter(t => t.status === 'concluida').length;
    const currentPeriodTotalHours = filteredTasks.reduce((sum, task) => sum + ((task.actual_hours || 0) / 3600), 0);
    const currentPeriodTotalTasks = filteredTasks.length;
    const currentPeriodProgressPercentage = currentPeriodTotalTasks > 0 ? (currentPeriodCompletedTasks / currentPeriodTotalTasks) * 100 : 0;
    
    // Calculate metrics for previous period
    const previousPeriodCompletedTasks = previousPeriodTasks.filter(t => t.status === 'concluida').length;
    const previousPeriodTotalHours = previousPeriodTasks.reduce((sum, task) => sum + ((task.actual_hours || 0) / 3600), 0);
    const previousPeriodTotalTasks = previousPeriodTasks.length;
    const previousPeriodProgressPercentage = previousPeriodTotalTasks > 0 ? (previousPeriodCompletedTasks / previousPeriodTotalTasks) * 100 : 0;

    return {
      labels: ['Tarefas Concluídas', 'Horas Trabalhadas', 'Total de Tarefas', 'Progresso (%)'],
      datasets: [
        {
          label: 'Período Atual',
          data: [currentPeriodCompletedTasks, currentPeriodTotalHours, currentPeriodTotalTasks, currentPeriodProgressPercentage],
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
        },
        {
          label: 'Período Anterior',
          data: [previousPeriodCompletedTasks, previousPeriodTotalHours, previousPeriodTotalTasks, previousPeriodProgressPercentage],
          backgroundColor: 'rgba(156, 163, 175, 0.8)',
          borderColor: 'rgb(156, 163, 175)',
          borderWidth: 1,
        },
      ],
    };
  }, [filteredTasks, previousPeriodTasks]);

  // Project Evolution Chart
  const projectEvolutionChartData: ChartData = useMemo(() => {
    const projectEvolution = filteredProjects.map(project => {
      // Calculate current week progress
      const currentWeekTasks = filteredTasks.filter(task => task.project_id === project.id);
      const currentWeekCompletedTasks = currentWeekTasks.filter(task => task.status === 'concluida').length;
      const currentWeekProgress = currentWeekTasks.length > 0 ? (currentWeekCompletedTasks / currentWeekTasks.length) * 100 : 0;
      
      // Calculate previous week progress
      const previousWeekTasks = previousPeriodTasks.filter(task => task.project_id === project.id);
      const previousWeekCompletedTasks = previousWeekTasks.filter(task => task.status === 'concluida').length;
      const previousWeekProgress = previousWeekTasks.length > 0 ? (previousWeekCompletedTasks / previousWeekTasks.length) * 100 : 0;
      
      return {
        name: `#${project.sequence_number} - ${project.title}`,
        currentWeek: currentWeekProgress,
        previousWeek: previousWeekProgress
      };
    });

    return {
      labels: projectEvolution.map(p => p.name),
      datasets: [
        {
          label: 'Semana Passada',
          data: projectEvolution.map(p => p.previousWeek),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
        },
        {
          label: 'Semana Atual',
          data: projectEvolution.map(p => p.currentWeek),
          backgroundColor: 'rgba(251, 191, 36, 0.8)',
          borderColor: 'rgb(251, 191, 36)',
          borderWidth: 1,
        },
      ],
    };
  }, [filteredProjects, filteredTasks, previousPeriodTasks]);

  const handleProjectToggle = (projectId: number) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleAssigneeToggle = (assigneeId: string) => {
    setSelectedAssignees(prev => 
      prev.includes(assigneeId) 
        ? prev.filter(id => id !== assigneeId)
        : [...prev, assigneeId]
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
              <Link
                to="/reports/charts"
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-md"
              >
                <ChartBarIcon className="w-5 h-5" />
                <span>Estatísticas</span>
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
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Estatísticas de Projetos</h2>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Date Range Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intervalo de Datas
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Data de Início</label>
                      <input
                        type="date"
                        value={selectedStartDate}
                        onChange={(e) => setSelectedStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Data de Fim</label>
                      <input
                        type="date"
                        value={selectedEndDate}
                        onChange={(e) => setSelectedEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Período selecionado: {format(dateRange.startDate, 'dd/MM/yyyy')} a {format(dateRange.endDate, 'dd/MM/yyyy')}
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

              {/* Assignee Selection */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecionar Colaboradores
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                  <div className="space-y-2">
                    {profiles?.map((profile) => (
                      <label key={profile.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedAssignees.includes(profile.id)}
                          onChange={() => handleAssigneeToggle(profile.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {profile.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedAssignees.length === 0 ? 'Todos os colaboradores' : `${selectedAssignees.length} colaborador(es) selecionado(s)`}
                </p>
              </div>
            </div>

            {/* Generate Charts Button */}
            <div className="flex justify-center mb-8">
              <button
                onClick={() => {
                  setShowCharts(true);
                }}
                className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-primary-600 rounded-lg shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 transform hover:scale-105"
              >
                <ChartBarIcon className="w-5 h-5 mr-2" />
                Gerar Gráficos
              </button>
            </div>

            {/* Charts Grid */}
            {showCharts && (
              <div className="space-y-12">
                {/* Financial Indicators */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    💰 Indicadores Financeiros
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        Custo Planejado vs. Custo Real
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        <strong>Projetos:</strong> {selectedProjectsText}
                      </p>
                      <Bar data={financialCostComparisonChartData} options={chartOptions} />
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        Orçamento Total vs. Orçamento Utilizado
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        <strong>Projetos:</strong> {selectedProjectsText}
                      </p>
                      <Bar data={financialBudgetComparisonChartData} options={chartOptions} />
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        Retorno sobre o Investimento (ROI) por Projeto
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        <strong>Projetos:</strong> {selectedProjectsText}
                      </p>
                      <Bar data={financialROIChartData} options={chartOptions} />
                    </div>
                  </div>
                </div>

                {/* Time Indicators */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    ⏱️ Indicadores de Tempo
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        Duração Média das Tarefas por Colaborador
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        <strong>Colaboradores:</strong> {selectedAssigneesText}
                      </p>
                      <Bar data={timeAverageTaskDurationChartData} options={chartOptions} />
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        Tempo de Entrega por Projeto
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        <strong>Projetos:</strong> {selectedProjectsText}
                      </p>
                      <Bar data={timeDeliveryByPhaseChartData} options={chartOptions} />
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        Datas de Início e Fim: Reais vs. Planejadas
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        <strong>Projetos:</strong> {selectedProjectsText}
                      </p>
                      <Bar data={timeStartEndDatesChartData} options={chartOptions} />
                    </div>
                  </div>
                </div>

                {/* Team Indicators */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    🧑‍🤝‍🧑 Indicadores de Equipe
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        Produtividade por Colaborador
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        <strong>Colaboradores:</strong> {selectedAssigneesText}
                      </p>
                      <Bar data={teamProductivityChartData} options={chartOptions} />
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        Carga de Trabalho Distribuída
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        <strong>Colaboradores:</strong> {selectedAssigneesText}
                      </p>
                      <Bar data={teamWorkloadDistributionChartData} options={chartOptions} />
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        Horas Alocadas por Colaborador
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        <strong>Colaboradores:</strong> {selectedAssigneesText}
                      </p>
                      <Bar data={teamHoursAllocatedChartData} options={chartOptions} />
                    </div>
                  </div>
                </div>

                {/* Period Comparison Chart */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    Comparação de Períodos
                  </h3>
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Comparação: Período Atual vs. Período Anterior
                    </h4>
                    <div className="mb-4 text-sm text-gray-600">
                      <p>
                        <strong>Período Atual:</strong> {format(dateRange.startDate, 'dd/MM/yyyy')} a {format(dateRange.endDate,\'dd/MM/yyyy')}
                      </p>
                      <p>
                        <strong>Período Anterior:</strong> {format(previousPeriodRange.startDate, 'dd/MM/yyyy')} a {format(previousPeriodRange.endDate,\'dd/MM/yyyy')}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>Projetos:</strong> {selectedProjectsText} | <strong>Colaboradores:</strong> {selectedAssigneesText}
                    </p>
                    <Bar data={weeklyComparisonChartData} options={chartOptions} />
                  </div>
                </div>

                {/* Project Evolution Chart */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    Evolução Semanal dos Projetos
                  </h3>
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Evolução Semanal dos Projetos
                    </h4>
                    <div className="mb-4 text-sm text-gray-600">
                      <p>
                        <strong>Período Atual:</strong> {format(dateRange.startDate, 'dd/MM/yyyy')} a {format(dateRange.endDate,\'dd/MM/yyyy')}
                      </p>
                      <p>
                        <strong>Período Anterior:</strong> {format(previousPeriodRange.startDate, 'dd/MM/yyyy')} a {format(previousPeriodRange.endDate,\'dd/MM/yyyy')}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>Projetos:</strong> {selectedProjectsText} | <strong>Colaboradores:</strong> {selectedAssigneesText}
                    </p>
                    <Bar data={projectEvolutionChartData} options={chartOptions} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}