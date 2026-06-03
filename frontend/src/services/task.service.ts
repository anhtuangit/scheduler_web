import api from './api';

export interface Label {
  _id: string;
  name: string;
  color: string;
  type: 'task_type' | 'status' | 'difficulty' | 'priority';
  icon: string;
  description?: string;
}

export interface Subtask {
  _id?: string;
  title: string;
  completed: boolean;
  order: number;
}

export interface Task {
  _id: string;
  userId: string;
  title: string;
  shortDescription?: string;
  detailedDescription?: string;
  startTime: string;
  endTime: string;
  timeSlot: 'morning' | 'noon' | 'afternoon' | 'evening';
  labels: Label[];
  attachments: string[];
  subtasks: Subtask[];
  emailReminder?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskData {
  title: string;
  shortDescription?: string;
  detailedDescription?: string;
  startTime: string;
  endTime: string;
  labels?: string[];
  attachments?: string[];
  subtasks?: Subtask[];
  emailReminder?: string;
}

/**
 * Get all tasks
 */
export const getTasks = async (params?: {
  timeSlot?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ tasks: Task[] }> => {
  const response = await api.get<{ tasks: Task[] }>('/tasks', { params });
  return response.data;
};

/**
 * Get task by ID
 */
export const getTaskById = async (id: string): Promise<{ task: Task }> => {
  const response = await api.get<{ task: Task }>(`/tasks/${id}`);
  return response.data;
};

/**
 * Create task
 */
export const createTask = async (data: CreateTaskData): Promise<{ message: string; task: Task }> => {
  const response = await api.post<{ message: string; task: Task }>('/tasks', data);
  return response.data;
};

/**
 * Update task
 */
export const updateTask = async (id: string, data: Partial<CreateTaskData>): Promise<{ message: string; task: Task }> => {
  const response = await api.put<{ message: string; task: Task }>(`/tasks/${id}`, data);
  return response.data;
};

/**
 * Delete task
 */
export const deleteTask = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/tasks/${id}`);
  return response.data;
};

/**
 * Update task time slot (drag and drop)
 */
export const updateTaskTimeSlot = async (
  id: string,
  data: { startTime?: string; endTime?: string; timeSlot?: string }
): Promise<{ message: string; task: Task }> => {
  const response = await api.patch<{ message: string; task: Task }>(`/tasks/${id}/time-slot`, data);
  return response.data;
};

/**
 * Upload file
 */
export const uploadFile = async (taskId: string, file: File): Promise<{ file: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<{ file: string; message: string; attachments: string[] }>(`/tasks/${taskId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

/**
 * Delete attachment
 */
export const deleteAttachment = async (taskId: string, filename: string): Promise<{ message: string; attachments: string[] }> => {
  const response = await api.delete<{ message: string; attachments: string[] }>(`/tasks/${taskId}/attachments/${filename}`);
  return response.data;
};

