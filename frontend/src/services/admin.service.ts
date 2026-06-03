import api from './api';
import { User, LoginHistory } from './user.service';

export interface SystemStatistics {
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  tasks: {
    total: number;
  };
  projects: {
    total: number;
  };
  tasksByStatus: Array<{
    _id: string;
    count: number;
  }>;
  topProjectOwners: Array<{
    _id: string;
    ownerName: string;
    count: number;
  }>;
}

export interface SystemConfig {
  _id: string;
  appName: string;
  theme: 'light' | 'dark';
  primaryColor: string;
  updatedBy?: string;
  updatedAt: string;
}

/**
 * Get all users (Admin)
 */
export const getUsers = async (params?: {
  search?: string;
  role?: string;
  isActive?: string;
  page?: number;
  limit?: number;
}): Promise<{
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

/**
 * Toggle user status (Admin)
 */
export const toggleUserStatus = async (userId: string, isActive: boolean): Promise<{ message: string; user: User }> => {
  const response = await api.patch<{ message: string; user: User }>(`/admin/users/${userId}/status`, { isActive });
  return response.data;
};

/**
 * Get system statistics (Admin)
 */
export const getStatistics = async (): Promise<SystemStatistics> => {
  const response = await api.get<SystemStatistics>('/admin/statistics');
  return response.data;
};

/**
 * Get system configuration (Admin)
 */
export const getSystemConfig = async (): Promise<{ config: SystemConfig }> => {
  const response = await api.get<{ config: SystemConfig }>('/admin/config');
  return response.data;
};

/**
 * Update system configuration (Admin)
 */
export const updateSystemConfig = async (data: {
  appName?: string;
  theme?: 'light' | 'dark';
  primaryColor?: string;
}): Promise<{ message: string; config: SystemConfig }> => {
  const response = await api.put<{ message: string; config: SystemConfig }>('/admin/config', data);
  return response.data;
};

/**
 * Get user login history (Admin)
 */
export const getUserLoginHistory = async (userId: string, page?: number, limit?: number): Promise<{
  history: LoginHistory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> => {
  const response = await api.get(`/admin/users/${userId}/login-history`, { params: { page, limit } });
  return response.data;
};

