import api from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: 'user' | 'admin';
}

export interface AuthResponse {
  message: string;
  user: User;
}

/**
 * Google Sign-In
 */
export const googleSignIn = async (token: string): Promise<AuthResponse> => {
  console.log('🔄 Calling /auth/google endpoint...');
  const response = await api.post<AuthResponse>('/auth/google', { token });
  console.log('✅ Login response received');
  console.log('✅ Response headers:', {
    'set-cookie': response.headers['set-cookie'] ? 'Present' : 'Missing'
  });
  return response.data;
};

/**
 * Get current user
 */
export const getCurrentUser = async (): Promise<{ user: User }> => {
  try {
    const response = await api.get<{ user: User }>('/auth/me');
    console.log('✅ getCurrentUser success:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ getCurrentUser error:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Logout
 */
export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
};

