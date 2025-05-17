import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isPast, isToday } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Database } from '../lib/database.types';
import { TaskForm } from '../components/TaskForm';
import { ImportCSV } from '../components/ImportCSV';
import { Header } from '../components/Header';

type Project = Database['public']['Tables']['projects']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];

export function BoardPage() {
  const { user } = useAuth();
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [addingTaskToProject, setAddingTaskToProject] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('position');

      if (error) throw error;
      return data as Project[];
    },
  });

  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('position');

      if (error) throw error;
      return data as Task[];
    },
  });

  const createProject = useMutation({
    mutationFn: async (title: string) => {
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            title,
            owner_id: user?.id,
            position: projects ? projects.length : 0,
          },
        ])
        .select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setNewProjectTitle('');
      setIsAddingProject(false);
      toast.success('Project created successfully');
    },
    onError: () => {
      toast.error('Failed to create project');
    },
  });

  const createTask = useMutation({
    mutationFn: async (task: TaskInsert) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert([task])
        .select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setAddingTaskToProject(null);
      toast.success('Task created successfully');
    },
    onError: () => {
      toast.error('Failed to create task');
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

    if (type === 'project') {
      const newProjects = Array.from(projects || []);
      const [removed] = newProjects.splice(source.index, 1);
      newProjects.splice(destination.index, 0, removed);

      const updates = newProjects.map((project, index) => ({
        id: project.id,
        position: index,
      }));

      const { error } = await supabase
        .from('projects')
        .upsert(updates);

      if (error) {
        toast.error('Failed to update project positions');
        return;
      }

      queryClient.setQueryData(['projects'], newProjects);
    } else if (type === 'task') {
      const sourceProjectId = source.droppableId;
      const destinationProjectId = destination.droppableId;
      const taskId = parseInt(draggableId);

      const projectTasks = tasks?.filter(t => t.project_id === parseInt(destinationProjectId)) || [];
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

  const handleImport = (projects: ProjectInsert[], tasks: TaskInsert[]) => {
    importData.mutate({ projects, tasks });
  };

  if (isLoadingProjects || isLoadingTasks) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500/10 to-primary-700/20">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">My Board</h2>
          <div className="flex space-x-4">
            <ImportCSV onImport={handleImport} />
            <button
              onClick={() => setIsAddingProject(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              New Project
            </button>
          </div>
        </div>

        {isAddingProject && (
          <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-lg p-4">
            <input
              type="text"
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              placeholder="Project title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setIsAddingProject(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={() => createProject.mutate(newProjectTitle)}
                disabled={!newProjectTitle.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        )}

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="board" type="project" direction="horizontal">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex space-x-6 overflow-x-auto pb-6"
              >
                {projects?.map((project, index) => (
                  <Draggable
                    key={project.id}
                    draggableId={String(project.id)}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-4 min-w-[300px]"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {project.title}
                          </h3>
                          <button
                            onClick={() => setAddingTaskToProject(project.id)}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            Add Task
                          </button>
                        </div>

                        {addingTaskToProject === project.id && (
                          <TaskForm
                            projectId={project.id}
                            onSubmit={(task) => createTask.mutate(task)}
                            onCancel={() => setAddingTaskToProject(null)}
                          />
                        )}

                        <Droppable droppableId={String(project.id)} type="task">
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="space-y-2"
                            >
                              {tasks
                                ?.filter((task) => task.project_id === project.id)
                                .sort((a, b) => a.position - b.position)
                                .map((task, index) => (
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
                                        className="bg-white rounded-md shadow-sm p-3 hover:shadow-md transition-shadow"
                                      >
                                        <h4 className="font-medium text-gray-900">
                                          {task.title}
                                        </h4>
                                        {task.description && (
                                          <p className="text-sm text-gray-600 mt-1">
                                            {task.description}
                                          </p>
                                        )}
                                        {task.due_date && (
                                          <p
                                            className={`text-sm mt-2 ${
                                              isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date))
                                                ? 'text-red-600'
                                                : isToday(new Date(task.due_date))
                                                ? 'text-orange-600'
                                                : 'text-gray-600'
                                            }`}
                                          >
                                            Due: {format(new Date(task.due_date), 'dd/MM/yyyy')}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </main>
    </div>
  );
}