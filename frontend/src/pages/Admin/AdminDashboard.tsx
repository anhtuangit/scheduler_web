import { useEffect, useState } from 'react';
import { getUsers, toggleUserStatus, getStatistics, getSystemConfig, updateSystemConfig } from '../../services/admin.service';
import { toast } from 'react-toastify';
import Icon from '../../components/Icon/Icon';

const AdminDashboard = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'statistics' | 'config'>('users');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, statsRes, configRes] = await Promise.all([
        getUsers({ search: searchTerm }),
        getStatistics(),
        getSystemConfig()
      ]);
      setUsers(usersRes.users);
      setStatistics(statsRes);
      setConfig(configRes.config);
    } catch (error: any) {
      toast.error(error || 'Tải dữ liệu thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await toggleUserStatus(userId, !isActive);
      toast.success(`Đã ${!isActive ? 'Mở Khóa' : 'Khóa'} người dùng`);
      loadData();
    } catch (error: any) {
      toast.error(error || 'Thao tác thất bại');
    }
  };

  const handleUpdateConfig = async (data: any) => {
    try {
      await updateSystemConfig(data);
      toast.success('Cập nhật cấu hình thành công');
      loadData();
    } catch (error: any) {
      toast.error(error || 'Cập nhật cấu hình thất bại');
    }
  };

  if (isLoading && !statistics) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-900 min-h-screen">
      <h1 className="text-3xl font-bold text-slate-100 mb-6">
        Quản trị hệ thống
      </h1>

      <div className="flex gap-4 mb-6 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'users'
            ? 'text-indigo-400 border-b-2 border-indigo-400'
            : 'text-slate-400'
            }`}
        >
          Người dùng
        </button>
        <button
          onClick={() => setActiveTab('statistics')}
          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'statistics'
            ? 'text-indigo-400 border-b-2 border-indigo-400'
            : 'text-slate-400'
            }`}
        >
          Thống kê
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'config'
            ? 'text-indigo-400 border-b-2 border-indigo-400'
            : 'text-slate-400'
            }`}
        >
          Cấu hình
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input max-w-md bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                    Tên
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                    Vai trò
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                    Trạng thái
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id} className="border-b border-slate-800">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {user.picture ? (
                          <img
                            src={user.picture}
                            alt={user.name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm">
                            {user.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-medium text-slate-100">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {user.email}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'admin'
                        ? 'bg-purple-900 text-purple-300'
                        : 'bg-slate-700 text-slate-300'
                        }`}>
                        {user.role === 'admin' ? 'Quản trị' : 'Người dùng'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${user.isActive
                        ? 'bg-green-900 text-green-300'
                        : 'bg-red-900 text-red-300'
                        }`}>
                        {user.isActive ? 'Hoạt động' : 'Đã Khóa'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                        className={`btn text-sm ${user.isActive
                          ? 'bg-red-700 hover:bg-red-600 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          }`}
                        disabled={user.role === 'admin'}
                      >
                        {user.isActive ? 'Khóa' : 'Mở khóa'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'statistics' && statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-900 flex items-center justify-center">
                <Icon icon="mdi:account-group" size={24} className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Tổng người dùng</p>
                <p className="text-2xl font-bold text-slate-100">
                  {statistics.users.total}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-900 flex items-center justify-center">
                <Icon icon="mdi:check-circle" size={24} className="text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Tổng công việc</p>
                <p className="text-2xl font-bold text-slate-100">
                  {statistics.tasks.total}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-900 flex items-center justify-center">
                <Icon icon="mdi:folder-multiple" size={24} className="text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Tổng dự án</p>
                <p className="text-2xl font-bold text-slate-100">
                  {statistics.projects.total}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'config' && config && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-slate-100 mb-4">
            Cấu hình hệ thống
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Tên ứng dụng
              </label>
              <input
                type="text"
                defaultValue={config.appName}
                onBlur={(e) => handleUpdateConfig({ appName: e.target.value })}
                className="input bg-slate-700 border-slate-600 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Theme
              </label>
              <select
                defaultValue={config.theme}
                onChange={(e) => handleUpdateConfig({ theme: e.target.value })}
                className="input bg-slate-700 border-slate-600 text-slate-100"
              >
                <option value="light">Sáng</option>
                <option value="dark">Tối</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Màu chủ đề
              </label>
              <input
                type="color"
                defaultValue={config.primaryColor}
                onChange={(e) => handleUpdateConfig({ primaryColor: e.target.value })}
                className="w-20 h-10 rounded bg-slate-700"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;