import { useEffect, useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import { loginWithGoogle } from '../../store/slices/auth.slice';
import { toast } from 'react-toastify';
import Icon from '../../components/Icon/Icon';

const LandingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch<AppDispatch>();
    const { isAuthenticated, isLoading, error, user } = useSelector((state: RootState) => state.auth);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const features = [
        {
            icon: 'mdi:calendar-check',
            title: 'Quản lý công việc cá nhân',
            description: 'Tổ chức và theo dõi các công việc của bạn một cách hiệu quả'
        },
        {
            icon: 'mdi:folder-multiple',
            title: 'Dự án nhóm',
            description: 'Cộng tác với team và quản lý dự án chung dễ dàng'
        },
        {
            icon: 'mdi:label',
            title: 'Nhãn dán thông minh',
            description: 'Phân loại và lọc công việc theo nhãn tùy chỉnh'
        },
        {
            icon: 'mdi:shield-check',
            title: 'Bảo mật cao',
            description: 'Đăng nhập an toàn với Google OAuth 2.0'
        }
    ];

    useEffect(() => {
        setShowLoginModal(location.pathname === '/login');
    }, [location]);

    useEffect(() => {
        if (isAuthenticated && !isLoading && user) {
            navigate('/tasks', { replace: true });
        }
    }, [isAuthenticated, isLoading, user, navigate]);

    useEffect(() => {
        if (error) toast.error(error);
    }, [error]);

    useEffect(() => {
        if (!showLoginModal) return;

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
                await dispatch(loginWithGoogle(response.credential)).unwrap();
                toast.success('Đăng nhập thành công!');
                navigate('/tasks', { replace: true });
            } catch (error: any) {
                toast.error(error || 'Đăng nhập thất bại');
            }
        };

        loadGoogleScript();
    }, [dispatch, navigate, showLoginModal]);

    const handleCloseModal = () => {
        navigate('/', { replace: true });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800">
            <header className="fixed top-0 w-full bg-gray-900/80 backdrop-blur-lg border-b border-gray-800 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
                            <Icon icon="mdi:calendar-check" size={24} className="text-white" />
                        </div>
                        <span className="text-2xl font-bold text-blue-400">Schedule</span>
                    </div>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <Icon icon="mdi:login" size={20} />
                        Đăng nhập
                    </button>
                </div>
            </header>
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                        Quản lý công việc
                        <span className="text-blue-400"> hiệu quả</span>
                    </h1>
                    <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                        Nền tảng quản lý công việc cá nhân và nhóm giúp bạn tổ chức, theo dõi và hoàn thành mọi nhiệm vụ một cách dễ dàng
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg shadow-blue-600/50"
                    >
                        Bắt đầu miễn phí
                    </button>
                </div>
            </section>

            <section className="py-16 px-6 bg-gray-900/50">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            Xem Demo Ứng Dụng
                        </h2>
                        <p className="text-gray-400 text-lg">
                            Khám phá các tính năng nổi bật của Schedule
                        </p>
                    </div>

                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-700 aspect-video">
                        <iframe
                            className="w-full h-full"
                            src="https://www.youtube.com/embed/yBGkorlPMqY"
                            title="Schedule App Demo"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>

                    <p className="text-center text-gray-500 text-sm mt-4">
                    </p>
                </div>
            </section>

            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            Tính năng nổi bật
                        </h2>
                        <p className="text-gray-400 text-lg">
                            Mọi thứ bạn cần để quản lý công việc hiệu quả
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-all hover:transform hover:scale-105"
                            >
                                <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center mb-4">
                                    <Icon icon={feature.icon} size={28} className="text-blue-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-400">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl p-12">
                    <h2 className="text-4xl font-bold text-white mb-4">
                        Sẵn sàng bắt đầu?
                    </h2>
                    <p className="text-blue-100 text-lg mb-8">
                        Đăng ký ngay hôm nay và trải nghiệm quản lý công việc hiệu quả
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-8 py-4 bg-white text-blue-600 text-lg rounded-xl font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
                    >
                        Đăng nhập với Google
                    </button>
                </div>
            </section>

            <footer className="border-t border-gray-800 py-8 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <p className="text-gray-500">
                        © 2025 Schedule App. All rights reserved.
                    </p>
                </div>
            </footer>

            {showLoginModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="max-w-md w-full relative animate-in fade-in zoom-in duration-300">
                        <button
                            onClick={handleCloseModal}
                            className="absolute -top-4 -right-4 w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-white border-2 border-gray-700 transition-colors z-10"
                        >
                            <Icon icon="mdi:close" size={24} />
                        </button>

                        <div className="bg-gray-50 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700 p-10">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 shadow-md mb-6">
                                    <Icon icon="mdi:calendar-check" size={40} className="text-white" />
                                </div>
                                <h1 className="text-3xl font-bold mb-2 text-blue-500 dark:text-blue-400">
                                    Đăng nhập
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPage;