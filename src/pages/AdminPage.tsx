import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { HomeIcon, ArchiveBoxIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, EnvelopeIcon, UsersIcon, ComputerDesktopIcon, ArrowDownTrayIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export function AdminPage() {
  const { signOut, hasRole } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500/10 to-primary-700/20">
      <Header />
      <div className="flex h-screen pt-16">
        <aside className="w-64 bg-white border-r border-gray-200 fixed left-0 top-16 bottom-0 overflow-y-auto">
          <nav className="p-4 space-y-2">
            <div className="pb-4 mb-4 border-b border-gray-200">
              <Link
                to="/board"
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                <HomeIcon className="w-5 h-5" />
                <span>My Board</span>
              </Link>
              <Link
                to="/archived"
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                <ArchiveBoxIcon className="w-5 h-5" />
                <span>Archived</span>
              </Link>
            </div>
            <div className="pt-4 mt-4 border-t border-gray-200">
              {hasRole('admin') && (<>
                <Link
                  to="/admin"
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-md"
                >
                  <Cog6ToothIcon className="w-5 h-5" />
                  <span>Settings</span>
                </Link>
                <div className="mt-2 pl-4 space-y-2">
                  <Link
                    to="/admin/email"
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    <EnvelopeIcon className="w-5 h-5" />
                    <span>E-mail</span>
                  </Link>
                  <Link
                    to="/admin/user-profiles"
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    <UserCircleIcon className="w-5 h-5" />
                    <span>Perfis de Usuários</span>
                  </Link>
                  <Link
                    to="/admin/users"
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    <UsersIcon className="w-5 h-5" />
                    <span>Usuários</span>
                  </Link>
                  <Link
                    to="/admin/system"
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    <ComputerDesktopIcon className="w-5 h-5" />
                    <span>Sistema</span>
                  </Link>
                  <Link
                    to="/admin/import-export"
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    <span>Importação e Exportação</span>
                  </Link>
                </div>
              </>)}
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md w-full text-left"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span>Sign out</span>
              </button>
            </div>
          </nav>
        </aside>
        <main className="flex-1 ml-64 p-8 space-y-8">
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-600">Select a settings category from the menu on the left.</p>
        </main>
      </div>
    </div>
  );
}