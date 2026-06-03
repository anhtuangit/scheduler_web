import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getSystemConfig, SystemConfig } from '../../services/admin.service';

interface SystemState {
  config: SystemConfig | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SystemState = {
  config: null,
  isLoading: false,
  error: null
};

// Async thunks
export const fetchSystemConfig = createAsyncThunk(
  'system/fetchConfig',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getSystemConfig();
      return response.config;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch system config');
    }
  }
);

const systemSlice = createSlice({
  name: 'system',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      if (state.config) {
        state.config.theme = action.payload;
      }
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSystemConfig.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSystemConfig.fulfilled, (state, action: PayloadAction<SystemConfig>) => {
        state.isLoading = false;
        state.config = action.payload;
      })
      .addCase(fetchSystemConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { setTheme, clearError } = systemSlice.actions;
export default systemSlice.reducer;

