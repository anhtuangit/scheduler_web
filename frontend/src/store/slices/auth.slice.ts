import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { googleSignIn, getCurrentUser, logout as logoutService, User } from '../../services/auth.service';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
};

// Async thunks
export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await googleSignIn(token);
      return response.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getCurrentUser();
      return response.user;
    } catch (error: any) {
      // Don't treat 401 as error if user is not logged in (normal case)
      if (error.response?.status === 401) {
        return rejectWithValue(null); // Return null instead of error message
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await logoutService();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login with Google
      .addCase(loginWithGoogle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action: PayloadAction<User>) => {
        console.log('✅ Redux: loginWithGoogle.fulfilled, setting user and isAuthenticated=true');
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      })
      // Fetch current user
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<User>) => {
        console.log('✅ Redux: fetchCurrentUser.fulfilled, setting user and isAuthenticated=true');
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        console.log('⚠️ Redux: fetchCurrentUser.rejected, payload:', action.payload);
        console.log('⚠️ Current auth state - isAuthenticated:', state.isAuthenticated, 'user:', state.user?.email);
        state.isLoading = false;
        // Only set error if it's not a 401 (user not logged in is normal)
        if (action.payload !== null) {
          state.error = action.payload as string;
        }
        // Don't clear authentication state if user was already authenticated
        // This prevents logout when fetchCurrentUser fails after successful login
        if (!state.isAuthenticated) {
          console.log('⚠️ Clearing auth state because user was not authenticated');
          state.isAuthenticated = false;
          state.user = null;
        } else {
          console.log('✅ Keeping auth state because user was already authenticated');
        }
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  }
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;

