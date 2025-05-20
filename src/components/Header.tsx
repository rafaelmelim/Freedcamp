import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HomeIcon, ArchiveBoxIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const NavLink = ({ to, icon: Icon, children }: { to: string; icon: React.ElementType; children: React.ReactNode }) => (
  <Link
    to={to}
    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
  >
    <Icon className="w-5 h-5" />
    <span>{children}</span>
  </Link>
);

export function Header() {
  const { signOut, hasRole } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-semibold text-gray-900">
              My Board
            </h1>
            <nav className="flex items-center space-x-4">
              <NavLink to="/board" icon={HomeIcon}>Dashboard</NavLink>
              <NavLink to="/archived" icon={ArchiveBoxIcon}>Archived</NavLink>
              {hasRole('admin') && (
                <NavLink to="/admin" icon={Cog6ToothIcon}>Settings</NavLink>
              )}
            </nav>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}