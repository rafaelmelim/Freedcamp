import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NavButton = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Link
    to={to}
    className="px-4 py-2 text-sm font-medium text-white bg-blue-600/20 rounded-md 
             hover:bg-blue-600/30 transition-colors duration-200"
  >
    {children}
  </Link>
);

export function Header() {
  const { signOut, hasRole } = useAuth();

  return (
    <header className="bg-blue-50 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-semibold text-blue-600">
              Freedcamp
            </h1>
            <nav className="flex space-x-4">
              <NavButton to="/board">Board</NavButton>
              <NavButton to="/archived">Archived</NavButton>
              {hasRole('admin') && (
                <NavButton to="/admin">Admin</NavButton>
              )}
            </nav>
          </div>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 
                     transition-colors duration-200"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}