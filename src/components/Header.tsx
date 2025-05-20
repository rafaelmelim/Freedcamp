import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HomeIcon, FolderIcon, ChartBarIcon, CogIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const NavButton = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Link
    to={to}
    className="px-4 py-2 text-sm font-medium text-white bg-blue-600/20 rounded-md 
             hover:bg-blue-600/30 transition-colors duration-200"
  >
    {children}
  </Link>
);

const SidebarLink = ({ to, icon: Icon, children }: { to: string; icon: React.ElementType; children: React.ReactNode }) => (
  <Link
    to={to}
    className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-md"
  >
    <Icon className="w-5 h-5" />
    <span>{children}</span>
  </Link>
);

export function Header() {
  const { signOut, hasRole } = useAuth();

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="p-4">
          <h1 className="text-xl font-semibold text-blue-600 mb-8">Freedcamp</h1>
          <nav className="space-y-2">
            <SidebarLink to="/board" icon={HomeIcon}>Dashboard</SidebarLink>
            <SidebarLink to="/projects" icon={FolderIcon}>Projects</SidebarLink>
            <SidebarLink to="/archived" icon={ChartBarIcon}>Archived</SidebarLink>
            {hasRole('admin') && (
              <SidebarLink to="/admin" icon={CogIcon}>Settings</SidebarLink>
            )}
            <button
              onClick={() => signOut()}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-md w-full text-left"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span>Sign out</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top header */}
        <header className="bg-blue-50 shadow-sm">
          <div className="px-4 py-4">
            <h2 className="text-xl font-semibold text-blue-600">My Board</h2>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <></>
        </main>
      </div>
    </div>
  );
}