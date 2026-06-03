import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { logout } from '../../store/slices/auth.slice';
import Icon from '../Icon/Icon';

const Layout = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <aside className="w-64 bg-gray-800 shadow-lg text-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-400 flex gap-2 items-center">
            <Icon icon="lucide:calendar" size={40} />
            <p className="text-3xl">Schedule</p>
          </h1>
        </div>

        <nav className="px-4 space-y-2">
          <Link
            to="/tasks"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-700 focus:bg-gray-700 focus:border-l-4 transition-colors"
          >
            <Icon icon="mdi:calendar-check" size={20} />
            <span>Công việc cá nhân</span>
          </Link>

          <Link
            to="/projects"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-700 focus:bg-gray-700 focus:border-l-4 transition-colors"
          >
            <Icon icon="mdi:folder-multiple" size={20} />
            <span>Dự án nhóm</span>
          </Link>

          <Link
            to="/labels"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-700 focus:bg-gray-700 focus:border-l-4 transition-colors"
          >
            <Icon icon="mdi:label" size={20} />
            <span>Nhãn dán</span>
          </Link>

          <Link
            to="/profile"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-700 focus:bg-gray-700 focus:border-l-4 transition-colors"
          >
            <Icon icon="mdi:account" size={20} />
            <span>Hồ sơ</span>
          </Link>

          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-700 focus:bg-gray-700 focus:border-l-4 transition-colors"
            >
              <Icon icon="mdi:shield-crown" size={20} />
              <span>Quản trị</span>
            </Link>
          )}
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-10 h-10 rounded-full border-2 border-blue-300"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-900 rounded-lg transition-colors"
          >
            <Icon icon="mdi:logout" size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto text-white">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;