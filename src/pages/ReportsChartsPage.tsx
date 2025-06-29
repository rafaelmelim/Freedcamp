import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import {
  HomeIcon,
  ArchiveBoxIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  ChartPieIcon,
  UserGroupIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement
);

interface Project {
  id: number;
  title: string;
  estimated_hours: number;
  actual_hours: number;
  estimated_value: number;
  actual_value: number;
}

interface Task {
  id: number;
  title: string;
  project_id: number;
  assignee_id: string;
  actual_hours: number;
  value: number;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    name: string;
  };
  projects?: {
    title: string;
  };
}

interface Profile {
  id: string;
  name: string;
}

interface DateRange {
  startDate: Date;
  endDate: Date;
}

export default function ReportsChartsPage() {
  const { user, signOut, hasRole } = useAuth();
  const [reportsMenuOpen, setReportsMenuOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Current filter states (what user is selecting in the UI)
  const [currentSelectedProjects, setCurrentSelectedProjects] = useState<number[]>([]);
  const [currentSelectedAssignees, setCurrentSelectedAssignees] = useState<string[]>([]);
  const [currentDateRange, setCurrentDateRange] = useState<DateRange>({
    startDate: startOfWeek(new Date(), { locale: ptBR }),
    endDate: endOfWeek(new Date(), { locale: ptBR })
  });

  // Applied filter states (what is actually used to generate charts)
  const [appliedProjects, setAppliedProjects] = useState<number[]>([]);
  const [appliedAssignees, setAppliedAssignees] = useState<string[]>([]);
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange>({
    startDate: startOfWeek(new Date(), { locale: ptBR }),
    endDate: endOfWeek(new Date(), { locale: ptBR })
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', user.id)
        .eq('archived', false);

      if (projectsError) throw projectsError;

      // Fetch tasks with assignee and project info
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          profiles:assignee_id(name),
          projects(title)
        `)
        .in('project_id', projectsData?.map(p => p.id) || [])
        .eq('archived', false);

      if (tasksError) throw tasksError;

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name');

      if (profilesError) throw profilesError;

      setProjects(projectsData || []);
      setTasks(tasksData || []);
      setProfiles(profilesData || []);

      // Set default selections for both current and applied states
      const defaultProjects = projectsData?.map(p => p.id) || [];
      const defaultAssignees = profilesData?.map(p => p.id) || [];
      
      setCurrentSelectedProjects(defaultProjects);
      setCurrentSelectedAssignees(defaultAssignees);
      setAppliedProjects(defaultProjects);
      setAppliedAssignees(defaultAssignees);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter application when "Gerar Gráficos" button is clicked
  const handleGenerateCharts = () => {
    setAppliedProjects([...currentSelectedProjects]);
    setAppliedAssignees([...currentSelectedAssignees]);
    setAppliedDateRange({ ...currentDateRange });
  };

  // Filter tasks based on applied selections and date range
  const filteredTasks = tasks.filter(task => {
    const taskDate = new Date(task.created_at);
    const inDateRange = taskDate >= appliedDateRange.startDate && taskDate <= appliedDateRange.endDate;
    const inSelectedProjects = appliedProjects.includes(task.project_id);
    const inSelectedAssignees = !task.assignee_id || appliedAssignees.includes(task.assignee_id);
    
    return inDateRange && inSelectedProjects && inSelectedAssignees;
  });

  // Chart data generators
  const generateProjectProgressChartData = () => {
    const projectData = projects
      .filter(p => appliedProjects.includes(p.id))
      .map(project => {
        const projectTasks = filteredTasks.filter(t => t.project_id === project.id);
        const completedTasks = projectTasks.filter(t => t.status === 'concluida').length;
        const totalTasks = projectTasks.length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        return {
          project: project.title,
          progress: Math.round(progress),
          completed: completedTasks,
          total: totalTasks
        };
      });

    return {
      labels: projectData.map(d => d.project),
      datasets: [
        {
          label: 'Progresso (%)',
          data: projectData.map(d => d.progress),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        }
      ]
    };
  };

  const generateTaskStatusChartData = () => {
    const statusCounts = filteredTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusLabels = {
      'nao_iniciada': 'Não Iniciada',
      'em_andamento': 'Em Andamento',
      'concluida': 'Concluída'
    };

    return {
      labels: Object.keys(statusCounts).map(status => statusLabels[status as keyof typeof statusLabels] || status),
      datasets: [
        {
          data: Object.values(statusCounts),
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(34, 197, 94, 0.8)'
          ],
          borderColor: [
            'rgba(239, 68, 68, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(34, 197, 94, 1)'
          ],
          borderWidth: 1,
        }
      ]
    };
  };

  const generateTaskPriorityChartData = () => {
    const priorityCounts = filteredTasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const priorityLabels = {
      'low': 'Baixa',
      'medium': 'Média',
      'high': 'Alta'
    };

    return {
      labels: Object.keys(priorityCounts).map(priority => priorityLabels[priority as keyof typeof priorityLabels] || priority),
      datasets: [
        {
          data: Object.values(priorityCounts),
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(239, 68, 68, 1)'
          ],
          borderWidth: 1,
        }
      ]
    };
  };

  const generateHoursComparisonChartData = () => {
    const projectData = projects
      .filter(p => appliedProjects.includes(p.id))
      .map(project => ({
        project: project.title,
        estimated: project.estimated_hours || 0,
        actual: project.actual_hours || 0
      }));

    return {
      labels: projectData.map(d => d.project),
      datasets: [
        {
          label: 'Horas Estimadas',
          data: projectData.map(d => d.estimated),
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 1,
        },
        {
          label: 'Horas Reais',
          data: projectData.map(d => d.actual),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1,
        }
      ]
    };
  };

  const generateValueComparisonChartData = () => {
    const projectData = projects
      .filter(p => appliedProjects.includes(p.id))
      .map(project => ({
        project: project.title,
        estimated: project.estimated_value || 0,
        actual: project.actual_value || 0
      }));

    return {
      labels: projectData.map(d => d.project),
      datasets: [
        {
          label: 'Valor Estimado',
          data: projectData.map(d => d.estimated),
          backgroundColor: 'rgba(139, 92, 246, 0.8)',
          borderColor: 'rgba(139, 92, 246, 1)',
          borderWidth: 1,
        },
        {
          label: 'Valor Real',
          data: projectData.map(d => d.actual),
          backgroundColor: 'rgba(236, 72, 153, 0.8)',
          borderColor: 'rgba(236, 72, 153, 1)',
          borderWidth: 1,
        }
      ]
    };
  };

  const generateTeamProductivityChartData = () => {
    const assigneeData = profiles
      .filter(p => appliedAssignees.includes(p.id))
      .map(profile => {
        const assigneeTasks = filteredTasks.filter(t => t.assignee_id === profile.id);
        const completedTasks = assigneeTasks.filter(t => t.status === 'concluida').length;
        const totalHours = assigneeTasks.reduce((sum, t) => sum + (t.actual_hours || 0), 0);

        return {
          assignee: profile.name,
          completed: completedTasks,
          hours: totalHours
        };
      });

    return {
      labels: assigneeData.map(d => d.assignee),
      datasets: [
        {
          label: 'Tarefas Concluídas',
          data: assigneeData.map(d => d.completed),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          label: 'Horas Trabalhadas',
          data: assigneeData.map(d => d.hours),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
          yAxisID: 'y1',
        }
      ]
    };
  };

  const generateTeamWorkloadDistributionChartData = () => {
    const assigneeData = profiles
      .filter(p => appliedAssignees.includes(p.id))
      .map(profile => {
        const assigneeTasks = filteredTasks.filter(t => t.assignee_id === profile.id);
        return {
          assignee: profile.name,
          tasks: assigneeTasks.length
        };
      })
      .filter(d => d.tasks > 0);

    return {
      labels: assigneeData.map(d => d.assignee),
      datasets: [
        {
          data: assigneeData.map(d => d.tasks),
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)'
          ],
          borderColor: [
            'rgba(239, 68, 68, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(34, 197, 94, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(139, 92, 246, 1)',
            'rgba(236, 72, 153, 1)'
          ],
          borderWidth: 1,
        }
      ]
    };
  };

  const generateTeamHoursAllocatedChartData = () => {
    const assigneeData = profiles
      .filter(p => appliedAssignees.includes(p.id))
      .map(profile => {
        const assigneeTasks = filteredTasks.filter(t => t.assignee_id === profile.id);
        const totalHours = assigneeTasks.reduce((sum, t) => sum + (t.actual_hours || 0), 0);

        return {
          assignee: profile.name,
          hours: totalHours
        };
      })
      .filter(d => d.hours > 0);

    return {
      labels: assigneeData.map(d => d.assignee),
      datasets: [
        {
          label: 'Horas Alocadas',
          data: assigneeData.map(d => d.hours),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1,
        }
      ]
    };
  };

  const generateWeeklyComparisonChartData = () => {
    const currentWeekTasks = filteredTasks;
    const previousWeekStart = subWeeks(appliedDateRange.startDate, 1);
    const previousWeekEnd = subWeeks(appliedDateRange.endDate, 1);
    
    const previousWeekTasks = tasks.filter(task => {
      const taskDate = new Date(task.created_at);
      const inDateRange = taskDate >= previousWeekStart && taskDate <= previousWeekEnd;
      const inSelectedProjects = appliedProjects.includes(task.project_id);
      const inSelectedAssignees = !task.assignee_id || appliedAssignees.includes(task.assignee_id);
      
      return inDateRange && inSelectedProjects && inSelectedAssignees;
    });

    const currentWeekStats = {
      completed: currentWeekTasks.filter(t => t.status === 'concluida').length,
      inProgress: currentWeekTasks.filter(t => t.status === 'em_andamento').length,
      notStarted: currentWeekTasks.filter(t => t.status === 'nao_iniciada').length,
    };

    const previousWeekStats = {
      completed: previousWeekTasks.filter(t => t.status === 'concluida').length,
      inProgress: previousWeekTasks.filter(t => t.status === 'em_andamento').length,
      notStarted: previousWeekTasks.filter(t => t.status === 'nao_iniciada').length,
    };

    return {
      labels: ['Semana Anterior', 'Semana Atual'],
      datasets: [
        {
          label: 'Concluídas',
          data: [previousWeekStats.completed, currentWeekStats.completed],
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
        },
        {
          label: 'Em Andamento',
          data: [previousWeekStats.inProgress, currentWeekStats.inProgress],
          backgroundColor: 'rgba(245, 158, 11, 0.8)',
          borderColor: 'rgba(245, 158, 11, 1)',
          borderWidth: 1,
        },
        {
          label: 'Não Iniciadas',
          data: [previousWeekStats.notStarted, currentWeekStats.notStarted],
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
        }
      ]
    };
  };

  const generateProjectEvolutionChartData = () => {
    const days = [];
    const currentDate = new Date(appliedDateRange.startDate);
    
    while (currentDate <= appliedDateRange.endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const evolutionData = days.map(day => {
      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.created_at);
        const inSelectedProjects = appliedProjects.includes(task.project_id);
        const inSelectedAssignees = !task.assignee_id || appliedAssignees.includes(task.assignee_id);
        
        return taskDate <= day && inSelectedProjects && inSelectedAssignees;
      });

      return {
        date: format(day, 'dd/MM'),
        completed: dayTasks.filter(t => t.status === 'concluida').length,
        inProgress: dayTasks.filter(t => t.status === 'em_andamento').length,
        notStarted: dayTasks.filter(t => t.status === 'nao_iniciada').length,
      };
    });

    return {
      labels: evolutionData.map(d => d.date),
      datasets: [
        {
          label: 'Concluídas',
          data: evolutionData.map(d => d.completed),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
        },
        {
          label: 'Em Andamento',
          data: evolutionData.map(d => d.inProgress),
          backgroundColor: 'rgba(245, 158, 11, 0.8)',
          borderColor: 'rgba(245, 158, 11, 1)',
          borderWidth: 1,
        },
        {
          label: 'Não Iniciadas',
          data: evolutionData.map(d => d.notStarted),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
        }
      ]
    };
  };

  // Chart data
  const projectProgressChartData = generateProjectProgressChartData();
  const taskStatusChartData = generateTaskStatusChartData();
  const taskPriorityChartData = generateTaskPriorityChartData();
  const hoursComparisonChartData = generateHoursComparisonChartData();
  const valueComparisonChartData = generateValueComparisonChartData();
  const teamProductivityChartData = generateTeamProductivityChartData();
  const teamWorkloadDistributionChartData = generateTeamWorkloadDistributionChartData();
  const teamHoursAllocatedChartData = generateTeamHoursAllocatedChartData();
  const weeklyComparisonChartData = generateWeeklyComparisonChartData();
  const projectEvolutionChartData = generateProjectEvolutionChartData();

  // Chart options
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

  const dualAxisChartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: true,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  // Helper functions for display
  const appliedProjectsText = appliedProjects.length === projects.length 
    ? 'Todos os projetos' 
    : projects.filter(p => appliedProjects.includes(p.id)).map(p => p.title).join(', ');

  const appliedAssigneesText = appliedAssignees.length === profiles.length 
    ? 'Todos os colaboradores' 
    : profiles.filter(p => appliedAssignees.includes(p.id)).map(p => p.name).join(', ');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-500/10 to-primary-700/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    );
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
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">📊 Relatórios e Gráficos</h1>
              <p className="mt-2 text-gray-600">
                Visualize o progresso dos seus projetos e equipe através de gráficos interativos
              </p>
            </header>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Filtros</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Período
                  </label>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={format(currentDateRange.startDate, 'yyyy-MM-dd')}
                      onChange={(e) => setCurrentDateRange(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="date"
                      value={format(currentDateRange.endDate, 'yyyy-MM-dd')}
                      onChange={(e) => setCurrentDateRange(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Projects */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Projetos
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={currentSelectedProjects.length === projects.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCurrentSelectedProjects(projects.map(p => p.id));
                          } else {
                            setCurrentSelectedProjects([]);
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium">Todos</span>
                    </label>
                    {projects.map(project => (
                      <label key={project.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={currentSelectedProjects.includes(project.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCurrentSelectedProjects(prev => [...prev, project.id]);
                            } else {
                              setCurrentSelectedProjects(prev => prev.filter(id => id !== project.id));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{project.title}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Assignees */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Colaboradores
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={currentSelectedAssignees.length === profiles.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCurrentSelectedAssignees(profiles.map(p => p.id));
                          } else {
                            setCurrentSelectedAssignees([]);
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium">Todos</span>
                    </label>
                    {profiles.map(profile => (
                      <label key={profile.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={currentSelectedAssignees.includes(profile.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCurrentSelectedAssignees(prev => [...prev, profile.id]);
                            } else {
                              setCurrentSelectedAssignees(prev => prev.filter(id => id !== profile.id));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{profile.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generate Charts Button */}
              <div className="flex justify-center mt-6">
                <button
                  onClick={handleGenerateCharts}
                  className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Gerar Gráficos
                </button>
              </div>
            </div>

            {/* Charts */}
            <div className="space-y-12">
              {/* Project Overview */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  📈 Visão Geral dos Projetos
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Progresso dos Projetos
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>Projetos:</strong> {appliedProjectsText}
                    </p>
                    <Bar data={projectProgressChartData} options={chartOptions} />
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Status das Tarefas
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>Período:</strong> {format(appliedDateRange.startDate, 'dd/MM/yyyy')} a {format(appliedDateRange.endDate, 'dd/MM/yyyy')}
                    </p>
                    <Pie data={taskStatusChartData} options={chartOptions} />
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Prioridade das Tarefas
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>Período:</strong> {format(appliedDateRange.startDate, 'dd/MM/yyyy')} a {format(appliedDateRange.endDate, 'dd/MM/yyyy')}
                    </p>
                    <Pie data={taskPriorityChartData} options={chartOptions} />
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Comparação de Horas
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>Projetos:</strong> {appliedProjectsText}
                    </p>
                    <Bar data={hoursComparisonChartData} options={chartOptions} />
                  </div>
                </div>
              </div>

              {/* Financial Overview */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  💰 Visão Financeira
                </h3>
                <div className="grid grid-cols-1 gap-8">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Comparação de Valores
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>Projetos:</strong> {appliedProjectsText}
                    </p>
                    <Bar data={valueComparisonChartData} options={chartOptions} />
                  </div>
                </div>
              </div>

              {/* Team Performance */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  👥 Performance da Equipe
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Produtividade da Equipe
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>Colaboradores:</strong> {appliedAssigneesText}
                    </p>
                    <Bar data={teamProductivityChartData} options={dualAxisChartOptions} />
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Distribuição de Carga de Trabalho
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>Colaboradores:</strong> {appliedAssigneesText}
                    </p>
                    <Pie data={teamWorkloadDistributionChartData} options={chartOptions} />
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Horas Alocadas por Colaborador
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>Colaboradores:</strong> {appliedAssigneesText}
                    </p>
                    <Bar data={teamHoursAllocatedChartData} options={chartOptions} />
                  </div>
                </div>
              </div>

              {/* Weekly Comparison */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  📊 Comparação Semanal
                </h3>
                <div className="grid grid-cols-1 gap-8">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Comparação com a Semana Anterior
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>Período:</strong> {format(appliedDateRange.startDate, 'dd/MM/yyyy')} a {format(appliedDateRange.endDate, 'dd/MM/yyyy')}
                    </p>
                    <Bar data={weeklyComparisonChartData} options={stackedChartOptions} />
                  </div>
                </div>
              </div>

              {/* Project Evolution */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  📈 Evolução dos Projetos
                </h3>
                <div className="grid grid-cols-1 gap-8">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Progresso dos Projetos
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>Projetos:</strong> {appliedProjectsText}
                    </p>
                    <Bar data={projectEvolutionChartData} options={stackedChartOptions} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}