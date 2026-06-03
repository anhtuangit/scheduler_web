import { useEffect, useState } from 'react';
import { getProfile, updateProfile, getLoginHistory } from '../../services/user.service';
import { toast } from 'react-toastify';
import Icon from '../../components/Icon/Icon';
import { format } from 'date-fns';


const ProfilePage = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadProfile();
    loadLoginHistory();
  }, []);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
    }
  }, [profile]);

  const loadProfile = async () => {
    try {
      const response = await getProfile();
      setProfile(response.user);
    } catch (error: any) {
      toast.error(error || 'Tải thông tin thất bại');
    }
  };

  const loadLoginHistory = async () => {
    try {
      const response = await getLoginHistory(1, 20);
      setLoginHistory(response.history);
    } catch (error: any) {
      toast.error(error || 'Tải lịch sử đăng nhập thất bại');
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateProfile({ name });
      await loadProfile();
      setIsEditing(false);
      toast.success('Cập nhật thông tin thành công');
    } catch (error: any) {
      toast.error(error || 'Cập nhật thông tin thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">
        Hồ sơ cá nhân
      </h1>

      <div className="card mb-6 bg-[#57595B] border-2 border-gray-500 ">
        <div className="flex items-center gap-6 mb-6">
          {profile.picture ? (
            <img
              src={profile.picture}
              alt={profile.name}
              className="w-24 h-24 rounded-full border-4 border-blue-300 bg-[#F5E7C6] hover:shadow-lg hover:shadow-gray-400"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary-500 flex items-center justify-center text-white text-3xl font-bold">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input text-xl font-semibold mb-2 bg-transparent"
              />
            ) : (
              <h2 className="text-2xl font-semibold text-white mb-2">
                {profile.name}
              </h2>
            )}
            <p className="text-[#8CE4FF]">
              {profile.email}
            </p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${profile.role === 'admin'
              ? 'bg-[#FF6D28] text-[#26355D]'
              : 'bg-gray-100 text-gray-700'
              }`}>
              {profile.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
            </span>
          </div>
          <div>
            {isEditing ? (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setName(profile.name);
                  }}
                  className="btn btn-secondary"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-primary flex items-center gap-2  bg-[#393D7E] hover:bg-[#5459AC]"
              >
                <Icon icon="mdi:pencil" size={18} />
                <span>Chỉnh sửa</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-sm text-[#AEDEFC] mb-1">Trạng thái</p>
            <p className="font-medium text-white dark:text-white">
              {profile.isActive ? 'Hoạt động' : 'Đã khóa'}
            </p>
          </div>
          <div>
            <p className="text-sm text-[#AEDEFC] mb-1">Ngày tham gia</p>
            <p className="font-medium text-white dark:text-white">
              {format(new Date(profile.createdAt), 'dd/MM/yyyy')}
            </p>
          </div>
        </div>
      </div>

      <div className="card bg-[#57595B] border-2 border-gray-500">
        <h3 className="text-xl font-semibold text-white mb-4">
          Lịch sử đăng nhập
        </h3>
        <div className="space-y-2 ">
          {loginHistory.length === 0 ? (
            <p className="text-white">Chưa có lịch sử đăng nhập</p>
          ) : (
            loginHistory.map((history, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-[#37353E] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Icon icon="mdi:login" size={20} className='text-[#B6F500]' />
                  <div>
                    <p className="text-sm font-medium flex-col">
                      <div className='text-[#FF9D00]'>Ngày {format(new Date(history.loginAt), 'dd/MM/yyyy')}</div>
                      <div className='text-[#8CE4FF]'>Lúc {format(new Date(history.loginAt), 'HH:mm')} VN</div>
                    </p>
                    <p className="text-xs">
                      <div className='flex gap-1'>
                        <p>Thiết bị : </p>
                        <span>{history.userAgent.substring(0, 50)}</span>
                      </div>
                    </p>
                    <p className="text-xs">
                      <div className='flex gap-1'>
                        <p>Địa chỉ ip : </p>
                        <span>{history.ipAddress}</span>
                      </div>
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;