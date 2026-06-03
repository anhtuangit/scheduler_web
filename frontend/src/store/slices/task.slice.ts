import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Task, getTasks, createTask, updateTask, deleteTask, updateTaskTimeSlot, CreateTaskData } from '../../services/task.service';

interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TaskState = {
  tasks: [],
  selectedTask: null,
  isLoading: false,
  error: null
};

// Async thunks
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (params: { timeSlot?: string; search?: string; startDate?: string; endDate?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await getTasks(params);
      return response.tasks;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
    }
  }
);

export const createNewTask = createAsyncThunk(
  'tasks/createTask',
  async (data: CreateTaskData, { rejectWithValue }) => {
    try {
      const response = await createTask(data);
      return response.task;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create task');
    }
  }
);

export const updateExistingTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, data }: { id: string; data: Partial<CreateTaskData> }, { rejectWithValue }) => {
    try {
      const response = await updateTask(id, data);
      return response.task;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update task');
    }
  }
);

export const deleteExistingTask = createAsyncThunk(
  'tasks/deleteTask',
  async (id: string, { rejectWithValue }) => {
    try {
      await deleteTask(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete task');
    }
  }
);

export const moveTaskTimeSlot = createAsyncThunk(
  'tasks/moveTaskTimeSlot',
  async ({ id, data }: { id: string; data: { startTime?: string; endTime?: string; timeSlot?: string } }, { rejectWithValue }) => {
    try {
      const response = await updateTaskTimeSlot(id, data);
      return response.task;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to move task');
    }
  }
);

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setSelectedTask: (state, action: PayloadAction<Task | null>) => {
      state.selectedTask = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch tasks
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action: PayloadAction<Task[]>) => {
        state.isLoading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create task
      .addCase(createNewTask.fulfilled, (state, action: PayloadAction<Task>) => {
        state.tasks.push(action.payload);
      })
      // Update task
      .addCase(updateExistingTask.fulfilled, (state, action: PayloadAction<Task>) => {
        const index = state.tasks.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        if (state.selectedTask?._id === action.payload._id) {
          state.selectedTask = action.payload;
        }
      })
      // Delete task
      .addCase(deleteExistingTask.fulfilled, (state, action: PayloadAction<string>) => {
        state.tasks = state.tasks.filter(t => t._id !== action.payload);
        if (state.selectedTask?._id === action.payload) {
          state.selectedTask = null;
        }
      })
      // Move task time slot
      .addCase(moveTaskTimeSlot.fulfilled, (state, action: PayloadAction<Task>) => {
        const index = state.tasks.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      });
  }
});

export const { setSelectedTask, clearError } = taskSlice.actions;
export default taskSlice.reducer;

