import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Header() {
  const { signOut, hasRole } = useAuth();

  return (
    <header className="app-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-semibold text-gray-900 hover-effect">
              Freedcamp
            </h1>
            <nav className="flex space-x-4">
              <Link
                to="/board"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 
                         transition-colors duration-200 hover-effect"
              >
                Board
              </Link>
              <Link
                to="/archived"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 
                         transition-colors duration-200 hover-effect"
              >
                Archived
              </Link>
              {hasRole('admin') && (
                <Link
                  to="/admin"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 
                           transition-colors duration-200 hover-effect"
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 
                     transition-colors duration-200 hover-effect"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}