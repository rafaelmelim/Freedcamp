# Freedcamp - Aplicação de Gerenciamento de Projetos

Uma aplicação moderna e rica em recursos para gerenciamento de projetos, construída com React, TypeScript e Supabase.

## Funcionalidades

### Gerenciamento de Projetos
- Criar e gerenciar múltiplos projetos
- Reordenação de projetos por arrastar e soltar
- Atualizações em tempo real usando Supabase

### Gerenciamento de Tarefas
- Criar, editar e excluir tarefas
- Definir prioridades (Baixa, Média, Alta)
- Estabelecer prazos
- Adicionar descrições
- Marcar tarefas como concluídas
- Arquivar tarefas para referência futura
- Reordenação de tarefas por arrastar e soltar dentro e entre projetos

### Organização de Tarefas
- Sistema de etiquetas com cores personalizadas
- Filtragem de tarefas por:
  - Termo de busca
  - Status de conclusão
  - Data de vencimento (Atrasadas, Hoje, Próximas)
  - Nível de prioridade
- Estatísticas e análises de tarefas

### Controle de Tempo
- Iniciar/parar rastreamento de tempo para tarefas
- Visualizar histórico de registros de tempo
- Calcular tempo total gasto em tarefas
- Cálculo automático de duração

### Comentários
- Adicionar comentários às tarefas
- Editar e excluir seus próprios comentários
- Atualizações de comentários em tempo real

### Gerenciamento de Dados
- Importar projetos e tarefas via CSV
- Exportar tarefas para CSV
- Arquivar e restaurar tarefas
- Exclusão permanente de tarefas

### Gerenciamento de Usuários
- Controle de acesso baseado em funções
- Painel administrativo para gerenciamento de usuários
- Atribuir e gerenciar funções de usuários
- Atualizar perfis de usuários

### Segurança
- Autenticação usando Supabase Auth
- Políticas de segurança em nível de linha (RLS)
- Proteção de rotas baseada em funções

## Stack Tecnológica

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- React Query
- React Router
- React Beautiful DND
- React Hook Form
- HeadlessUI
- Date-fns

## Como Começar

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente em `.env`:
   ```
   VITE_SUPABASE_URL=sua_url_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima_supabase
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Estrutura do Projeto

```
src/
├── components/        # Componentes UI reutilizáveis
├── contexts/         # Provedores de contexto React
├── lib/             # Funções utilitárias e tipos
├── pages/           # Componentes de página
└── main.tsx         # Ponto de entrada da aplicação
```

### Componentes Principais

- `BoardPage`: Quadro principal com gerenciamento de tarefas
- `AdminPage`: Interface de gerenciamento de usuários e funções
- `ArchivedTasksPage`: Visualização e gerenciamento de tarefas arquivadas
- `TaskDetailsModal`: Edição e gerenciamento de tarefas
- `TimeTracking`: Funcionalidade de rastreamento de tempo de tarefas
- `TaskStatistics`: Análises e métricas de tarefas
- `TaskFilters`: Filtragem e busca de tarefas

## Esquema do Banco de Dados

A aplicação utiliza as seguintes tabelas:

- `profiles`: Perfis de usuários
- `projects`: Informações de projetos
- `tasks`: Detalhes das tarefas
- `labels`: Etiquetas de tarefas
- `task_labels`: Associações entre tarefas e etiquetas
- `comments`: Comentários das tarefas
- `time_entries`: Registros de tempo
- `roles`: Funções de usuários
- `user_roles`: Associações entre usuários e funções

## Segurança

A aplicação implementa medidas abrangentes de segurança:

- Políticas de segurança em nível de linha (RLS) em todas as tabelas
- Controle de acesso baseado em funções
- Rotas protegidas baseadas em funções de usuário
- Fluxo seguro de autenticação

## Contribuindo

1. Faça um fork do repositório
2. Crie um branch para sua feature
3. Faça commit das suas alterações
4. Faça push para o branch
5. Crie um Pull Request

## Licença

Licença MIT