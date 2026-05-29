// ============================================================
// notificationSlice — Redux state cho thông báo
// ============================================================

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { NotificationDTO } from "@/types/api";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
} from "@/lib/api/notifications";

// ---- State ----
interface NotificationState {
  items: NotificationDTO[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

// ---- Async Thunks ----

/** Load tất cả thông báo của customer */
export const loadNotifications = createAsyncThunk(
  "notifications/loadAll",
  async (customerId: string, { rejectWithValue }) => {
    try {
      return await fetchNotifications(customerId);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

/** Đánh dấu một thông báo là đã đọc */
export const readNotification = createAsyncThunk(
  "notifications/readOne",
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await markAsRead(notificationId);
      return notificationId;
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

/** Đánh dấu tất cả thông báo đã đọc */
export const readAllNotifications = createAsyncThunk(
  "notifications/readAll",
  async (customerId: string, { rejectWithValue }) => {
    try {
      await markAllAsRead(customerId);
      return true;
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

// ---- Slice ----
const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    /** Thêm thông báo mới realtime (nếu dùng WebSocket sau này) */
    addNotification(state, action: PayloadAction<NotificationDTO>) {
      state.items.unshift(action.payload);
      if (!action.payload.read) state.unreadCount += 1;
    },
    clearNotifications(state) {
      state.items = [];
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    // loadNotifications
    builder
      .addCase(loadNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.unreadCount = action.payload.filter((n) => !n.read).length;
      })
      .addCase(loadNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // readNotification
    builder.addCase(readNotification.fulfilled, (state, action) => {
      const idx = state.items.findIndex((n) => n.id === action.payload);
      if (idx !== -1 && !state.items[idx].read) {
        state.items[idx].read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    });

    // readAllNotifications
    builder.addCase(readAllNotifications.fulfilled, (state) => {
      state.items.forEach((n) => (n.read = true));
      state.unreadCount = 0;
    });
  },
});

export const { addNotification, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
