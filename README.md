# Freedcamp - Project Management Application

A modern, feature-rich project management application built with React, TypeScript, and Supabase.

## Features

### Project Management
- Create and manage multiple projects
- Drag-and-drop project reordering
- Real-time updates using Supabase

### Task Management
- Create, edit, and delete tasks
- Assign priorities (Low, Medium, High)
- Set due dates
- Add descriptions
- Mark tasks as complete
- Archive tasks for later reference
- Drag-and-drop task reordering within and between projects

### Task Organization
- Label system with custom colors
- Task filtering by:
  - Search term
  - Completion status
  - Due date (Overdue, Today, Upcoming)
  - Priority level
- Task statistics and analytics

### Time Tracking
- Start/stop time tracking for tasks
- View time entry history
- Calculate total time spent on tasks
- Automatic duration calculation

### Comments
- Add comments to tasks
- Edit and delete your own comments
- Real-time comment updates

### Data Management
- Import projects and tasks via CSV
- Export tasks to CSV
- Archive and restore tasks
- Permanent task deletion

### User Management
- Role-based access control
- Admin dashboard for user management
- Assign and manage user roles
- Update user profiles

### Security
- Authentication using Supabase Auth
- Row Level Security (RLS) policies
- Role-based route protection

## Tech Stack

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

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/        # Reusable UI components
├── contexts/         # React context providers
├── lib/             # Utility functions and types
├── pages/           # Page components
└── main.tsx         # Application entry point
```

### Key Components

- `BoardPage`: Main project board with task management
- `AdminPage`: User and role management interface
- `ArchivedTasksPage`: View and manage archived tasks
- `TaskDetailsModal`: Task editing and management
- `TimeTracking`: Task time tracking functionality
- `TaskStatistics`: Task analytics and metrics
- `TaskFilters`: Task filtering and search

## Database Schema

The application uses the following tables:

- `profiles`: User profiles
- `projects`: Project information
- `tasks`: Task details
- `labels`: Task labels
- `task_labels`: Task-label associations
- `comments`: Task comments
- `time_entries`: Time tracking records
- `roles`: User roles
- `user_roles`: User-role associations

## Security

The application implements comprehensive security measures:

- Row Level Security (RLS) policies on all tables
- Role-based access control
- Protected routes based on user roles
- Secure authentication flow

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License