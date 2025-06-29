import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format, startOfWeek, endOfWeek, subWeeks, addDays } from 'date-fns';
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
  LineElement,
  PointElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
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
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
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

      // Set default selections
      setSelectedProjects(projectsData?.map(p => p.id) || []);
      setSelectedAssignees(profilesData?.map(p => p.id) || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks based on selections and date range
  const filteredTasks = tasks.filter(task => {
    const taskDate = new Date(task.created_at);
    const inDateRange = taskDate >= dateRange.startDate && taskDate <= dateRange.endDate;
    const inSelectedProjects = selectedProjects.includes(task.project_id);
    const inSelectedAssignees = !task.assignee_id || selectedAssignees.includes(task.assignee_id);
    
    return inDateRange && inSelectedProjects && inSelectedAssignees;
  });

  // Chart data generators
  const generateProjectProgressChartData = () => {
    const projectData = projects
      .filter(p => selectedProjects.includes(p.id))
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
      .filter(p => selectedProjects.includes(p.id))
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
      .filter(p => selectedProjects.includes(p.id))
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
      .filter(p => selectedAssignees.includes(p.id))
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
      .filter(p => selectedAssignees.includes(p.id))
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
      .filter(p => selectedAssignees.includes(p.id))
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
    const previousWeekStart = subWeeks(dateRange.startDate, 1);
    const previousWeekEnd = subWeeks(dateRange.endDate, 1);
    
    const previousWeekTasks = tasks.filter(task => {
      const taskDate = new Date(task.created_at);
      const inDateRange = taskDate >= previousWeekStart && taskDate <= previousWeekEnd;
      const inSelectedProjects = selectedProjects.includes(task.project_id);
      const inSelectedAssignees = !task.assignee_id || selectedAssignees.includes(task.assignee_id);
      
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
    const currentDate = new Date(dateRange.startDate);
    
    while (currentDate <= dateRange.endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const evolutionData = days.map(day => {
      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.created_at);
        const inSelectedProjects = selectedProjects.includes(task.project_id);
        const inSelectedAssignees = !task.assignee_id || selectedAssignees.includes(task.assignee_id);
        
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
  const selectedProjectsText = selectedProjects.length === projects.length 
    ? 'Todos os projetos' 
    : projects.filter(p => selectedProjects.includes(p.id)).map(p => p.title).join(', ');

  const selectedAssigneesText = selectedAssignees.length === profiles.length 
    ? 'Todos os colaboradores' 
    : profiles.filter(p => selectedAssignees.includes(p.id)).map(p => p.name).join(', ');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📊 Relatórios e Gráficos</h1>
          <p className="mt-2 text-gray-600">
            Visualize o progresso dos seus projetos e equipe através de gráficos interativos
          </p>
        </header>

        <main>
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
                    value={format(dateRange.startDate, 'yyyy-MM-dd')}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={format(dateRange.endDate, 'yyyy-MM-dd')}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      checked={selectedProjects.length === projects.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProjects(projects.map(p => p.id));
                        } else {
                          setSelectedProjects([]);
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
                        checked={selectedProjects.includes(project.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProjects(prev => [...prev, project.id]);
                          } else {
                            setSelectedProjects(prev => prev.filter(id => id !== project.id));
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
                      checked={selectedAssignees.length === profiles.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAssignees(profiles.map(p => p.id));
                        } else {
                          setSelectedAssignees([]);
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
                        checked={selectedAssignees.includes(profile.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAssignees(prev => [...prev, profile.id]);
                          } else {
                            setSelectedAssignees(prev => prev.filter(id => id !== profile.id));
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
                    <strong>Projetos:</strong> {selectedProjectsText}
                  </p>
                  <Bar data={projectProgressChartData} options={chartOptions} />
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Status das Tarefas
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Período:</strong> {format(dateRange.startDate, 'dd/MM/yyyy')} a {format(dateRange.endDate, \'dd/MM/yyyy')}
                  </p>
                  <Pie data={taskStatusChartData} options={chartOptions} />
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Prioridade das Tarefas
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Período:</strong> {format(dateRange.startDate, 'dd/MM/yyyy')} a {format(dateRange.endDate, \'dd/MM/yyyy')}
                  </p>
                  <Pie data={taskPriorityChartData} options={chartOptions} />
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Comparação de Horas
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Projetos:</strong> {selectedProjectsText}
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
                    <strong>Projetos:</strong> {selectedProjectsText}
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
                    <strong>Colaboradores:</strong> {selectedAssigneesText}
                  </p>
                  <Bar data={teamProductivityChartData} options={dualAxisChartOptions} />
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Distribuição de Carga de Trabalho
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Colaboradores:</strong> {selectedAssigneesText}
                  </p>
                  <Pie data={teamWorkloadDistributionChartData} options={chartOptions} />
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
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
                    <strong>Período:</strong> {format(dateRange.startDate, 'dd/MM/yyyy')} a {format(dateRange.endDate, \'dd/MM/yyyy')}
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
                    <strong>Projetos:</strong> {selectedProjectsText}
                  </p>
                  <Bar data={projectEvolutionChartData} options={stackedChartOptions} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}