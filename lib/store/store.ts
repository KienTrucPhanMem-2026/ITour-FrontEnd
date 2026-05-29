import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./slices/counterSlice";
import notificationReducer from "./slices/notificationSlice";

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    notifications: notificationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
