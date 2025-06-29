/*
  # Excluir todos os registros de subtarefas

  1. Changes
    - Remove todas as tarefas que possuem parent_task_id (subtarefas)
    - Mantém apenas as tarefas principais (parent_task_id IS NULL)

  2. Security
    - Operação segura que preserva a integridade referencial
    - Remove apenas subtarefas, mantendo tarefas principais intactas
*/

-- Excluir todas as subtarefas (tarefas que possuem parent_task_id)
DELETE FROM tasks 
WHERE parent_task_id IS NOT NULL;

-- Verificar quantos registros foram removidos
-- (Esta query é apenas informativa e será executada automaticamente)
-- SELECT COUNT(*) as subtasks_remaining FROM tasks WHERE parent_task_id IS NOT NULL;