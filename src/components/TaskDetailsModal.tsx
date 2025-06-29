import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database, TaskPriority, TaskStatus } from '../lib/database.types';
import { TaskComments } from './TaskComments';
import { TimeTracking } from './TimeTracking';
import { SubtaskForm } from './SubtaskForm';
import { formatSecondsToHHMMSS, parseHHMMSSToSeconds } from '../lib/utils';
import { ConfirmationModal } from './ConfirmationModal';
import { toast } from 'react-hot-toast';
import { PaperClipIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskAttachment = Database['public']['Tables']['task_attachments']['Row'];

interface TaskDetailsModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: number, data: Partial<Task>) => void;
  onDelete: (taskId: number) => void;
}

const priorityColors: Record<TaskPriority, string> = {
  high: 'bg-red-100 text-red-800 ring-red-600/20',
  medium: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
  low: 'bg-blue-100 text-blue-800 ring-blue-600/20',
};

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'concluida', label: 'Concluída' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'nao_iniciada', label: 'Não iniciada' },
];

function TaskDetailsModal({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: TaskDetailsModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    attachmentId: number;
    fileName: string;
  }>({
    isOpen: false,
    attachmentId: 0,
    fileName: '',
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      title: task.title,
      description: task.description || '',
      due_date: task.due_date || '',
      priority: task.priority,
      status: task.status || 'nao_iniciada',
      value: task.value || '',
      actual_hours: formatSecondsToHHMMSS(task.actual_hours),
    },
  });

  // Fetch attachments for this task
  const { data: attachments, isLoading: isLoadingAttachments } = useQuery({
    queryKey: ['task-attachments', task.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_attachments')
        .select('*')
        .eq('task_id', task.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TaskAttachment[];
    },
  });

  // Upload attachment mutation
  const uploadAttachmentMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${task.id}/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('task-attachments')
        .getPublicUrl(filePath);

      // Insert record into task_attachments table
      const { error: insertError } = await supabase
        .from('task_attachments')
        .insert([{
          task_id: task.id,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          file_type: file.type,
          owner_id: user?.id,
        }]);

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-attachments', task.id] });
      toast.success('Anexo enviado com sucesso');
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar anexo');
    },
  });

  // Delete attachment mutation
  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachment: TaskAttachment) => {
      // Extract file path from URL
      const url = new URL(attachment.file_url);
      const filePath = url.pathname.split('/').slice(-2).join('/'); // Get last two parts (task_id/filename)

      // Delete file from storage
      const { error: deleteError } = await supabase.storage
        .from('task-attachments')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      // Delete record from database
      const { error: dbError } = await supabase
        .from('task_attachments')
        .delete()
        .eq('id', attachment.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-attachments', task.id] });
      setDeleteConfirmation({ isOpen: false, attachmentId: 0, fileName: '' });
      toast.success('Anexo removido com sucesso');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      setDeleteConfirmation({ isOpen: false, attachmentId: 0, fileName: '' });
      toast.error('Erro ao remover anexo');
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleUploadClick = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error('Selecione pelo menos um arquivo');
      return;
    }

    setIsUploading(true);
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        await uploadAttachmentMutation.mutateAsync(selectedFiles[i]);
      }
      // Clear selected files
      setSelectedFiles(null);
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (attachment: TaskAttachment) => {
    try {
      // Extract file path from URL
      const url = new URL(attachment.file_url);
      const filePath = url.pathname.split('/').slice(-2).join('/');

      const { data, error } = await supabase.storage
        .from('task-attachments')
        .download(filePath);

      if (error) throw error;

      // Create download link
      const downloadUrl = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = attachment.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Erro ao baixar anexo');
    }
  };

  const onSubmit = (data: any) => {
    // Exclude actual_hours from the update to preserve its original value
    const { actual_hours, ...updateData } = data;
    onUpdate(task.id, updateData);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="grid min-h-full place-items-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  {task.parent_task_id ? 'Detalhes da Subtarefa' : 'Detalhes da Tarefa'}
                </Dialog.Title>

                {task.parent_task_id ? (
                  // Render SubtaskForm for subtasks
                  <SubtaskForm
                    projectId={task.project_id!}
                    parentTaskId={task.parent_task_id}
                    initialData={task}
                    onSubmit={async () => {}} // Not used in edit mode
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onCancel={onClose}
                  />
                ) : (
                  // Render regular task form for main tasks
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      {...register('title', { required: 'Title is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <textarea
                      {...register('description')}
                      placeholder="Description"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        {...register('due_date')}
                        min={format(new Date(), 'yyyy-MM-dd')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        {...register('priority')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status da Tarefa
                    </label>
                    <select
                      {...register('status')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor da Tarefa (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('value', {
                        setValueAs: (value) => value === '' ? null : parseFloat(value)
                      })}
                      placeholder="0,00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horas Realizadas (hh:mm:ss)
                    </label>
                    <input
                      type="text"
                      {...register('actual_hours', {
                        setValueAs: (value) => value === '' || value === '00:00:00' ? null : parseHHMMSSToSeconds(value)
                      })}
                      placeholder="00:00:00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <TimeTracking taskId={task.id} />
                  </div>

                  {/* Attachments Section */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <PaperClipIcon className="w-4 h-4 mr-2" />
                      Anexos
                    </h4>
                    
                    {/* File Upload */}
                    <div className="mb-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                      <div className="flex items-center gap-2">
                        <input
                          id="file-input"
                          type="file"
                          multiple
                          onChange={handleFileSelect}
                          className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                        />
                        <button
                          type="button"
                          onClick={handleUploadClick}
                          disabled={!selectedFiles || selectedFiles.length === 0 || isUploading}
                          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUploading ? 'Enviando...' : 'Enviar'}
                        </button>
                      </div>
                      {selectedFiles && selectedFiles.length > 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                          {selectedFiles.length} arquivo(s) selecionado(s)
                        </div>
                      )}
                    </div>

                    {/* Attachments List */}
                    <div className="space-y-2">
                      {isLoadingAttachments ? (
                        <div className="text-sm text-gray-500">Carregando anexos...</div>
                      ) : attachments && attachments.length > 0 ? (
                        attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-md border"
                          >
                            <div className="flex items-center space-x-3">
                              <PaperClipIcon className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {attachment.file_name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatFileSize(attachment.file_size)} • {format(new Date(attachment.created_at!), 'dd/MM/yyyy HH:mm')}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleDownload(attachment)}
                                className="p-1 text-gray-400 hover:text-primary-600 focus:outline-none"
                                title="Baixar anexo"
                              >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                              </button>
                              {attachment.owner_id === user?.id && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteConfirmation({
                                      isOpen: true,
                                      attachmentId: attachment.id,
                                      fileName: attachment.file_name,
                                    });
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-600 focus:outline-none"
                                  title="Remover anexo"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 text-center py-4">
                          Nenhum anexo encontrado
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Comments</h4>
                    <TaskComments taskId={task.id} />
                  </div>

                  <div className="flex justify-between pt-4">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this task?')) {
                            onDelete(task.id);
                            onClose();
                          }
                        }}
                        className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        Delete Task
                      </button>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </form>
                )}

                {/* Delete Attachment Confirmation Modal */}
                <ConfirmationModal
                  isOpen={deleteConfirmation.isOpen}
                  onClose={() => setDeleteConfirmation({ isOpen: false, attachmentId: 0, fileName: '' })}
                  onConfirm={() => {
                    const attachment = attachments?.find(a => a.id === deleteConfirmation.attachmentId);
                    if (attachment) {
                      deleteAttachmentMutation.mutate(attachment);
                    }
                  }}
                  title="Excluir Anexo"
                  message={`Tem certeza que deseja excluir o anexo "${deleteConfirmation.fileName}"? Esta ação não pode ser desfeita.`}
                  confirmText="Confirmar exclusão"
                  isLoading={deleteAttachmentMutation.isPending}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export { TaskDetailsModal }