import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Label, getLabels } from '../../services/label.service';

interface LabelState {
  labels: Label[];
  isLoading: boolean;
  error: string | null;
}

const initialState: LabelState = {
  labels: [],
  isLoading: false,
  error: null
};

// Async thunks
export const fetchLabels = createAsyncThunk(
  'labels/fetchLabels',
  async (type: string | undefined, { rejectWithValue }) => {
    try {
      const response = await getLabels(type);
      return response.labels;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch labels');
    }
  }
);

const labelSlice = createSlice({
  name: 'labels',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLabels.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLabels.fulfilled, (state, action: PayloadAction<Label[]>) => {
        state.isLoading = false;
        state.labels = action.payload;
      })
      .addCase(fetchLabels.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearError } = labelSlice.actions;
export default labelSlice.reducer;

