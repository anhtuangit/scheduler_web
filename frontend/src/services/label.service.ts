import api from './api';

export interface Label {
  _id: string;
  name: string;
  color: string;
  type: 'task_type' | 'status' | 'difficulty' | 'priority';
  icon: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all labels
 */
export const getLabels = async (type?: string): Promise<{ labels: Label[] }> => {
  const response = await api.get<{ labels: Label[] }>('/labels', { params: { type } });
  return response.data;
};

/**
 * Get label by ID
 */
export const getLabelById = async (id: string): Promise<{ label: Label }> => {
  const response = await api.get<{ label: Label }>(`/labels/${id}`);
  return response.data;
};

