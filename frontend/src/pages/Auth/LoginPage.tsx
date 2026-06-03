import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../store/store';
import { loginWithGoogle } from '../../store/slices/auth.slice';
import { toast } from 'react-toastify';
import Icon from '../../components/Icon/Icon';

const LoginPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated && !isLoading && user) {
      setTimeout(() => {
        navigate('/tasks', { replace: true });
      }, 100);
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    const loadGoogleScript = () => {
      if (!(window as any).google) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
        script.onload = initializeGoogleSignIn;
      } else initializeGoogleSignIn();
    };

    const initializeGoogleSignIn = () => {
      const google = (window as any).google;
      if (!google) return console.error('Google Sign-In chưa sẵn sàng');
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
      if (!clientId) {
        toast.error('Chưa cấu hình Google Client ID');
        return;
      }

      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        ux_mode: 'popup',
      });

      const buttonElement = document.getElementById('google-signin-button');
      if (buttonElement) {
        google.accounts.id.renderButton(buttonElement, {
          theme: 'outline',
          size: 'large',
          width: 300,
          text: 'signin_with',
          locale: 'vi',
        });
      }
    };

    const handleCredentialResponse = async (response: { credential: string }) => {
      try {
        const result = await dispatch(loginWithGoogle(response.credential)).unwrap();
        toast.success('Đăng nhập thành công!');
        navigate('/tasks', { replace: true });
      } catch (error: any) {
        toast.error(error || 'Đăng nhập thất bại');
      }
    };

    loadGoogleScript();
  }, [dispatch, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 dark:from-black dark:via-gray-950 dark:to-gray-900">
      <div className="max-w-md w-full mx-4 relative z-10">
        <div className="bg-gray-50 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/40 border border-gray-700 p-10 transition-all duration-300">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 shadow-md mb-6">
              <Icon icon="mdi:calendar-check" size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2 text-blue-500 dark:text-blue-400">
              Schedule
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Quản lý công việc cá nhân và nhóm
            </p>
          </div>

          <div className="space-y-6">
            <div id="google-signin-button" className="flex justify-center"></div>

            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 dark:border-gray-600 border-t-blue-500"></div>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Đăng nhập nhanh và bảo mật
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-center text-gray-500 dark:text-gray-500 mt-8">
            Bằng cách đăng nhập, bạn đồng ý với các điều khoản sử dụng
          </p>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-gray-300 text-sm underline"
          >
            ← Quay lại trang chủ
          </button>
        </div>

        <div className="text-center mt-4">
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            © 2025 Schedule App. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;