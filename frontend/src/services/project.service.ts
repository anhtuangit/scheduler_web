import api from './api';
import { Label, Subtask } from './task.service';

export interface ProjectMember {
  userId: string;
  role: 'viewer' | 'editor';
  joinedAt: string;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  ownerId: {
    _id: string;
    name: string;
    email: string;
    picture?: string;
  };
  members: Array<{
    userId: {
      _id: string;
      name: string;
      email: string;
      picture?: string;
    };
    role: 'viewer' | 'editor';
    joinedAt: string;
  }>;
  columns: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  _id: string;
  projectId: string;
  name: string;
  order: number;
  tasks: ProjectTask[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTaskComment {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    picture?: string;
  };
  content: string;
  createdAt: string;
}

export interface ProjectTask {
  _id: string;
  projectId: string;
  columnId: string;
  title: string;
  shortDescription?: string;
  detailedDescription?: string;
  labels: Label[];
  attachments: string[];
  subtasks: Subtask[];
  comments: ProjectTaskComment[];
  emailReminder?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all projects
 */
export const getProjects = async (search?: string): Promise<{ projects: Project[] }> => {
  const response = await api.get<{ projects: Project[] }>('/projects', { params: { search } });
  return response.data;
};

/**
 * Get project by ID
 */
export const getProjectById = async (id: string): Promise<{ project: Project; columns: Column[] }> => {
  const response = await api.get<{ project: Project; columns: Column[] }>(`/projects/${id}`);
  return response.data;
};

/**
 * Create project
 */
export const createProject = async (data: { name: string; description?: string }): Promise<{ message: string; project: Project }> => {
  const response = await api.post<{ message: string; project: Project }>('/projects', data);
  return response.data;
};

/**
 * Update project
 */
export const updateProject = async (id: string, data: { name?: string; description?: string }): Promise<{ message: string; project: Project }> => {
  const response = await api.put<{ message: string; project: Project }>(`/projects/${id}`, data);
  return response.data;
};

/**
 * Delete project
 */
export const deleteProject = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/projects/${id}`);
  return response.data;
};

/**
 * Add member to project
 */
export const addMember = async (projectId: string, data: { userId: string; role?: 'viewer' | 'editor' }): Promise<{ message: string; project: Project }> => {
  const response = await api.post<{ message: string; project: Project }>(`/projects/${projectId}/members`, data);
  return response.data;
};

/**
 * Invite member to project by email
 */
export const inviteMemberByEmail = async (projectId: string, data: { email: string; role?: 'viewer' | 'editor' }): Promise<{ message: string; project?: Project }> => {
  const response = await api.post<{ message: string; project?: Project }>(`/projects/${projectId}/members/invite`, data);
  return response.data;
};

/**
 * Update member role
 */
export const updateMemberRole = async (projectId: string, userId: string, role: 'viewer' | 'editor'): Promise<{ message: string; project: Project }> => {
  const response = await api.put<{ message: string; project: Project }>(`/projects/${projectId}/members/${userId}/role`, { role });
  return response.data;
};

/**
 * Remove member from project
 */
export const removeMember = async (projectId: string, userId: string): Promise<{ message: string; project: Project }> => {
  const response = await api.delete<{ message: string; project: Project }>(`/projects/${projectId}/members/${userId}`);
  return response.data;
};

/**
 * Create column
 */
export const createColumn = async (projectId: string, data: { name: string }): Promise<{ message: string; column: Column }> => {
  const response = await api.post<{ message: string; column: Column }>(`/projects/${projectId}/columns`, data);
  return response.data;
};

/**
 * Update column
 */
export const updateColumn = async (columnId: string, data: { name?: string; order?: number }): Promise<{ message: string; column: Column }> => {
  const response = await api.put<{ message: string; column: Column }>(`/projects/columns/${columnId}`, data);
  return response.data;
};

/**
 * Delete column
 */
export const deleteColumn = async (columnId: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/projects/columns/${columnId}`);
  return response.data;
};

/**
 * Create project task
 */
export const createProjectTask = async (columnId: string, data: {
  title: string;
  shortDescription?: string;
  detailedDescription?: string;
  labels?: string[];
  attachments?: string[];
  subtasks?: Subtask[];
  emailReminder?: string;
}): Promise<{ message: string; task: ProjectTask }> => {
  const response = await api.post<{ message: string; task: ProjectTask }>(`/projects/columns/${columnId}/tasks`, data);
  return response.data;
};

/**
 * Update project task
 */
export const updateProjectTask = async (taskId: string, data: Partial<{
  title: string;
  shortDescription?: string;
  detailedDescription?: string;
  labels?: string[];
  attachments?: string[];
  subtasks?: Subtask[];
  emailReminder?: string;
}>): Promise<{ message: string; task: ProjectTask }> => {
  const response = await api.put<{ message: string; task: ProjectTask }>(`/projects/tasks/${taskId}`, data);
  return response.data;
};

/**
 * Delete project task
 */
export const deleteProjectTask = async (taskId: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/projects/tasks/${taskId}`);
  return response.data;
};

/**
 * Move task
 */
export const moveTask = async (taskId: string, data: { columnId?: string; newOrder?: number }): Promise<{ message: string; task: ProjectTask }> => {
  const response = await api.patch<{ message: string; task: ProjectTask }>(`/projects/tasks/${taskId}/move`, data);
  return response.data;
};

/**
 * Add comment
 */
export const addComment = async (taskId: string, data: { content: string }): Promise<{ message: string; task: ProjectTask }> => {
  const response = await api.post<{ message: string; task: ProjectTask }>(`/projects/tasks/${taskId}/comments`, data);
  return response.data;
};

/**
 * Delete comment
 */
export const deleteComment = async (taskId: string, commentId: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/projects/tasks/${taskId}/comments/${commentId}`);
  return response.data;
};

/**
 * Upload file to project task
 */
export const uploadProjectTaskFile = async (taskId: string, file: File): Promise<{ file: string; message: string; attachments: string[] }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<{ file: string; message: string; attachments: string[] }>(`/projects/tasks/${taskId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

/**
 * Delete attachment from project task
 */
export const deleteProjectTaskAttachment = async (taskId: string, attachmentUrl: string): Promise<{ message: string; task: ProjectTask }> => {
  const response = await api.delete<{ message: string; task: ProjectTask }>(`/projects/tasks/${taskId}/attachments`, {
    data: { attachmentUrl }
  });
  return response.data;
};

