import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HomeIcon, ArchiveBoxIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, Bars3Icon } from '@heroicons/react/24/outline';

interface NavLinkProps {
  to: string;
  icon: React.ElementType;
  children: React.ReactNode;
  onClick?: () => void;
}

const NavLink = ({ to, icon: Icon, children, onClick }: NavLinkProps) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
  >
    <Icon className="w-5 h-5" />
    <span>{children}</span>
  </Link>
);

export function Header() {
  const { signOut, hasRole } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">
              Freedcamp
            </h1>
          </div>
          <nav className="flex items-center space-x-4 ml-auto">
            {hasRole('admin') && (
              <NavLink to="/admin" icon={Cog6ToothIcon}>Settings</NavLink>
            )}
            <NavLink to="#" icon={ArrowRightOnRectangleIcon} onClick={signOut}>Sign out</NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
}