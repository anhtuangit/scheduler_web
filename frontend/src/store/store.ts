import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/auth.slice';
import taskSlice from './slices/task.slice';
import projectSlice from './slices/project.slice';
import labelSlice from './slices/label.slice';
import systemSlice from './slices/system.slice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    tasks: taskSlice,
    projects: projectSlice,
    labels: labelSlice,
    system: systemSlice
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

