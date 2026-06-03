import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Project, Column, ProjectTask, getProjects, getProjectById, createProject, deleteProject } from '../../services/project.service';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  columns: Column[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  columns: [],
  isLoading: false,
  error: null
};

// Async thunks
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async ({ search }: { search?: string }, { rejectWithValue }) => {
    try {
      const response = await getProjects(search);
      return response.projects;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch projects');
    }
  }
);

export const fetchProjectById = createAsyncThunk(
  'projects/fetchProjectById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await getProjectById(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch project');
    }
  }
);

export const createNewProject = createAsyncThunk(
  'projects/createProject',
  async (data: { name: string; description?: string }, { rejectWithValue }) => {
    try {
      const response = await createProject(data);
      return response.project;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create project');
    }
  }
);

export const deleteExistingProject = createAsyncThunk(
  'projects/deleteProject',
  async (id: string, { rejectWithValue }) => {
    try {
      await deleteProject(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete project');
    }
  }
);

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload;
    },
    updateColumn: (state, action: PayloadAction<Column>) => {
      const index = state.columns.findIndex(c => c._id === action.payload._id);
      if (index !== -1) {
        state.columns[index] = action.payload;
      }
    },
    updateTask: (state, action: PayloadAction<{ columnId: string; task: ProjectTask }>) => {
      const column = state.columns.find(c => c._id === action.payload.columnId);
      if (column) {
        const taskIndex = column.tasks.findIndex(t => t._id === action.payload.task._id);
        if (taskIndex !== -1) {
          column.tasks[taskIndex] = action.payload.task;
        } else {
          column.tasks.push(action.payload.task);
        }
      }
    },
    removeTask: (state, action: PayloadAction<{ columnId: string; taskId: string }>) => {
      const column = state.columns.find(c => c._id === action.payload.columnId);
      if (column) {
        column.tasks = column.tasks.filter(t => t._id !== action.payload.taskId);
      }
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch projects
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action: PayloadAction<Project[]>) => {
        state.isLoading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch project by ID
      .addCase(fetchProjectById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action: PayloadAction<{ project: Project; columns: Column[] }>) => {
        state.isLoading = false;
        state.currentProject = action.payload.project;
        state.columns = action.payload.columns;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create project
      .addCase(createNewProject.fulfilled, (state, action: PayloadAction<Project>) => {
        state.projects.push(action.payload);
      })
      // Delete project
      .addCase(deleteExistingProject.fulfilled, (state, action: PayloadAction<string>) => {
        state.projects = state.projects.filter(p => p._id !== action.payload);
        if (state.currentProject?._id === action.payload) {
          state.currentProject = null;
          state.columns = [];
        }
      });
  }
});

export const { setCurrentProject, updateColumn, updateTask, removeTask, clearError } = projectSlice.actions;
export default projectSlice.reducer;

